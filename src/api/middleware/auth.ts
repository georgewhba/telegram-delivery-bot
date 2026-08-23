import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../env";

export interface AuthPayload {
  adminId: number;
  username: string;
}

export interface AuthedRequest extends Request {
  admin?: AuthPayload;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });
}
