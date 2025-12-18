import { getAuth, requireAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Get the user ID from the request (returns null if not authenticated or auth not enabled)
export function getUserId(req: Request): string | null {
  if (!process.env.CLERK_SECRET_KEY) {
    // Auth not enabled - return a default user for development
    return "dev-user";
  }
  
  const auth = getAuth(req);
  return auth?.userId || null;
}

// Middleware to require authentication
export function authRequired(req: Request, res: Response, next: NextFunction) {
  if (!process.env.CLERK_SECRET_KEY) {
    // Auth not enabled - allow all requests
    return next();
  }
  
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  next();
}

// Re-export requireAuth from Clerk for stricter auth requirements
export { requireAuth };
