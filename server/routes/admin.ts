import type { Express } from "express";
import { storage } from "../hybrid-storage";
import { insertUserSchema, insertStrowalletCustomerSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export function registerAdminRoutes(app: Express) {
  // Admin middleware to protect admin routes
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.admin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Admin authentication
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check admin credentials (for demo, using hardcoded admin)
      if (username === "admin" && password === "admin123") {
        req.session.admin = {
          id: "admin-1",
          username: "admin",
          role: "admin"
        };

        res.json({
          message: "Admin login successful",
          admin: {
            id: "admin-1",
            username: "admin",
            role: "admin"
          }
        });
      } else {
        res.status(401).json({ message: "Invalid admin credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Check admin authentication status
  app.get("/api/admin/auth/me", (req, res) => {
    if (req.session?.admin) {
      res.json({ admin: req.session.admin });
    } else {
      res.status(401).json({ message: "Not authenticated as admin" });
    }
  });

  // Admin logout
  app.post("/api/admin/auth/logout", (req, res) => {
    req.session.admin = null;
    res.json({ message: "Admin logged out successfully" });
  });

  // Get all users/customers
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get specific user details
  app.get("/api/admin/users/:userId/details", requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Get user's cards
  app.get("/api/admin/users/:userId/cards", requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getCardsByUserId(req.params.userId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user cards" });
    }
  });

  // Get user's KYC documents
  app.get("/api/admin/users/:userId/kyc", requireAdmin, async (req, res) => {
    try {
      const kycDocuments = await storage.getKycDocumentsByUserId(req.params.userId);
      res.json(kycDocuments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  // Get user's Strowallet data
  app.get("/api/admin/users/:userId/strowallet", requireAdmin, async (req, res) => {
    try {
      const strowalletData = await storage.getStrowalletCustomerByUserId(req.params.userId);
      res.json(strowalletData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Strowallet data" });
    }
  });

  // Update user KYC status
  app.patch("/api/admin/users/:userId/kyc-status", requireAdmin, async (req, res) => {
    try {
      const { kycStatus } = req.body;
      const user = await storage.updateUser(req.params.userId, { kycStatus });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update KYC status" });
    }
  });

  // Approve/Reject KYC document
  app.patch("/api/admin/kyc-documents/:documentId", requireAdmin, async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const adminId = req.session.admin.id;
      
      const document = await storage.updateKycDocument(req.params.documentId, {
        status,
        reviewNotes,
        reviewedBy: adminId,
        reviewedAt: new Date()
      });
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Get platform statistics
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const totalUsers = users.length;
      const approvedUsers = users.filter(user => user.kycStatus === 'approved').length;
      const pendingUsers = users.filter(user => user.kycStatus === 'pending').length;
      
      // Get all cards
      const allCards = [];
      for (const user of users) {
        const userCards = await storage.getCardsByUserId(user.id);
        allCards.push(...userCards);
      }
      
      const stats = {
        totalUsers,
        approvedUsers,
        pendingUsers,
        rejectedUsers: users.filter(user => user.kycStatus === 'rejected').length,
        totalCards: allCards.length,
        activeCards: allCards.filter(card => card.status === 'active').length,
        totalBalance: allCards.reduce((sum, card) => sum + parseFloat(card.balance || '0'), 0)
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Create user (admin function)
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Delete user (admin function)
  app.delete("/api/admin/users/:userId", requireAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUser(req.params.userId);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
}