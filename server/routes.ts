import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMissionSchema, insertRewardSchema, insertFamilySchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const PostgresSession = connectPg(session);
  app.use(session({
    store: new PostgresSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.familyId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Auth routes - demo version
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, familyName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "Ein Konto mit dieser E-Mail-Adresse existiert bereits" });
      }

      // Create demo account
      (req.session as any).userId = 999;
      (req.session as any).familyName = familyName;
      (req.session as any).email = email;

      res.status(201).json({
        id: 999,
        familyName: familyName,
        email: email,
        isSetupComplete: false,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Demo login - accept any credentials for now
      (req.session as any).userId = 998;
      (req.session as any).familyName = "Demo Familie";
      (req.session as any).email = email;

      res.json({
        id: 998,
        familyName: "Demo Familie",
        email: email,
        isSetupComplete: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Abmeldung fehlgeschlagen" });
      }
      res.json({ message: "Erfolgreich abgemeldet" });
    });
  });

  app.get("/api/auth/me", (req: any, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Nicht angemeldet" });
    }

    res.json({
      id: req.session.userId,
      familyName: req.session.familyName || "Familie",
      email: req.session.email,
      isSetupComplete: req.session.isSetupComplete || false,
    });
  });

  // Family setup route
  app.post("/api/family/setup", requireAuth, async (req: any, res) => {
    try {
      const { children, rewards } = req.body;
      const familyId = req.session.familyId;

      // Create children
      for (const child of children) {
        await storage.createFamilyChild(child.name, child.age, familyId);
      }

      // Create rewards
      for (const reward of rewards) {
        await storage.createReward({
          name: reward.name,
          description: reward.description,
          requiredXP: reward.xpCost,
          createdByUserId: 1, // Default parent user
        });
      }

      // Mark family setup as complete
      await storage.updateFamilySetupStatus(familyId, true);
      req.session.isSetupComplete = true;

      res.json({ message: "Setup erfolgreich abgeschlossen" });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ message: "Setup fehlgeschlagen" });
    }
  });

  // Get current user (updated for family system)
  app.get("/api/user", async (req, res) => {
    try {
      // For demo purposes, return the child user
      const user = await storage.getUserByUsername("child");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get missions for current user
  app.get("/api/missions", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 2; // Default to child user
      const missions = await storage.getMissionsByUserId(userId);
      res.json(missions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get missions" });
    }
  });

  // Get completed missions (for parent mode)
  app.get("/api/missions/completed", async (req, res) => {
    try {
      console.log("Fetching completed missions...");
      const missions = await storage.getCompletedMissions();
      console.log("Found completed missions:", missions);
      res.json(missions);
    } catch (error) {
      console.error("Error fetching completed missions:", error);
      res.status(500).json({ message: "Failed to fetch completed missions" });
    }
  });

  // Create a new mission
  app.post("/api/missions", async (req, res) => {
    try {
      const missionData = insertMissionSchema.parse(req.body);
      const mission = await storage.createMission(missionData);
      res.status(201).json(mission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mission" });
    }
  });

  // Complete a mission
  app.post("/api/missions/:id/complete", async (req, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const mission = await storage.completeMission(missionId);
      
      if (!mission) {
        return res.status(404).json({ message: "Mission not found or already completed" });
      }

      // Get updated user data
      const user = await storage.getUser(mission.assignedToUserId!);
      
      res.json({ mission, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to complete mission" });
    }
  });

  // Undo a completed mission (for parents)
  app.post("/api/missions/:id/undo", async (req, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const mission = await storage.undoMission(missionId);
      
      if (!mission) {
        return res.status(404).json({ message: "Mission not found" });
      }

      // Get updated user data
      const user = await storage.getUser(mission.assignedToUserId!);
      
      res.json({ mission, user });
    } catch (error) {
      res.status(500).json({ message: "Failed to undo mission" });
    }
  });

  // Delete a mission
  app.delete("/api/missions/:id", async (req, res) => {
    try {
      const missionId = parseInt(req.params.id);
      const deleted = await storage.deleteMission(missionId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Mission not found" });
      }
      
      res.json({ message: "Mission deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mission" });
    }
  });

  // Get all rewards
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to get rewards" });
    }
  });

  // Create a new reward
  app.post("/api/rewards", async (req, res) => {
    try {
      const rewardData = insertRewardSchema.parse(req.body);
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reward data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create reward" });
    }
  });

  // Delete a reward
  app.delete("/api/rewards/:id", async (req, res) => {
    try {
      const rewardId = parseInt(req.params.id);
      const deleted = await storage.deleteReward(rewardId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Reward not found" });
      }
      
      res.json({ message: "Reward deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reward" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
