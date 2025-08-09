import { z } from "zod";

// Strowallet API configuration
const STROWALLET_BASE_URL = "https://api.strowallet.com/v1";

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

export type StrowalletCreateCardRequest = z.infer<typeof strowalletCreateCardSchema>;
export type StrowalletCardResponse = z.infer<typeof strowalletCardResponseSchema>;

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
      const response = await fetch(`${STROWALLET_BASE_URL}/cards`, {
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
}