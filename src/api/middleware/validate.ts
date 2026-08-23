import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/** Validates req.body against a zod schema; replaces req.body with the parsed (typed) result. */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
  };
}

/** Simple in-memory sliding-window rate limiter, e.g. for the login endpoint. */
export function rateLimit(opts: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    const now = Date.now();
    const timestamps = (hits.get(key) ?? []).filter((t) => now - t < opts.windowMs);

    if (timestamps.length >= opts.max) {
      return res.status(429).json({ error: "Too many requests, please try again later." });
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}
