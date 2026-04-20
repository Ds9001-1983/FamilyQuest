import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, insertRewardSchema, type User } from "@shared/schema";

// Serializer for User rows that cross the API boundary. Never expose password
// hashes, the synthetic username, or the pin hash — the pin is a 4–6 digit number
// and its bcrypt hash is offline-crackable, so it must never leak.
function publicUser(u: User) {
  const { password: _p, username: _u, pinHash, ...rest } = u;
  return { ...rest, hasPin: !!pinHash };
}
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { requireAuth, requireParent, signAccessToken, signRefreshToken, verifyToken } from "./auth";
import { sendPush } from "./push";

// Brute-force protection for credential-accepting endpoints. Scoped by IP.
// Production deployments typically sit behind a proxy (`trust proxy` is set below),
// so req.ip resolves to the real client address.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Zu viele Versuche, bitte später erneut probieren" },
});

const pinSetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Zu viele PIN-Änderungen, bitte später erneut probieren" },
});

const BCRYPT_ROUNDS = 12;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  familyName: z.string().trim().min(1).max(100),
  parentName: z.string().trim().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1).max(128),
});

declare module "express-session" {
  interface SessionData {
    familyId?: number;
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const isProd = process.env.NODE_ENV === "production";

  // Lightweight healthcheck for load balancers / container orchestrators.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (isProd) {
      throw new Error("SESSION_SECRET must be set in production");
    }
    console.warn(
      "[auth] SESSION_SECRET is not set. Using an ephemeral dev secret; all sessions will be invalidated on restart.",
    );
  }

  if (isProd) {
    app.set("trust proxy", 1);
  }

  const PostgresSession = connectPg(session);
  app.use(session({
    store: new PostgresSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "session",
    }),
    name: "lm.sid",
    secret: sessionSecret || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  const buildAuthResponse = (
    user: Awaited<ReturnType<typeof storage.getUser>>,
    family: Awaited<ReturnType<typeof storage.getFamilyById>>,
    role: "parent" | "child" = "parent",
  ) => ({
    id: family!.id,
    userId: user!.id,
    familyName: family!.familyName,
    email: family!.email,
    isSetupComplete: family!.isSetupComplete,
    role,
    name: user!.name,
  });

  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe", errors: parsed.error.errors });
    }
    const { email, password, familyName, parentName } = parsed.data;

    try {
      const existing = await storage.getFamilyByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "E-Mail ist bereits registriert" });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const { family, parent } = await storage.createFamilyWithParent(
        {
          email: email.toLowerCase(),
          password: passwordHash,
          familyName,
        },
        { name: parentName ?? familyName },
      );

      const ctx = { familyId: family.id, userId: parent.id, role: "parent" as const };
      const accessToken = signAccessToken(ctx);
      const refreshToken = signRefreshToken(ctx);

      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.error("Session regenerate error:", regenErr);
          return res.status(500).json({ message: "Registrierung fehlgeschlagen" });
        }
        req.session.familyId = family.id;
        req.session.userId = parent.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Registrierung fehlgeschlagen" });
          }
          res.status(201).json({
            ...buildAuthResponse(parent, family),
            accessToken,
            refreshToken,
          });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe" });
    }
    const { email, password } = parsed.data;

    try {
      const family = await storage.getFamilyByEmail(email.toLowerCase());
      // Always run bcrypt.compare to equalize timing even if the family does not exist.
      const fakeHash = "$2b$12$" + "a".repeat(53);
      const valid = family
        ? await bcrypt.compare(password, family.password)
        : await bcrypt.compare(password, fakeHash).then(() => false);

      if (!family || !valid) {
        return res.status(401).json({ message: "E-Mail oder Passwort ist falsch" });
      }

      const parent = await storage.getParentOfFamily(family.id);
      if (!parent) {
        return res.status(500).json({ message: "Elternkonto nicht gefunden" });
      }

      req.session.regenerate((regenErr) => {
        if (regenErr) {
          console.error("Session regenerate error:", regenErr);
          return res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
        }
        req.session.familyId = family.id;
        req.session.userId = parent.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
          }
          res.json(buildAuthResponse(parent, family));
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Abmeldung fehlgeschlagen" });
      }
      res.clearCookie("lm.sid");
      res.json({ message: "Erfolgreich abgemeldet" });
    });
  });

  // Token-based login for native clients (Expo / React Native).
  // Returns an access + refresh token instead of setting a cookie.
  app.post("/api/auth/token", authLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe" });
    }
    const { email, password } = parsed.data;

    try {
      const family = await storage.getFamilyByEmail(email.toLowerCase());
      const fakeHash = "$2b$12$" + "a".repeat(53);
      const valid = family
        ? await bcrypt.compare(password, family.password)
        : await bcrypt.compare(password, fakeHash).then(() => false);

      if (!family || !valid) {
        return res.status(401).json({ message: "E-Mail oder Passwort ist falsch" });
      }
      const parent = await storage.getParentOfFamily(family.id);
      if (!parent) {
        return res.status(500).json({ message: "Elternkonto nicht gefunden" });
      }

      const ctx = { familyId: family.id, userId: parent.id, role: "parent" as const };
      res.json({
        accessToken: signAccessToken(ctx),
        refreshToken: signRefreshToken(ctx),
        user: buildAuthResponse(parent, family, "parent"),
      });
    } catch (error) {
      console.error("Token login error:", error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  // Child PIN login. familyId + userId are obtained by the Parent app after their own
  // login and cached on the device, so this endpoint does not need to expose a
  // family-directory search.
  const childLoginSchema = z.object({
    familyId: z.number().int().positive(),
    userId: z.number().int().positive(),
    pin: z.string().regex(/^\d{4,6}$/, "PIN muss 4–6 Ziffern haben"),
  });

  app.post("/api/auth/child/token", authLimiter, async (req, res) => {
    const parsed = childLoginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe" });
    }
    const { familyId, userId, pin } = parsed.data;

    try {
      const user = await storage.getUser(userId);
      const family = await storage.getFamilyById(familyId);

      // Equalize timing regardless of which check fails.
      const fakeHash = "$2b$12$" + "a".repeat(53);
      const match =
        user && user.familyId === familyId && !user.isParent && user.pinHash
          ? await bcrypt.compare(pin, user.pinHash)
          : await bcrypt.compare(pin, fakeHash).then(() => false);

      if (!family || !user || !match) {
        return res.status(401).json({ message: "Falscher PIN" });
      }

      const ctx = { familyId: family.id, userId: user.id, role: "child" as const };
      res.json({
        accessToken: signAccessToken(ctx),
        refreshToken: signRefreshToken(ctx),
        user: buildAuthResponse(user, family, "child"),
      });
    } catch (error) {
      console.error("Child login error:", error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    const schema = z.object({ refreshToken: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Eingabe" });
    }
    const payload = verifyToken(parsed.data.refreshToken, "refresh");
    if (!payload) {
      return res.status(401).json({ message: "Refresh-Token ungültig oder abgelaufen" });
    }

    const family = await storage.getFamilyById(payload.familyId);
    const user = await storage.getUser(payload.userId);
    if (!family || !user || user.familyId !== family.id) {
      return res.status(401).json({ message: "Konto nicht mehr vorhanden" });
    }

    // Revalidate role: a child whose PIN has been cleared by a parent should no longer
    // be able to refresh a child session.
    if (payload.role === "child" && !user.pinHash) {
      return res.status(401).json({ message: "Kind-Zugang wurde entfernt" });
    }

    const ctx = { familyId: family.id, userId: user.id, role: payload.role };
    res.json({
      accessToken: signAccessToken(ctx),
      refreshToken: signRefreshToken(ctx),
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const family = await storage.getFamilyById(req.auth!.familyId);
      const user = await storage.getUser(req.auth!.userId);
      if (!family || !user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Nicht angemeldet" });
      }
      res.json(buildAuthResponse(user, family, req.auth!.role));
    } catch (error) {
      console.error("Me error:", error);
      res.status(500).json({ message: "Konto konnte nicht geladen werden" });
    }
  });

  // Apple App Store requires in-app account deletion.
  app.post("/api/auth/delete-account", authLimiter, requireAuth, requireParent, async (req, res) => {
    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Passwort erforderlich" });
    }

    try {
      const family = await storage.getFamilyById(req.auth!.familyId);
      if (!family) {
        return res.status(404).json({ message: "Familie nicht gefunden" });
      }

      const valid = await bcrypt.compare(parsed.data.password, family.password);
      if (!valid) {
        return res.status(401).json({ message: "Passwort ist falsch" });
      }

      await storage.deleteFamily(family.id);

      req.session.destroy((err) => {
        if (err) {
          console.error("Delete session error:", err);
        }
        res.clearCookie("lm.sid");
        res.json({ message: "Konto wurde gelöscht" });
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Kontolöschung fehlgeschlagen" });
    }
  });

  const setupSchema = z.object({
    children: z.array(
      z.object({
        name: z.string().trim().min(1).max(100),
        age: z.number().int().min(0).max(25),
      }),
    ),
    rewards: z.array(
      z.object({
        name: z.string().trim().min(1).max(100),
        description: z.string().max(500).optional(),
        xpCost: z.number().int().min(0).max(1_000_000),
      }),
    ),
  });

  app.post("/api/family/setup", requireAuth, requireParent, async (req, res) => {
    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Setup-Daten", errors: parsed.error.errors });
    }

    try {
      const familyId = req.auth!.familyId;
      const userId = req.auth!.userId;
      const { children, rewards } = parsed.data;

      for (const child of children) {
        await storage.createFamilyChild(child.name, child.age, familyId);
      }

      for (const reward of rewards) {
        await storage.createReward({
          familyId,
          createdByUserId: userId,
          name: reward.name,
          description: reward.description,
          requiredXP: reward.xpCost,
        });
      }

      await storage.updateFamilySetupStatus(familyId, true);
      res.json({ message: "Setup erfolgreich abgeschlossen" });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ message: "Setup fehlgeschlagen" });
    }
  });

  app.get("/api/family/members", requireAuth, requireParent, async (req, res) => {
    try {
      const members = await storage.getUsersByFamilyId(req.auth!.familyId);
      res.json(members.map(publicUser));
    } catch (error) {
      console.error("Members error:", error);
      res.status(500).json({ message: "Mitglieder konnten nicht geladen werden" });
    }
  });

  const pinSchema = z.object({ pin: z.string().regex(/^\d{4,6}$/, "PIN muss 4–6 Ziffern haben") });

  app.put("/api/family/members/:id/pin", pinSetLimiter, requireAuth, requireParent, async (req, res) => {
    const memberId = parseInt(req.params.id, 10);
    if (!Number.isFinite(memberId)) {
      return res.status(400).json({ message: "Ungültige ID" });
    }
    const parsed = pinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Ungültiger PIN" });
    }
    try {
      const hash = await bcrypt.hash(parsed.data.pin, BCRYPT_ROUNDS);
      const updated = await storage.setChildPinHash(req.auth!.familyId, memberId, hash);
      if (!updated) {
        return res.status(404).json({ message: "Kind nicht gefunden" });
      }
      res.json({ message: "PIN gesetzt" });
    } catch (error) {
      console.error("Set PIN error:", error);
      res.status(500).json({ message: "PIN konnte nicht gesetzt werden" });
    }
  });

  app.delete("/api/family/members/:id/pin", requireAuth, requireParent, async (req, res) => {
    const memberId = parseInt(req.params.id, 10);
    if (!Number.isFinite(memberId)) {
      return res.status(400).json({ message: "Ungültige ID" });
    }
    try {
      const updated = await storage.setChildPinHash(req.auth!.familyId, memberId, null);
      if (!updated) {
        return res.status(404).json({ message: "Kind nicht gefunden" });
      }
      res.json({ message: "PIN entfernt" });
    } catch (error) {
      res.status(500).json({ message: "PIN konnte nicht entfernt werden" });
    }
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.auth!.userId);
      if (!user || user.familyId !== req.auth!.familyId) {
        return res.status(404).json({ message: "User nicht gefunden" });
      }
      res.json(publicUser(user));
    } catch (error) {
      res.status(500).json({ message: "User konnte nicht geladen werden" });
    }
  });

  const pushTokenSchema = z.object({
    token: z.string().max(200).nullable(),
  });

  app.post("/api/user/push-token", requireAuth, async (req, res) => {
    const parsed = pushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültiges Token" });
    }
    try {
      await storage.setUserPushToken(req.auth!.userId, parsed.data.token);
      res.json({ message: "ok" });
    } catch (error) {
      console.error("Push token error:", error);
      res.status(500).json({ message: "Token konnte nicht gespeichert werden" });
    }
  });

  app.get("/api/missions", requireAuth, async (req, res) => {
    try {
      const list = await storage.getAllMissions(req.auth!.familyId);
      // A child only sees missions assigned to them or with no assignee (open/pool).
      const filtered =
        req.auth!.role === "child"
          ? list.filter((m) => m.assignedToUserId == null || m.assignedToUserId === req.auth!.userId)
          : list;
      res.json(filtered);
    } catch (error) {
      console.error("Failed to get missions:", error);
      res.status(500).json({ message: "Missionen konnten nicht geladen werden" });
    }
  });

  app.get("/api/missions/completed", requireAuth, async (req, res) => {
    try {
      const list = await storage.getCompletedMissions(req.auth!.familyId);
      const filtered =
        req.auth!.role === "child"
          ? list.filter((m) => m.assignedToUserId === req.auth!.userId)
          : list;
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching completed missions:", error);
      res.status(500).json({ message: "Erledigte Missionen konnten nicht geladen werden" });
    }
  });

  app.post("/api/missions", requireAuth, requireParent, async (req, res) => {
    const parsed = insertMissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Missionsdaten", errors: parsed.error.errors });
    }
    try {
      const familyId = req.auth!.familyId;

      // If the client assigned the mission to a user, confirm that user belongs to this family.
      if (parsed.data.assignedToUserId != null) {
        const assignee = await storage.getUser(parsed.data.assignedToUserId);
        if (!assignee || assignee.familyId !== familyId) {
          return res.status(400).json({ message: "Zuweisung ausserhalb der Familie" });
        }
      }

      const mission = await storage.createMission({
        ...parsed.data,
        familyId,
        createdByUserId: req.auth!.userId,
      });
      res.status(201).json(mission);
    } catch (error) {
      console.error("Create mission error:", error);
      res.status(500).json({ message: "Mission konnte nicht erstellt werden" });
    }
  });

  app.post("/api/missions/:id/complete", requireAuth, async (req, res) => {
    const missionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(missionId)) {
      return res.status(400).json({ message: "Ungültige ID" });
    }
    try {
      // For children, the mission must be assigned to them (or unassigned / pool).
      if (req.auth!.role === "child") {
        const list = await storage.getAllMissions(req.auth!.familyId);
        const target = list.find((m) => m.id === missionId);
        if (!target || (target.assignedToUserId != null && target.assignedToUserId !== req.auth!.userId)) {
          return res.status(404).json({ message: "Mission nicht gefunden" });
        }
      }
      const mission = await storage.completeMission(req.auth!.familyId, missionId);
      if (!mission) {
        return res.status(404).json({ message: "Mission nicht gefunden" });
      }
      const user = mission.assignedToUserId ? await storage.getUser(mission.assignedToUserId) : null;

      // Notify the parent when a child completes a mission.
      if (req.auth!.role === "child") {
        void (async () => {
          const parent = await storage.getParentOfFamily(req.auth!.familyId);
          if (parent?.pushToken) {
            const childName = user?.name ?? "Kind";
            await sendPush([
              {
                to: parent.pushToken,
                title: `${childName} hat eine Mission erledigt 🎉`,
                body: `${mission.title} · +${mission.xpReward} XP`,
                data: { type: "mission_completed", missionId: mission.id },
                sound: "default",
              },
            ]);
          }
        })();
      }

      res.json({ mission, user: user ? publicUser(user) : null });
    } catch (error) {
      res.status(500).json({ message: "Mission konnte nicht abgeschlossen werden" });
    }
  });

  app.post("/api/missions/:id/undo", requireAuth, requireParent, async (req, res) => {
    const missionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(missionId)) {
      return res.status(400).json({ message: "Ungültige ID" });
    }
    try {
      const mission = await storage.undoMission(req.auth!.familyId, missionId);
      if (!mission) {
        return res.status(404).json({ message: "Mission nicht gefunden" });
      }
      const user = mission.assignedToUserId ? await storage.getUser(mission.assignedToUserId) : null;
      res.json({ mission, user: user ? publicUser(user) : null });
    } catch (error) {
      res.status(500).json({ message: "Mission konnte nicht zurückgesetzt werden" });
    }
  });

  app.delete("/api/missions/:id", requireAuth, requireParent, async (req, res) => {
    const missionId = parseInt(req.params.id, 10);
    if (!Number.isFinite(missionId)) {
      return res.status(400).json({ message: "Ungültige ID" });
    }
    try {
      const deleted = await storage.deleteMission(req.auth!.familyId, missionId);
      if (!deleted) {
        return res.status(404).json({ message: "Mission nicht gefunden" });
      }
      res.json({ message: "Mission gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Mission konnte nicht gelöscht werden" });
    }
  });

  app.get("/api/rewards", requireAuth, async (req, res) => {
    try {
      const list = await storage.getRewards(req.auth!.familyId);
      res.json(list);
    } catch (error) {
      res.status(500).json({ message: "Belohnungen konnten nicht geladen werden" });
    }
  });

  app.post("/api/rewards", requireAuth, requireParent, async (req, res) => {
    const parsed = insertRewardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Ungültige Belohnungsdaten", errors: parsed.error.errors });
    }
    try {
      const reward = await storage.createReward({
        ...parsed.data,
        familyId: req.auth!.familyId,
        createdByUserId: req.auth!.userId,
      });
      res.status(201).json(reward);
    } catch (error) {
      res.status(500).json({ message: "Belohnung konnte nicht erstellt werden" });
    }
  });

  app.delete("/api/rewards/:id", requireAuth, requireParent, async (req, res) => {
    const rewardId = parseInt(req.params.id, 10);
    if (!Number.isFinite(rewardId)) {
      return res.status(400).json({ message: "Ungültige ID" });
    }
    try {
      const deleted = await storage.deleteReward(req.auth!.familyId, rewardId);
      if (!deleted) {
        return res.status(404).json({ message: "Belohnung nicht gefunden" });
      }
      res.json({ message: "Belohnung gelöscht" });
    } catch (error) {
      res.status(500).json({ message: "Belohnung konnte nicht gelöscht werden" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
