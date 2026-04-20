import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";

export type AuthRole = "parent" | "child";
export type AuthContext = { familyId: number; userId: number; role: AuthRole };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

type TokenKind = "access" | "refresh";

interface TokenPayload extends JwtPayload {
  familyId: number;
  userId: number;
  role: AuthRole;
  type: TokenKind;
}

const ACCESS_TTL: SignOptions["expiresIn"] = "15m";
const REFRESH_TTL: SignOptions["expiresIn"] = "30d";
const CHILD_ACCESS_TTL: SignOptions["expiresIn"] = "60m";
const CHILD_REFRESH_TTL: SignOptions["expiresIn"] = "7d";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set (>= 32 chars) in production");
  }
  // Dev fallback; invalidated on every restart.
  const fallbackKey = "__DEV_JWT_SECRET__";
  const g = globalThis as unknown as Record<string, string>;
  if (!g[fallbackKey]) {
    g[fallbackKey] = randomBytes(48).toString("hex");
    console.warn("[auth] JWT_SECRET not set; using ephemeral dev secret");
  }
  return g[fallbackKey];
}

export function signAccessToken(ctx: AuthContext): string {
  const expiresIn = ctx.role === "child" ? CHILD_ACCESS_TTL : ACCESS_TTL;
  return jwt.sign({ ...ctx, type: "access" }, getJwtSecret(), { expiresIn });
}

export function signRefreshToken(ctx: AuthContext): string {
  const expiresIn = ctx.role === "child" ? CHILD_REFRESH_TTL : REFRESH_TTL;
  return jwt.sign({ ...ctx, type: "refresh" }, getJwtSecret(), { expiresIn });
}

export function verifyToken(token: string, expected: TokenKind): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as TokenPayload;
    if (payload.type !== expected) return null;
    if (typeof payload.familyId !== "number" || typeof payload.userId !== "number") return null;
    if (payload.role !== "parent" && payload.role !== "child") return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7), "access");
    if (!payload) {
      return res.status(401).json({ message: "Token ungültig oder abgelaufen" });
    }
    req.auth = { familyId: payload.familyId, userId: payload.userId, role: payload.role };
    return next();
  }

  if (req.session?.familyId && req.session?.userId) {
    // Session-based logins are always parents (children have no session path).
    req.auth = { familyId: req.session.familyId, userId: req.session.userId, role: "parent" };
    return next();
  }

  return res.status(401).json({ message: "Nicht angemeldet" });
}

export function requireParent(req: Request, res: Response, next: NextFunction) {
  if (req.auth?.role !== "parent") {
    return res.status(403).json({ message: "Nur Eltern dürfen das" });
  }
  next();
}
