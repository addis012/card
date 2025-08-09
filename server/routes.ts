import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCardSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
