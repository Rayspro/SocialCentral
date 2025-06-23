import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { storage } from "../../storage.js";
import { InsertUser } from "@shared/schema.js";
import { auditLogger } from "../../audit-logger.js";

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and password are required" 
      });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      await auditLogger.logUserLogin(-1, { request: req }, false);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      await auditLogger.logUserLogin(user.id, { request: req }, false);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // @ts-ignore - session types
    req.session.userId = user.id;
    await auditLogger.logUserLogin(user.id, { request: req }, true);

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Login failed" 
    });
  }
}

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password, firstName, lastName, username } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and password are required" 
      });
    }

    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: "User already exists" 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userData: InsertUser = {
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      username: username || null,
    };

    const user = await storage.createUser(userData);
    // @ts-ignore - session types
    req.session.userId = user.id;

    res.status(201).json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Registration failed" 
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    // @ts-ignore - session types
    const userId = req.session.userId;
    
    if (userId) {
      await auditLogger.logUserLogout(userId, { request: req });
    }

    // @ts-ignore - session types
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ 
          success: false, 
          error: "Logout failed" 
        });
      }
      
      res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Logout failed" 
    });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    // @ts-ignore - session types
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authenticated" 
      });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName 
      } 
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get user" 
    });
  }
}