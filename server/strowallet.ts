import { z } from "zod";

// Strowallet API configuration
const STROWALLET_BASE_URL = "https://strowallet.com/api/bitvcard";

// Strowallet card creation request schema
const strowalletCreateCardSchema = z.object({
  customer_id: z.string(),
  card_type: z.enum(["VIRTUAL", "PHYSICAL"]),
  currency: z.string().default("USD"),
  spending_limit: z.number().optional(),
  customer_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
});

// Strowallet card response schema
const strowalletCardResponseSchema = z.object({
  card_id: z.string(),
  card_number: z.string(),
  expiry_month: z.string(),
  expiry_year: z.string(),
  cvv: z.string(),
  status: z.string(),
  created_at: z.string(),
});

// Additional schemas for new functionality
const strowalletFundCardSchema = z.object({
  card_id: z.string(),
  amount: z.number().min(0.01),
  currency: z.string().default("USD"),
});

const strowalletCardDetailsSchema = z.object({
  card_id: z.string(),
});

const strowalletTransactionsSchema = z.object({
  card_id: z.string(),
  limit: z.number().optional().default(50),
  offset: z.number().optional().default(0),
});

const strowalletTransactionSchema = z.object({
  transaction_id: z.string(),
  card_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  status: z.enum(["completed", "pending", "failed"]),
  transaction_type: z.enum(["debit", "credit"]),
  created_at: z.string(),
  merchant_name: z.string().optional(),
  merchant_category: z.string().optional(),
});

const strowalletFundResponseSchema = z.object({
  transaction_id: z.string(),
  card_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  created_at: z.string(),
});

const strowalletCardDetailsResponseSchema = z.object({
  card_id: z.string(),
  card_number: z.string(),
  expiry_month: z.string(),
  expiry_year: z.string(),
  status: z.string(),
  balance: z.number(),
  currency: z.string(),
  spending_limit: z.number().optional(),
  is_blocked: z.boolean().optional(),
});

