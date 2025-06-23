import { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { insertUserSchema } from "../../shared/schema";
import { storage } from "../storage";
import { auditLogger } from "../audit-logger";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function authRoutes(app: Express) {
  // User authentication
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        await auditLogger.logUserLogin(0, { 
          request: req,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent")
        }, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash!);
      if (!isValid) {
        await auditLogger.logUserLogin(user.id, { 
          request: req,
          ipAddress: req.ip,
          userAgent: req.get("User-Agent")
        }, false);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      (req.session as any).userId = user.id;
      
      await auditLogger.logUserLogin(user.id, { 
        request: req,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      }, true);

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const { password, ...userData } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username!);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Set session
      (req.session as any).userId = user.id;

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid input" });
    }
  });

  app.post("/api/logout", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    
    if (userId) {
      await auditLogger.logUserLogout(userId, { 
        request: req,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent")
      });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/me", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}