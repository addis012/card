import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
      // Use authenticated user ID from session, fallback to query param, then default
      const userId = req.session?.user?.id || req.query.userId as string || DEFAULT_USER_ID;
      const cards = await storage.getCardsByUserId(userId);
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

  // Admin middleware to protect admin routes
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.admin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Admin: Create card via Strowallet API based on KYC documents
  app.post("/api/admin/create-card", requireAdmin, async (req, res) => {
    try {
      const { userId, cardType = "VIRTUAL", spendingLimit, bypassKYC = false } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has approved KYC documents (unless admin bypasses or user is admin)
      if (!bypassKYC && user.role !== 'admin') {
        const kycDocuments = await storage.getKycDocumentsByUserId(userId);
        const hasApprovedDocs = kycDocuments.some(doc => doc.status === "approved");
        
        if (!hasApprovedDocs) {
          return res.status(400).json({ 
            message: "User must have approved KYC documents before card creation. Use bypassKYC: true to override." 
          });
        }
      }

      // Initialize Strowallet service
      const strowalletService = new StrowalletService();
      
      // Create card via Strowallet API
      const cardHolderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
      console.log("About to call Strowallet API with user:", JSON.stringify(user, null, 2));
      console.log("Card holder name:", cardHolderName);
      
      const strowalletCard = await strowalletService.createCard({
        name_on_card: cardHolderName,
        card_type: "visa",
        public_key: process.env.STROWALLET_PUBLIC_KEY || "",
        amount: (spendingLimit || 1000).toString(),
        customerEmail: user.email || `${user.username}@example.com`,
        mode: process.env.NODE_ENV === "development" ? "sandbox" : undefined,
      });
      
      console.log("Received response from Strowallet:", JSON.stringify(strowalletCard, null, 2));

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
        currency: "USDT",
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
      const updatedBalance = (parseFloat(card.balance.toString()) + parseFloat(amount.toString())).toFixed(2);
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

  // Admin card creation using Strowallet API
  app.post("/api/admin/cards/create-strowallet", async (req, res) => {
    try {
      const validatedData = insertCardSchema.parse({
        ...req.body,
        userId: req.body.userId || DEFAULT_USER_ID,
      });
      
      // Create card via Strowallet API
      const strowalletService = new StrowalletService();
      const strowalletRequest = {
        name_on_card: validatedData.nameOnCard || "Card Holder",
        card_type: "visa",
        public_key: process.env.STROWALLET_PUBLIC_KEY || "",
        amount: req.body.amount || "100",
        customerEmail: req.body.customerEmail || "user@example.com",
        billing_address: validatedData.billingAddress || "",
        billing_city: validatedData.billingCity || "",
        billing_state: validatedData.billingState || "",
        billing_zip: validatedData.billingZip || "",
        billing_country: validatedData.billingCountry || "US",
      };
      
      const strowalletCard = await strowalletService.createCard(strowalletRequest);
      
      // Save card to local database with Strowallet details
      const cardData = {
        ...validatedData,
        cardNumber: strowalletCard.card_number,
        expiryDate: `${strowalletCard.expiry_month}/${strowalletCard.expiry_year}`,
        cvv: strowalletCard.cvv,
        strowalletCardId: strowalletCard.card_id,
        balance: req.body.amount || "100",
      };
      
      const card = await storage.createCard(cardData);
      
      res.status(201).json({
        message: "Card created successfully via Strowallet",
        card,
        strowalletDetails: strowalletCard
      });
    } catch (error) {
      console.error("Error creating Strowallet card:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid card data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create card via Strowallet" });
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

  // Object Storage Routes - Disabled for Replit environment
  app.post("/api/objects/upload", async (req, res) => {
    res.status(501).json({ message: "Object storage not available in this environment. Use file upload instead." });
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    res.status(501).json({ message: "Object storage not available in this environment." });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const cards = await storage.getCardsByUserId(DEFAULT_USER_ID);
      const transactions = await storage.getTransactionsByUserId(DEFAULT_USER_ID);
      
      const activeCards = cards.filter(card => card.status === 'active').length;
      const totalVolume = transactions.reduce((sum, txn) => sum + Math.abs(parseFloat(txn.amount.toString())), 0);
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

  // Strowallet Webhook endpoint for real-time card notifications
  app.post("/api/webhook/strowallet", async (req, res) => {
    try {
      console.log("=== Strowallet Webhook Received ===");
      console.log("Headers:", JSON.stringify(req.headers, null, 2));
      console.log("Body:", JSON.stringify(req.body, null, 2));
      
      const webhookData = req.body;
      
      // Process different webhook types
      if (webhookData.event_type) {
        switch (webhookData.event_type) {
          case "card.created":
            console.log(`Card created: ${webhookData.card_id}`);
            // Update local card status
            if (webhookData.card_id) {
              const cards = await storage.getAllCards();
              const card = cards.find(c => c.strowalletCardId === webhookData.card_id?.toString());
              if (card) {
                await storage.updateCard(card.id, {
                  status: "active",
                  cardNumber: webhookData.card_number || card.cardNumber,
                  approvedAt: new Date()
                });
                console.log(`Updated card ${card.id} status to active`);
              }
            }
            break;
            
          case "card.funded":
            console.log(`Card funded: ${webhookData.card_id} with ${webhookData.amount}`);
            // Update card balance
            if (webhookData.card_id && webhookData.amount) {
              const cards = await storage.getAllCards();
              const card = cards.find(c => c.strowalletCardId === webhookData.card_id?.toString());
              if (card) {
                const newBalance = (parseFloat(card.balance) + parseFloat(webhookData.amount)).toFixed(2);
                await storage.updateCard(card.id, { balance: newBalance });
                console.log(`Updated card ${card.id} balance to ${newBalance}`);
              }
            }
            break;
            
          case "transaction.created":
            console.log(`Transaction created: ${webhookData.transaction_id} on card ${webhookData.card_id}`);
            // Create transaction record
            if (webhookData.card_id) {
              const cards = await storage.getAllCards();
              const card = cards.find(c => c.strowalletCardId === webhookData.card_id?.toString());
              if (card) {
                await storage.createTransaction({
                  cardId: card.id,
                  amount: webhookData.amount || "0",
                  currency: "USDT",
                  description: webhookData.description || "Webhook transaction",
                  merchant: webhookData.merchant_name || "Unknown",
                  type: webhookData.transaction_type === "debit" ? "purchase" : "deposit"
                });
                console.log(`Created transaction for card ${card.id}`);
              }
            }
            break;
            
          default:
            console.log(`Unknown webhook event type: ${webhookData.event_type}`);
        }
      }
      
      // Always respond with 200 to acknowledge receipt
      res.status(200).json({ message: "Webhook received successfully", received_at: new Date().toISOString() });
    } catch (error) {
      console.error("Error processing Strowallet webhook:", error);
      res.status(500).json({ message: "Error processing webhook", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create an admin user for testing
  app.post("/api/admin/create-test-user", async (req, res) => {
    try {
      // Create admin user with known password
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const adminUser = await storage.createUser({
        username: "admin",
        email: "admin@cardflow.com",
        firstName: "Admin",
        lastName: "User",
        password: hashedPassword,
        role: "admin"
      });
      
      const { password, ...userResponse } = adminUser;
      res.json({ message: "Test admin user created", user: userResponse });
    } catch (error) {
      console.error("Error creating test user:", error);
      res.status(500).json({ message: "Failed to create test user" });
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
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword
      };
      
      const user = await storage.createUser(userDataWithHashedPassword);
      
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

  // Make user admin (development endpoint)
  app.post("/api/auth/make-admin", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(user.id, { role: "admin" });
      res.json({ message: "User role updated to admin", user: updatedUser });
    } catch (error) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============ ADMIN AUTHENTICATION ROUTES ============
  
  // Admin login endpoint
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Find admin user - only allow users with admin role
      const user = await storage.getUserByUsername(username);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }
      
      // Store admin session (separate from user session)
      if (req.session) {
        req.session.admin = {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };
      }
      
      const { password: _, ...adminResponse } = user;
      res.json({ message: "Admin login successful", admin: adminResponse });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // Get current admin
  app.get("/api/admin/auth/me", async (req, res) => {
    if (req.session?.admin) {
      res.json(req.session.admin);
    } else {
      res.status(401).json({ message: "Not authenticated as admin" });
    }
  });

  // Admin logout endpoint
  app.post("/api/admin/auth/logout", async (req, res) => {
    if (req.session?.admin) {
      delete req.session.admin;
    }
    res.json({ message: "Admin logged out successfully" });
  });

  // Create initial admin user endpoint (for setup)
  app.post("/api/admin/setup", async (req, res) => {
    try {
      const { username, password, email, firstName, lastName } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ message: "Username, password, and email are required" });
      }
      
      // Check if admin already exists
      const existingAdmin = await storage.getUserByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin user already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create admin user
      const adminUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        firstName: firstName || "Admin",
        lastName: lastName || "User",
        role: "admin"
      });
      
      const { password: _, ...adminResponse } = adminUser;
      res.status(201).json({ message: "Admin user created successfully", admin: adminResponse });
    } catch (error) {
      console.error("Error creating admin user:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Delete user by username endpoint (development)
  app.delete("/api/admin/users/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const deleted = await storage.deleteUserByUsername(username);
      
      if (deleted) {
        res.json({ message: `User '${username}' deleted successfully` });
      } else {
        res.status(404).json({ message: `User '${username}' not found` });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
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
        currency: "USDT",
        // strowalletCardId: strowalletCard.card_id, // Not supported in schema
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

  // File Upload Routes - Store files in database
  app.post("/api/files/upload", async (req, res) => {
    try {
      const { fileName, fileData, contentType, fileSize, userId, documentType } = req.body;
      
      if (!fileName || !fileData || !contentType || !fileSize || !userId || !documentType) {
        return res.status(400).json({ 
          message: "Missing required fields: fileName, fileData, contentType, fileSize, userId, documentType" 
        });
      }

      // Validate file size (limit to 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({ message: "File size too large. Maximum 10MB allowed." });
      }

      // Create KYC document with file data (simplified for MemStorage)
      const kycDocument = await storage.createKycDocument({
        userId,
        documentType,
        fileName,
        fileData,
        contentType,
        fileSize,
        documentUrl: `data:${contentType};base64,${fileData}` // Store as data URL
      });

      res.status(201).json({ 
        message: "File uploaded successfully",
        documentId: kycDocument.id,
        documentUrl: kycDocument.documentUrl
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Get uploaded file from database
  app.get("/api/files/:documentId", async (req, res) => {
    try {
      // For MemStorage, we'll get all documents and find by ID
      const allDocs = await storage.getAllKycDocuments();
      const document = allDocs.find(doc => doc.id === req.params.documentId);
      
      if (!document) {
        return res.status(404).json({ message: "File not found" });
      }

      // Return document data
      res.json({
        id: document.id,
        documentType: document.documentType,
        documentUrl: document.documentUrl,
        status: document.status
      });
    } catch (error) {
      console.error("Error retrieving file:", error);
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