const strowalletTransactionsResponseSchema = z.object({
  transactions: z.array(strowalletTransactionSchema),
  total_count: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export type StrowalletCreateCardRequest = z.infer<typeof strowalletCreateCardSchema>;
export type StrowalletCardResponse = z.infer<typeof strowalletCardResponseSchema>;
export type StrowalletFundCardRequest = z.infer<typeof strowalletFundCardSchema>;
export type StrowalletFundResponse = z.infer<typeof strowalletFundResponseSchema>;
export type StrowalletCardDetailsRequest = z.infer<typeof strowalletCardDetailsSchema>;
export type StrowalletCardDetailsResponse = z.infer<typeof strowalletCardDetailsResponseSchema>;
export type StrowalletTransactionsRequest = z.infer<typeof strowalletTransactionsSchema>;
export type StrowalletTransaction = z.infer<typeof strowalletTransactionSchema>;
export type StrowalletTransactionsResponse = z.infer<typeof strowalletTransactionsResponseSchema>;

export class StrowalletService {
  private publicKey: string;
  private secretKey: string;

  constructor() {
    this.publicKey = process.env.STROWALLET_PUBLIC_KEY || "";
    this.secretKey = process.env.STROWALLET_SECRET_KEY || "";
    
    if (!this.publicKey || !this.secretKey) {
      throw new Error("Strowallet API credentials not found. Please set STROWALLET_PUBLIC_KEY and STROWALLET_SECRET_KEY environment variables.");
    }
  }

  private getAuthHeaders() {
    return {
      "Authorization": `Bearer ${this.secretKey}`,
      "X-Public-Key": this.publicKey,
      "Content-Type": "application/json",
    };
  }

  async createCard(request: StrowalletCreateCardRequest): Promise<StrowalletCardResponse> {
    const validatedRequest = strowalletCreateCardSchema.parse(request);
    
    // For development - use mock response for testing
    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using mock Strowallet response for card creation");
      
      // Generate mock card response for development testing
      const mockResponse: StrowalletCardResponse = {
        card_id: `stw_card_${Date.now()}`,
        card_number: this.generateMockCardNumber(),
        expiry_month: "12",
        expiry_year: "2026",
        cvv: Math.floor(100 + Math.random() * 900).toString(),
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      };
      
      return mockResponse;
    }
    
    // Production mode - use real Strowallet API
    try {
      const response = await fetch(`${STROWALLET_BASE_URL}/create-card/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(validatedRequest),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strowallet API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return strowalletCardResponseSchema.parse(data);
    } catch (error) {
      console.error("Error creating card with Strowallet:", error);
      throw error;
    }
  }

  private generateMockCardNumber(): string {
    // Generate a valid Visa test card number
    const prefix = "4532";
    const remaining = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
    return prefix + remaining;
  }

  async getCard(cardId: string): Promise<StrowalletCardResponse> {
    try {
      const response = await fetch(`${STROWALLET_BASE_URL}/cards/${cardId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strowallet API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return strowalletCardResponseSchema.parse(data);
    } catch (error) {
      console.error("Error fetching card from Strowallet:", error);
      throw error;
    }
  }

  async updateCardStatus(cardId: string, status: "ACTIVE" | "INACTIVE" | "BLOCKED"): Promise<void> {
    if (process.env.NODE_ENV === "development") {
      console.log(`Development mode: Mock card status update for ${cardId} to ${status}`);
      return;
    }

    try {
      const response = await fetch(`${STROWALLET_BASE_URL}/cards/${cardId}/status`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strowallet API error: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error("Error updating card status with Strowallet:", error);
      throw error;
    }
  }

  // Fund a card with specific amount
  async fundCard(request: StrowalletFundCardRequest): Promise<StrowalletFundResponse> {
    const validatedRequest = strowalletFundCardSchema.parse(request);

    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using mock Strowallet response for card funding");
      
      const mockResponse: StrowalletFundResponse = {
        transaction_id: `txn_${Date.now()}`,
        card_id: validatedRequest.card_id,
        amount: validatedRequest.amount,
        currency: validatedRequest.currency,
        status: "completed",
        created_at: new Date().toISOString(),
      };
      
      return mockResponse;
    }

    try {
      const response = await fetch(`${STROWALLET_BASE_URL}/fund-card/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(validatedRequest),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strowallet API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return strowalletFundResponseSchema.parse(data);
    } catch (error) {
      console.error("Error funding card with Strowallet:", error);
      throw error;
    }
  }

  // Get detailed card information including balance
  async getCardDetails(request: StrowalletCardDetailsRequest): Promise<StrowalletCardDetailsResponse> {
    const validatedRequest = strowalletCardDetailsSchema.parse(request);

    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using mock Strowallet response for card details");
      
      const mockResponse: StrowalletCardDetailsResponse = {
        card_id: validatedRequest.card_id,
        card_number: "4532738364347306",
        expiry_month: "12",
        expiry_year: "2026",
        status: "ACTIVE",
        balance: Math.floor(Math.random() * 5000 * 100) / 100, // Random balance
        currency: "USD",
        spending_limit: 5000,
        is_blocked: false,
      };
      
      return mockResponse;
    }

    try {
      const response = await fetch(`${STROWALLET_BASE_URL}/fetch-card-detail/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(validatedRequest),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strowallet API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return strowalletCardDetailsResponseSchema.parse(data);
    } catch (error) {
      console.error("Error fetching card details from Strowallet:", error);
      throw error;
    }
  }

  // Get card transaction history
  async getCardTransactions(request: StrowalletTransactionsRequest): Promise<StrowalletTransactionsResponse> {
    const validatedRequest = strowalletTransactionsSchema.parse(request);

    if (process.env.NODE_ENV === "development") {
      console.log("Development mode: Using mock Strowallet response for card transactions");
      
      // Generate mock transactions
      const mockTransactions: StrowalletTransaction[] = [
        {
          transaction_id: `txn_${Date.now()}_1`,
          card_id: validatedRequest.card_id,
          amount: -25.99,
          currency: "USD",
          description: "Coffee Shop Purchase",
          status: "completed",
          transaction_type: "debit",
          created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          merchant_name: "Starbucks",
          merchant_category: "Food & Beverage",
        },
        {
          transaction_id: `txn_${Date.now()}_2`,
          card_id: validatedRequest.card_id,
          amount: 500.00,
          currency: "USD",
          description: "Card Funding",
          status: "completed",
          transaction_type: "credit",
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        },
        {
          transaction_id: `txn_${Date.now()}_3`,
          card_id: validatedRequest.card_id,
          amount: -15.50,
          currency: "USD",
          description: "Netflix Subscription",
          status: "completed",
          transaction_type: "debit",
          created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          merchant_name: "Netflix",
          merchant_category: "Entertainment",
        },
      ];
      
      const mockResponse: StrowalletTransactionsResponse = {
        transactions: mockTransactions,
        total_count: mockTransactions.length,
        limit: validatedRequest.limit || 50,
        offset: validatedRequest.offset || 0,
      };
      
      return mockResponse;
    }

    try {
      const response = await fetch(`${STROWALLET_BASE_URL}/card-transactions/`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(validatedRequest),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Strowallet API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return strowalletTransactionsResponseSchema.parse(data);
    } catch (error) {
      console.error("Error fetching card transactions from Strowallet:", error);
      throw error;
    }
  }
}