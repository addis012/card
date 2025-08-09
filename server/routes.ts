import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { StrowalletService } from "./strowallet";
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

  // Admin: Create card via Strowallet API based on KYC documents
  app.post("/api/admin/create-card", async (req, res) => {
    try {
      const { userId, cardType = "VIRTUAL", spendingLimit } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has approved KYC documents
      const kycDocuments = await storage.getKycDocumentsByUserId(userId);
      const hasApprovedDocs = kycDocuments.some(doc => doc.status === "approved");
      
      if (!hasApprovedDocs) {
        return res.status(400).json({ message: "User must have approved KYC documents before card creation" });
      }

      // Initialize Strowallet service
      const strowalletService = new StrowalletService();
      
      // Create card via Strowallet API
      const cardHolderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
      const strowalletCard = await strowalletService.createCard({
        name_on_card: cardHolderName,
        card_type: "visa",
        public_key: process.env.STROWALLET_PUBLIC_KEY || "",
        amount: (spendingLimit || 1000).toString(),
        customerEmail: user.email || `${user.username}@example.com`,
        mode: process.env.NODE_ENV === "development" ? "sandbox" : undefined,
      });

      // Store card in our database
      const card = await storage.createCard({
        userId: userId,
        cardNumber: strowalletCard.card_number,
        expiryDate: `${strowalletCard.expiry_month}/${strowalletCard.expiry_year}`,
        cvv: strowalletCard.cvv,
        cardType: cardType.toLowerCase(),
        status: "pending",
        balance: "0.00",
        spendingLimit: spendingLimit || 1000,
      });

      // Update with Strowallet ID and masked number
      const updatedCard = await storage.updateCard(card.id, {
        strowalletCardId: strowalletCard.card_id,
        maskedNumber: `**** **** **** ${strowalletCard.card_number.slice(-4)}`,
      });

      res.status(201).json({
        message: "Card created successfully via Strowallet",
        card: updatedCard,
        strowalletResponse: strowalletCard,
      });
    } catch (error) {
      console.error("Error creating card via Strowallet:", error);
      res.status(500).json({ 
        message: "Failed to create card via Strowallet", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin: Approve card and make it visible to user
  app.put("/api/admin/approve-card/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;
      const { cardNumber, expiryDate, cvv } = req.body;

      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Update card with provided details and activate it
      const updatedCard = await storage.updateCard(cardId, {
        cardNumber: cardNumber || card.cardNumber,
        expiryDate: expiryDate || card.expiryDate,
        cvv: cvv || card.cvv,
        status: "active",
        approvedAt: new Date(),
      });

      // Update Strowallet card status if we have the ID
      if (card.strowalletCardId) {
        try {
          const strowalletService = new StrowalletService();
          await strowalletService.updateCardStatus(card.strowalletCardId, "ACTIVE");
        } catch (strowalletError) {
          console.error("Error updating Strowallet card status:", strowalletError);
          // Continue with local approval even if Strowallet update fails
        }
      }

      res.json({
        message: "Card approved and activated successfully",
        card: updatedCard,
      });
    } catch (error) {
      console.error("Error approving card:", error);
      res.status(500).json({ message: "Failed to approve card" });
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

  // User Registration (using the enhanced version below)
  // Registration endpoint removed - using the enhanced version below

  // Login endpoint removed - using the enhanced version below

  // Get card transaction history from Strowallet
  app.get("/api/cards/:cardId/strowallet-transactions", async (req, res) => {
    try {
      const cardId = req.params.cardId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Find the card to get the Strowallet card ID
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      if (!card.strowalletCardId) {
        return res.status(400).json({ message: "Card is not linked to Strowallet" });
      }

      const strowalletService = new StrowalletService();
      const transactionsResponse = await strowalletService.getCardTransactions({
        card_id: card.strowalletCardId,
        limit,
        offset,
      });

      res.json(transactionsResponse);
    } catch (error) {
      console.error("Error fetching card transactions:", error);
      res.status(500).json({ message: "Failed to fetch card transactions" });
    }
  });

  // Fund a card via Strowallet
  app.post("/api/cards/:cardId/fund", async (req, res) => {
    try {
      const cardId = req.params.cardId;
      const { amount, currency = "USD" } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      // Find the card to get the Strowallet card ID
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      if (!card.strowalletCardId) {
        return res.status(400).json({ message: "Card is not linked to Strowallet" });
      }

      const strowalletService = new StrowalletService();
      const fundingResponse = await strowalletService.fundCard({
        card_id: card.strowalletCardId,
        amount: parseFloat(amount),
        currency,
      });

      // Update local card balance
      const updatedBalance = (parseFloat(card.balance) + parseFloat(amount)).toFixed(2);
      await storage.updateCard(cardId, { balance: updatedBalance });

      res.json({
        message: "Card funded successfully",
        transaction: fundingResponse,
        newBalance: updatedBalance,
      });
    } catch (error) {
      console.error("Error funding card:", error);
      res.status(500).json({ message: "Failed to fund card" });
    }
  });

  // Get detailed card information from Strowallet
  app.get("/api/cards/:cardId/strowallet-details", async (req, res) => {
    try {
      const cardId = req.params.cardId;

      // Find the card to get the Strowallet card ID
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      if (!card.strowalletCardId) {
        return res.status(400).json({ message: "Card is not linked to Strowallet" });
      }

      const strowalletService = new StrowalletService();
      const cardDetails = await strowalletService.getCardDetails({
        card_id: card.strowalletCardId,
      });

      // Update local card data with fresh information from Strowallet
      await storage.updateCard(cardId, {
        balance: cardDetails.balance.toString(),
        status: cardDetails.is_blocked ? "frozen" : "active",
      });

      res.json({
        localCard: card,
        strowalletDetails: cardDetails,
      });
    } catch (error) {
      console.error("Error fetching card details:", error);
      res.status(500).json({ message: "Failed to fetch card details" });
    }
  });

  // Block/Unblock a card
  app.put("/api/cards/:cardId/block", async (req, res) => {
    try {
      const cardId = req.params.cardId;
      const { blocked } = req.body;

      if (typeof blocked !== "boolean") {
        return res.status(400).json({ message: "blocked field must be a boolean" });
      }

      // Find the card to get the Strowallet card ID
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      if (!card.strowalletCardId) {
        return res.status(400).json({ message: "Card is not linked to Strowallet" });
      }

      const strowalletService = new StrowalletService();
      const newStatus = blocked ? "BLOCKED" : "ACTIVE";
      
      await strowalletService.updateCardStatus(card.strowalletCardId, newStatus);

      // Update local card status
      const localStatus = blocked ? "frozen" : "active";
      await storage.updateCard(cardId, { status: localStatus });

      res.json({
        message: `Card ${blocked ? "blocked" : "unblocked"} successfully`,
        cardId,
        status: localStatus,
      });
    } catch (error) {
      console.error("Error updating card block status:", error);
      res.status(500).json({ message: "Failed to update card block status" });
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
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
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
      res.status(201).json({ message: "Registration successful", user: userResponse });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user session
      if (req.session) {
        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };
      }
      
      const { password: _, ...userResponse } = user;
      res.json({ message: "Login successful", user: userResponse });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (req.session?.user) {
      res.json(req.session.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
    }
    res.clearCookie('connect.sid');
    res.json({ message: "Logged out successfully" });
  });

  // Card address management endpoints
  app.get("/api/cards/:id/address", async (req, res) => {
    try {
      const card = await storage.getCard(req.params.id);
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      const addressInfo = {
        cardId: card.id,
        nameOnCard: card.nameOnCard || "",
        billingAddress: card.billingAddress || "",
        billingCity: card.billingCity || "",
        billingState: card.billingState || "",
        billingZip: card.billingZip || "",
        billingCountry: card.billingCountry || "US",
      };

      res.json(addressInfo);
    } catch (error) {
      console.error("Error fetching card address:", error);
      res.status(500).json({ message: "Failed to fetch card address" });
    }
  });

  app.put("/api/cards/:id/address", async (req, res) => {
    try {
      const { 
        billingAddress, 
        billingCity, 
        billingState, 
        billingZip, 
        billingCountry, 
        nameOnCard 
      } = req.body;

      const card = await storage.updateCard(req.params.id, {
        billingAddress: billingAddress || null,
        billingCity: billingCity || null,
        billingState: billingState || null,
        billingZip: billingZip || null,
        billingCountry: billingCountry || null,
        nameOnCard: nameOnCard || null
      });

      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json({
        message: "Card address updated successfully",
        card,
        addressInfo: {
          nameOnCard: card.nameOnCard,
          billingAddress: card.billingAddress,
          billingCity: card.billingCity,
          billingState: card.billingState,
          billingZip: card.billingZip,
          billingCountry: card.billingCountry,
        }
      });
    } catch (error) {
      console.error("Error updating card address:", error);
      res.status(500).json({ message: "Failed to update card address" });
    }
  });

  // Enhanced admin card creation with address support
  app.post("/api/admin/create-card-with-address", async (req, res) => {
    try {
      const { 
        userId, 
        cardType = "VIRTUAL", 
        spendingLimit,
        billingAddress,
        billingCity,
        billingState,
        billingZip,
        billingCountry,
        nameOnCard
      } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has approved KYC documents
      const kycDocuments = await storage.getKycDocumentsByUserId(userId);
      const hasApprovedDocs = kycDocuments.some(doc => doc.status === "approved");
      
      if (!hasApprovedDocs) {
        return res.status(400).json({ message: "User must have approved KYC documents before card creation" });
      }

      // Initialize Strowallet service
      const strowalletService = new StrowalletService();
      
      // Create card via Strowallet API with address information
      const cardHolderName = nameOnCard || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
      const strowalletCard = await strowalletService.createCard({
        name_on_card: cardHolderName,
        card_type: "visa",
        public_key: process.env.STROWALLET_PUBLIC_KEY || "",
        amount: (spendingLimit || 1000).toString(),
        customerEmail: user.email || `${user.username}@example.com`,
        mode: process.env.NODE_ENV === "development" ? "sandbox" : undefined,
        billing_address: billingAddress,
        billing_city: billingCity,
        billing_state: billingState,
        billing_zip: billingZip,
        billing_country: billingCountry || "US",
      });

      // Store card in our database with address information
      const card = await storage.createCard({
        userId: userId,
        cardNumber: strowalletCard.card_number,
        expiryDate: `${strowalletCard.expiry_month}/${strowalletCard.expiry_year}`,
        cvv: strowalletCard.cvv,
        cardType: cardType.toLowerCase(),
        status: "pending",
        balance: "0.00",
        spendingLimit: spendingLimit?.toString() || "1000.00",
        strowalletCardId: strowalletCard.card_id,
        billingAddress: billingAddress || null,
        billingCity: billingCity || null,
        billingState: billingState || null,
        billingZip: billingZip || null,
        billingCountry: billingCountry || null,
        nameOnCard: cardHolderName,
      });

      // Update with masked number
      const updatedCard = await storage.updateCard(card.id, {
        maskedNumber: `**** **** **** ${strowalletCard.card_number.slice(-4)}`,
      });

      res.status(201).json({
        message: "Card created successfully with address information",
        card: updatedCard,
        strowalletResponse: strowalletCard,
        addressInfo: {
          nameOnCard: cardHolderName,
          billingAddress,
          billingCity,
          billingState,
          billingZip,
          billingCountry,
        }
      });
    } catch (error) {
      console.error("Error creating card with address:", error);
      res.status(500).json({ 
        message: "Failed to create card with address", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
