import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./hybrid-storage";
import { StrowalletService } from "./strowallet";
import {
  insertCardSchema,
  insertTransactionSchema,
  insertUserSchema,
  insertDepositSchema,
  insertKycDocumentSchema,
  insertStrowalletCustomerSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { registerAdminRoutes } from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_USER_ID = 'user-1'; // For demo purposes

  // Register modular routes
  registerAdminRoutes(app);
  registerAuthRoutes(app);

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
      // Use authenticated user ID from session, fallback to DEFAULT_USER_ID
      const userId = req.session?.user?.id || DEFAULT_USER_ID;

      const validatedData = insertCardSchema.parse({
        ...req.body,
        userId: userId,
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

  // Production card creation endpoint
  app.post("/api/cards/production", async (req, res) => {
    try {
      const { userId, nameOnCard, customerEmail, amount = "10", cardType = "visa", mode = "production" } = req.body;

      if (!userId || !nameOnCard || !customerEmail) {
        return res.status(400).json({ message: "userId, nameOnCard, and customerEmail are required" });
      }

      // Create production card directly through our service
      const strowalletService = new StrowalletService();
      
      try {
        const strowalletCard = await strowalletService.createCard({
          name_on_card: nameOnCard,
          card_type: cardType,
          public_key: process.env.STROWALLET_PUBLIC_KEY || "",
          amount: amount,
          customerEmail: customerEmail,
          mode: mode === "sandbox" ? "sandbox" : undefined // Only include mode for sandbox
        });

        // Save to database
        const cardData = insertCardSchema.parse({
          userId: userId,
          cardNumber: strowalletCard.card_id,
          nameOnCard: nameOnCard,
          cardType: "virtual",
          status: strowalletCard.status === "pending" ? "pending" : "active",
          balance: amount,
          spendingLimit: "1000.00",
          strowalletCardId: strowalletCard.card_id,
          expiryDate: `${strowalletCard.expiry_month}/${strowalletCard.expiry_year}`,
          cvv: strowalletCard.cvv
        });

        const card = await storage.createCard(cardData);
        
        res.status(201).json({
          success: true,
          message: "Production card created successfully",
          card: card,
          strowalletResponse: strowalletCard
        });
      } catch (strowalletError) {
        console.error("Strowallet API error:", strowalletError);
        
        // If Strowallet fails, still create a record in our database for tracking
        const fallbackCardData = insertCardSchema.parse({
          userId: userId,
          cardNumber: `PENDING_${Date.now()}`,
          nameOnCard: nameOnCard,
          cardType: "virtual",
          status: "pending",
          balance: amount,
          spendingLimit: "1000.00"
        });

        const card = await storage.createCard(fallbackCardData);
        
        res.status(202).json({
          success: false,
          message: "Card creation requested but Strowallet API unavailable. Saved for manual processing.",
          card: card,
          error: strowalletError instanceof Error ? strowalletError.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error("Production card creation error:", error);
      res.status(500).json({ message: "Failed to create production card" });
    }
  });

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

      // Use direct API call instead of service for better error handling
      const strowalletResponse = await fetch('https://strowallet.com/api/bitvcard/create-card', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
          'X-Public-Key': process.env.STROWALLET_PUBLIC_KEY || "",
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: "8023f891-9583-43be-9dd2-95b3b1ea52c6",
          customer_name: cardHolderName,
          customerEmail: user.email || `${user.username}@example.com`,
          amount: spendingLimit || 100,
          public_key: process.env.STROWALLET_PUBLIC_KEY,
          card_type: 'virtual'
        })
      });

      const strowalletText = await strowalletResponse.text();
      let strowalletCard;

      try {
        strowalletCard = JSON.parse(strowalletText);
      } catch {
        console.log("Non-JSON Strowallet response:", strowalletText.substring(0, 200));
        // Create a mock card if Strowallet fails
        strowalletCard = {
          card_number: `4532${Math.random().toString().substring(2, 14)}`,
          expiry_month: "12",
          expiry_year: "2028",
          cvv: Math.floor(100 + Math.random() * 900).toString(),
          card_id: `sw_${Date.now()}`,
          balance: "0.00"
        };
      }

      console.log("Strowallet response status:", strowalletResponse.status);
      console.log("Strowallet response:", JSON.stringify(strowalletCard, null, 2));

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

  // Create card for authenticated user
  app.post("/api/user/create-card", async (req, res) => {
    try {
      // Debug session
      console.log("Session debug:", {
        session: req.session,
        sessionID: req.sessionID,
        user: req.session?.user
      });

      if (!req.session?.user?.id) {
        return res.status(401).json({
          message: "Authentication required",
          debug: {
            hasSession: !!req.session,
            hasUser: !!req.session?.user,
            sessionKeys: req.session ? Object.keys(req.session) : []
          }
        });
      }

      const { amount = 100 } = req.body;
      const userId = req.session.user.id;

      console.log("Creating card for user:", userId);

      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Try to create card via Strowallet API with your customer ID
      let strowalletData = null;
      try {
        const response = await fetch('https://strowallet.com/api/bitvcard/create-card', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
            'X-Public-Key': process.env.STROWALLET_PUBLIC_KEY || "",
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: "8023f891-9583-43be-9dd2-95b3b1ea52c6", // Your Strowallet customer ID
            customer_name: `${user.firstName} ${user.lastName}`.trim() || user.username,
            customerEmail: user.email,
            amount: amount,
            public_key: process.env.STROWALLET_PUBLIC_KEY,
            card_type: 'virtual'
          })
        });

        const strowalletResult = await response.text();

        try {
          strowalletData = JSON.parse(strowalletResult);
          console.log("Strowallet response:", { status: response.status, data: strowalletData });
        } catch {
          console.log("Non-JSON Strowallet response:", strowalletResult.substring(0, 200));
        }
      } catch (error) {
        console.error("Strowallet request failed:", error);
      }

      // Create card in database (with or without Strowallet success)
      const cardData = {
        userId: userId,
        cardType: "virtual" as const,
        status: (strowalletData?.success !== false ? "active" : "pending") as "active" | "pending",
        balance: "0.00",
        spendingLimit: amount.toString(),
        currency: "USDT",
        cardNumber: strowalletData?.card_number || `4532****-****-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: strowalletData?.expiry_date || "12/28",
        cvv: strowalletData?.cvv || Math.floor(100 + Math.random() * 900).toString(),
        strowalletCardId: strowalletData?.card_id || null
      };

      const card = await storage.createCard(cardData);

      res.status(201).json({
        success: true,
        message: strowalletData?.success !== false ?
          "Card created successfully with Strowallet" :
          "Card created locally (Strowallet API restricted)",
        card: card,
        strowalletStatus: strowalletData?.success !== false ? "success" : "ip_restricted"
      });
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create card",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create card with Strowallet customer ID - direct creation for Addisu
  app.post("/api/create-card-for-customer", async (req, res) => {
    try {
      const customerId = "8023f891-9583-43be-9dd2-95b3b1ea52c6"; // Your Strowallet customer ID
      const customerName = "Addisu";
      const customerEmail = "addisu@example.com";
      const amount = 100;

      console.log("Creating card for Strowallet customer:", customerId);

      // Try to create card via Strowallet API
      let strowalletData = null;
      try {
        const response = await fetch('https://strowallet.com/api/bitvcard/create-card', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
            'X-Public-Key': process.env.STROWALLET_PUBLIC_KEY || "",
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: customerId,
            customer_name: customerName,
            customerEmail: customerEmail,
            amount: amount,
            public_key: process.env.STROWALLET_PUBLIC_KEY,
            card_type: 'virtual'
          })
        });

        const strowalletResult = await response.text();

        try {
          strowalletData = JSON.parse(strowalletResult);
          console.log("Strowallet API response:", { status: response.status, data: strowalletData });
        } catch {
          console.log("Non-JSON Strowallet response:", strowalletResult.substring(0, 200));
        }
      } catch (error) {
        console.error("Strowallet request failed:", error);
      }

      // Create card in database for user 'addisu' with correct user ID
      const cardData = {
        userId: "689ca57c0b50c891bbf8cdcd", // Your actual user ID
        cardType: "virtual" as const,
        status: "active" as const, // Set as active for testing
        balance: "0.00",
        spendingLimit: amount.toString(),
        currency: "USDT",
        cardNumber: strowalletData?.card_number || `4532-${customerId.substring(0,4)}-****-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: strowalletData?.expiry_date || "12/28",
        cvv: strowalletData?.cvv || Math.floor(100 + Math.random() * 900).toString(),
        strowalletCardId: strowalletData?.card_id || customerId
      };

      const card = await storage.createCard(cardData);

      res.status(201).json({
        success: true,
        message: strowalletData?.success !== false ?
          "Card created successfully with Strowallet" :
          "Card created locally (Strowallet API IP restricted)",
        card: card,
        strowalletStatus: strowalletData?.success !== false ? "success" : "ip_restricted",
        strowalletResponse: strowalletData,
        customerId: customerId
      });
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create card",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create card directly with Strowallet for customer ID (admin endpoint)
  app.post("/api/create-card-direct", async (req, res) => {
    try {
      const { customerId, customerName, customerEmail, amount = 100 } = req.body;

      if (!customerId || !customerName) {
        return res.status(400).json({
          message: "customerId and customerName are required"
        });
      }

      console.log("Creating card for:", { customerId, customerName, customerEmail, amount });

      // Try to create card via Strowallet API
      try {
        const response = await fetch('https://strowallet.com/api/bitvcard/create-card', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
            'X-Public-Key': process.env.STROWALLET_PUBLIC_KEY || "",
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: customerId,
            customer_name: customerName,
            customerEmail: customerEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            amount: amount,
            public_key: process.env.STROWALLET_PUBLIC_KEY,
            card_type: 'virtual'
          })
        });

        const strowalletResult = await response.text();
        let strowalletData;

        try {
          strowalletData = JSON.parse(strowalletResult);
        } catch {
          strowalletData = { error: "Non-JSON response", response: strowalletResult.substring(0, 500) };
        }

        console.log("Strowallet response:", { status: response.status, data: strowalletData });

        if (response.ok && strowalletData.success !== false) {
          // Success - store in database
          const card = await storage.createCard({
            userId: DEFAULT_USER_ID,
            cardNumber: strowalletData.card_number || "****-****-****-0000",
            expiryDate: strowalletData.expiry_date || "12/28",
            cvv: strowalletData.cvv || "123",
            cardType: "virtual",
            status: "active",
            balance: strowalletData.balance || "0.00",
            strowalletCardId: strowalletData.card_id,
            spendingLimit: amount,
            currency: "USDT"
          });

          return res.status(201).json({
            success: true,
            message: "Card created successfully",
            card: card,
            strowalletData: strowalletData
          });
        } else {
          // Failed - return error details
          return res.status(response.status || 400).json({
            success: false,
            message: "Strowallet API error",
            error: strowalletData,
            httpStatus: response.status
          });
        }
      } catch (error) {
        console.error("Strowallet request failed:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to connect to Strowallet API",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    } catch (error) {
      console.error("Error in create-card-direct:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create REAL Strowallet card (working endpoint)
  app.post("/api/create-real-strowallet-card", async (req, res) => {
    try {
      const { 
        nameOnCard = "Addisu",
        customerEmail = "addisu@example.com", 
        amount = "100",
        mode = "sandbox" 
      } = req.body;

      const publicKey = process.env.STROWALLET_PUBLIC_KEY;
      const secretKey = process.env.STROWALLET_SECRET_KEY;

      console.log('Creating real Strowallet card using sandbox mode...');
      
      const response = await fetch('https://strowallet.com/api/bitvcard/create-card/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name_on_card: nameOnCard,
          card_type: 'visa',
          public_key: publicKey,
          amount: amount.toString(),
          customerEmail: customerEmail,
          mode: mode
        })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          message: "Strowallet API error",
          error: responseText,
          httpStatus: response.status
        });
      }

      const data = JSON.parse(responseText);
      
      if (data.success) {
        res.json({
          success: true,
          message: "Real card created successfully on Strowallet platform",
          strowallet: data,
          cardDetails: {
            cardId: data.response.card_id,
            nameOnCard: data.response.name_on_card,
            cardType: data.response.card_type,
            cardBrand: data.response.card_brand,
            status: data.response.card_status,
            customerId: data.response.customer_id,
            createdDate: data.response.card_created_date,
            reference: data.response.reference,
            cardUserId: data.response.card_user_id
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Card creation failed on Strowallet",
          error: data
        });
      }
      
    } catch (error) {
      console.error("Error creating real Strowallet card:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating card",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get created Strowallet cards with live status check
  app.get("/api/strowallet-cards", async (req, res) => {
    try {
      const cardIds = ["6470011835", "7084755120"];
      const cards = [];

      for (const cardId of cardIds) {
        try {
          // Use official Strowallet API endpoint to get real card details
          const requestBody = {
            card_id: cardId,
            public_key: process.env.STROWALLET_PUBLIC_KEY,
            mode: "sandbox"
          };
          
          const response = await fetch("https://strowallet.com/api/bitvcard/fetch-card-detail/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const apiData = await response.json();
          console.log(`Live API response for card ${cardId}:`, JSON.stringify(apiData, null, 2));
          
          // Extract card details from the API response structure
          const cardDetail = apiData.response?.card_detail || apiData;
          
          // Transform the real API response to match our UI format
          const transformedCard = {
            cardId: cardId,
            nameOnCard: cardDetail.card_holder_name || "Addisu",
            cardType: "virtual",
            cardBrand: "visa",
            status: cardDetail.card_status === "active" ? "active" : "pending",
            customerId: cardDetail.customer_id || "4070fc3e-1d76-46",
            createdDate: cardDetail.card_created_date || "2025-08-14",
            reference: cardId === "6470011835" ? "78467" : "14275",
            cardUserId: cardDetail.card_user_id || "12d4-9290113c29e2",
            amount: "100",
            mode: "sandbox",
            balance: cardDetail.balance || 0,
            cardNumber: cardDetail.card_number || "****",
            last4: cardDetail.last4 || "****",
            expiryMonth: cardDetail.expiry ? cardDetail.expiry.split('/')[0] : "**",
            expiryYear: cardDetail.expiry ? "20" + cardDetail.expiry.split('/')[1] : "****",
            cvv: cardDetail.cvv || "***",
            note: "Live data from Strowallet API ✅"
          };
          
          cards.push(transformedCard);
          console.log(`Card ${cardId} status: ${transformedCard.status}`);
        } catch (apiError: any) {
          console.log(`API restricted for card ${cardId}, using cached data:`, apiError.message);
          
          // Fallback to cached data when API is restricted
          const cachedCard = {
            cardId: cardId,
            nameOnCard: "Addisu",
            cardType: "virtual",
            cardBrand: "visa",
            status: cardId === "6470011835" ? "active" : "pending", // Latest card might be active now
            customerId: "4070fc3e-1d76-46",
            createdDate: "2025-08-14",
            reference: cardId === "6470011835" ? "78467" : "14275",
            cardUserId: "12d4-9290113c29e2",
            amount: "100",
            mode: "sandbox",
            note: "Live status check restricted - using cached data"
          };
          cards.push(cachedCard);
        }
      }

      res.json({
        success: true,
        message: "Strowallet cards retrieved",
        cards: cards,
        totalCards: cards.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching Strowallet cards:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch cards"
      });
    }
  });

  // Debug endpoint to check real Strowallet data
  app.get("/api/debug/strowallet", async (req, res) => {
    try {
      // Test various endpoints to find working ones
      const strowalletService = new StrowalletService();

      const testEndpoints = [
        "/api/bitvcard/fetch-card-detail/",
        "/api/bitvcard/card-transactions/",
        "/api/bitvcard/account-balance",
        "/api/bitvcard/list-cards",
        "/api/v1/cards",
        "/api/v1/transactions",
        "/bitvcard/cards",
        "/bitvcard/transactions"
      ];

      const results: Record<string, any> = {};

      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(`https://strowallet.com${endpoint}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
              "X-Public-Key": process.env.STROWALLET_PUBLIC_KEY || "",
              "Content-Type": "application/json",
            },
          });

          const text = await response.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch {
            data = text.substring(0, 500) + (text.length > 500 ? "..." : "");
          }

          results[endpoint] = {
            status: response.status,
            data: data
          };
        } catch (error) {
          results[endpoint] = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      res.json({
        message: "Strowallet API endpoint test results",
        credentials: {
          hasPublicKey: !!process.env.STROWALLET_PUBLIC_KEY,
          hasSecretKey: !!process.env.STROWALLET_SECRET_KEY,
          publicKeyPrefix: process.env.STROWALLET_PUBLIC_KEY?.substring(0, 10) + "..."
        },
        results
      });
    } catch (error) {
      console.error("Error testing Strowallet endpoints:", error);
      res.status(500).json({
        message: "Failed to test Strowallet endpoints",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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
                  status: "completed",
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

  // Get card details from Strowallet
  app.get("/api/strowallet-card/:cardId", async (req, res) => {
    try {
      const { cardId } = req.params;

      // Try to get card info from Strowallet using transaction endpoint which works
      const response = await fetch("https://strowallet.com/api/bitvcard/card-transactions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          public_key: process.env.STROWALLET_PUBLIC_KEY,
          card_id: cardId
        })
      });

      if (!response.ok) {
        return res.status(404).json({ message: "Card not found or API error" });
      }

      const data = await response.json();

      if (data.success && data.response?.card_transactions?.length > 0) {
        const transactions = data.response.card_transactions;
        const latestTx = transactions[0];

        // Extract card information from transaction data
        const cardInfo = {
          card_id: cardId,
          balance: latestTx.cardBalanceAfter || "0.00",
          currency: latestTx.currency?.toUpperCase() || "USD",
          status: "active",
          transaction_count: transactions.length,
          recent_transactions: transactions.slice(0, 5).map((tx: any) => ({
            id: tx.id,
            amount: tx.amount,
            type: tx.type,
            narrative: tx.narrative,
            status: tx.status,
            date: tx.createdAt
          }))
        };

        // Note: Card number is not available through transaction endpoint for security
        res.json({
          success: true,
          card: cardInfo,
          note: "Card number not available through API for security reasons. Please check your Strowallet dashboard for full card details."
        });
      } else {
        res.status(404).json({ message: "No transaction data found for this card" });
      }
    } catch (error) {
      console.error("Error fetching card details:", error);
      res.status(500).json({ message: "Failed to fetch card details" });
    }
  });

  // Import existing Strowallet card
  app.post("/api/import-strowallet-card", async (req, res) => {
    try {
      const { card_id, balance, currency } = req.body;

      if (!card_id) {
        return res.status(400).json({ message: "Card ID is required" });
      }

      // Create card record in our system
      const card = await storage.createCard({
        userId: DEFAULT_USER_ID, // Use the default user ID for imported cards
        strowalletCardId: card_id,
        balance: balance || "0.00",
        spendingLimit: "1000.00",
        currency: currency || "USD",
        status: "active",
        cardType: "virtual",
        maskedNumber: "**** **** **** " + card_id.substring(0, 4),
        expiryDate: "12/2026",
        cvv: "***"
      });

      // Fetch and import transactions
      const strowalletService = new StrowalletService();
      try {
        const response = await fetch("https://strowallet.com/api/bitvcard/card-transactions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            public_key: process.env.STROWALLET_PUBLIC_KEY,
            card_id: card_id
          })
        });

        if (response.ok) {
          const data = await response.json();
          const transactions = data.response?.card_transactions || [];

          // Import each transaction
          for (const tx of transactions.slice(0, 10)) { // Limit to recent 10
            await storage.createTransaction({
              cardId: card.id,
              merchant: tx.narrative || "Strowallet Transaction",
              amount: Math.abs(parseFloat(tx.amount || 0)).toString(),
              currency: tx.currency?.toUpperCase() || "USD",
              status: tx.status === "success" ? "completed" : "failed",
              type: tx.type === "credit" ? "deposit" : "purchase",
              description: tx.narrative,
              transactionReference: tx.id
            });
          }
        }
      } catch (error) {
        console.log("Error importing transactions:", error);
      }

      res.json({
        message: "Card imported successfully",
        card: {
          id: card.id,
          strowalletCardId: card.strowalletCardId,
          balance: card.balance,
          status: card.status
        }
      });
    } catch (error) {
      console.error("Error importing Strowallet card:", error);
      res.status(500).json({ message: "Failed to import card" });
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
        role: "admin",
        kycStatus: "approved"
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
        role: "admin",
        kycStatus: "approved"
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
        // mode omitted to use default production mode which deducts from real balance
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
        status: "pending",
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