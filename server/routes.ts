import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  insertCardSchema, 
  insertTransactionSchema, 
  insertUserSchema,
  insertDepositSchema,
  insertKycDocumentSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = 'user-1'; // For demo purposes

  // Get all cards for the current user
  app.get("/api/cards", async (req, res) => {
    try {
      const cards = await storage.getCardsByUserId(DEFAULT_USER_ID);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cards" });
    }
  });

  // Get a specific card
  app.get("/api/cards/:id", async (req, res) => {
    try {
      const card = await storage.getCard(req.params.id);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch card" });
    }
  });

  // Create a new card
  app.post("/api/cards", async (req, res) => {
    try {
      const validatedData = insertCardSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      const card = await storage.createCard(validatedData);
      res.status(201).json(card);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create card" });
    }
  });

  // Update a card (e.g., freeze/unfreeze, update limit)
  app.patch("/api/cards/:id", async (req, res) => {
    try {
      const updates = req.body;
      const card = await storage.updateCard(req.params.id, updates);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Failed to update card" });
    }
  });

  // Delete a card
  app.delete("/api/cards/:id", async (req, res) => {
    try {
      const success = await storage.deleteCard(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete card" });
    }
  });

  // Get all transactions for the current user
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(DEFAULT_USER_ID);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get transactions for a specific card
  app.get("/api/cards/:cardId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByCardId(req.params.cardId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create a new transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Get API keys for the current user
  app.get("/api/api-keys", async (req, res) => {
    try {
      const apiKeys = await storage.getApiKeysByUserId(DEFAULT_USER_ID);
      res.json(apiKeys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch API keys" });
    }
  });

  // Update API key settings
  app.patch("/api/api-keys/:id", async (req, res) => {
    try {
      const updates = req.body;
      const apiKey = await storage.updateApiKey(req.params.id, updates);
      if (!apiKey) {
        return res.status(404).json({ message: "API key not found" });
      }
      res.json(apiKey);
    } catch (error) {
      res.status(500).json({ message: "Failed to update API key" });
    }
  });

  // User Registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json({ message: "Registration successful", user: { id: user.id, username: user.username } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Login (simple version)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ user: { id: user.id, username: user.username, role: user.role, kycStatus: user.kycStatus } });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Deposits
  app.get("/api/deposits", async (req, res) => {
    try {
      const userId = req.query.userId as string || DEFAULT_USER_ID;
      const deposits = await storage.getDepositsByUserId(userId);
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.post("/api/deposits", async (req, res) => {
    try {
      const validatedData = insertDepositSchema.parse({
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
      });
      const deposit = await storage.createDeposit(validatedData);
      res.status(201).json(deposit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deposit data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deposit" });
    }
  });

  // KYC Documents
  app.get("/api/kyc-documents", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (userId) {
        const documents = await storage.getKycDocumentsByUserId(userId);
        res.json(documents);
      } else {
        const documents = await storage.getAllKycDocuments();
        res.json(documents);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.post("/api/kyc-documents", async (req, res) => {
    try {
      const validatedData = insertKycDocumentSchema.parse({
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
      });
      const document = await storage.createKycDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to upload KYC document" });
    }
  });

  // Admin Routes
  app.get("/api/admin/deposits", async (req, res) => {
    try {
      const deposits = await storage.getAllDeposits();
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.patch("/api/admin/deposits/:id", async (req, res) => {
    try {
      const updates = req.body;
      if (updates.status === 'completed') {
        updates.processedAt = new Date();
        updates.processedBy = 'admin-1'; // Replace with actual admin ID
      }
      const deposit = await storage.updateDeposit(req.params.id, updates);
      if (!deposit) {
        return res.status(404).json({ message: "Deposit not found" });
      }
      res.json(deposit);
    } catch (error) {
      res.status(500).json({ message: "Failed to update deposit" });
    }
  });

  app.get("/api/admin/kyc-documents", async (req, res) => {
    try {
      const documents = await storage.getAllKycDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.patch("/api/admin/kyc-documents/:id", async (req, res) => {
    try {
      const updates = req.body;
      if (updates.status) {
        updates.reviewedAt = new Date();
        updates.reviewedBy = 'admin-1'; // Replace with actual admin ID
      }
      const document = await storage.updateKycDocument(req.params.id, updates);
      if (!document) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });

  app.patch("/api/admin/users/:id/kyc", async (req, res) => {
    try {
      const { kycStatus } = req.body;
      const user = await storage.updateUser(req.params.id, { kycStatus });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user KYC status" });
    }
  });

  // Object Storage Routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error downloading object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const cards = await storage.getCardsByUserId(DEFAULT_USER_ID);
      const transactions = await storage.getTransactionsByUserId(DEFAULT_USER_ID);
      
      const activeCards = cards.filter(card => card.status === 'active').length;
      const totalVolume = transactions.reduce((sum, txn) => sum + Math.abs(parseFloat(txn.amount)), 0);
      const totalTransactions = transactions.length;
      
      const stats = {
        activeCards,
        monthlyVolume: totalVolume,
        transactions: totalTransactions,
        uptime: 99.9,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Object Storage Routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // KYC Document Routes
  app.get("/api/kyc-documents", async (req, res) => {
    try {
      const documents = await storage.getAllKycDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching KYC documents:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.get("/api/kyc-documents/user/:userId", async (req, res) => {
    try {
      const documents = await storage.getKycDocumentsByUserId(req.params.userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching user KYC documents:", error);
      res.status(500).json({ message: "Failed to fetch user KYC documents" });
    }
  });

  app.post("/api/kyc-documents", async (req, res) => {
    try {
      const validatedData = insertKycDocumentSchema.parse(req.body);
      
      // Process the uploaded document URL if needed
      if (validatedData.documentUrl) {
        const objectStorageService = new ObjectStorageService();
        const normalizedPath = objectStorageService.normalizeObjectEntityPath(validatedData.documentUrl);
        validatedData.documentUrl = normalizedPath;
      }
      
      const document = await storage.createKycDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating KYC document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create KYC document" });
    }
  });

  app.put("/api/kyc-documents/:id", async (req, res) => {
    try {
      const updates = req.body;
      if (updates.reviewedAt === undefined && (updates.status === 'approved' || updates.status === 'rejected')) {
        updates.reviewedAt = new Date();
      }
      
      const document = await storage.updateKycDocument(req.params.id, updates);
      if (!document) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error updating KYC document:", error);
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });

  // Enhanced user registration with proper response
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userData = { ...validatedData, password: hashedPassword };
      
      const user = await storage.createUser(userData);
      
      // Return user data without password for frontend
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
