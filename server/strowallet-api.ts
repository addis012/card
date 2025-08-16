/**
 * StroWallet API Integration
 * Based on official documentation - August 16, 2025
 */

interface StrowalletCustomerData {
  public_key: string;
  houseNumber: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  customerEmail: string;
  phoneNumber: string; // International format without '+' (e.g., 2348012345678)
  dateOfBirth: string; // MM/DD/YYYY format
  idImage: string; // URL or base64
  userPhoto: string; // URL or base64
  line1: string;
  state: string;
  zipCode: string;
  city: string;
  country: string;
  idType: "BVN" | "NIN" | "PASSPORT";
}

interface StrowalletCardData {
  name_on_card: string;
  card_type: "visa" | "mastercard";
  public_key: string;
  amount: string;
  customerEmail: string;
  mode?: "sandbox";
  developer_code?: string;
}

interface StrowalletFundData {
  card_id: string;
  amount: string;
  public_key: string;
  mode?: "sandbox";
}

interface StrowalletCardDetailsData {
  card_id: string;
  public_key: string;
  mode?: "sandbox";
}

interface StrowalletTransactionsData {
  card_id: string;
  public_key: string;
  mode?: "sandbox";
}

interface StrowalletCardActionData {
  action: "freeze" | "unfreeze";
  card_id: string;
  public_key: string;
}

export class StrowalletAPIService {
  private baseUrl = "https://strowallet.com/api/bitvcard";
  private publicKey: string;
  private mode: "sandbox" | "production";

  constructor() {
    this.publicKey = process.env.STROWALLET_PUBLIC_KEY || "";
    this.mode = process.env.NODE_ENV === "production" ? "production" : "sandbox";
    
    if (!this.publicKey) {
      console.warn("STROWALLET_PUBLIC_KEY not configured");
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const responseText = await response.text();
      
      // Try to parse JSON, fallback to text
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { raw: responseText, status: response.status };
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${responseText}`);
      }

      return data;
    } catch (error) {
      console.error(`StroWallet API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  /**
   * 1) Create Customer - Registers a new customer in StroWallet (KYC)
   */
  async createCustomer(customerData: Omit<StrowalletCustomerData, 'public_key'>): Promise<any> {
    const data: StrowalletCustomerData = {
      ...customerData,
      public_key: this.publicKey,
      // Ensure phone number is in correct format (no + prefix)
      phoneNumber: customerData.phoneNumber.replace(/^\+/, ''),
    };

    return this.makeRequest('/create-user/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 2) Get Customer
   */
  async getCustomer(customerId?: string, customerEmail?: string): Promise<any> {
    const params = new URLSearchParams({
      public_key: this.publicKey,
    });

    if (customerId) params.append('customerId', customerId);
    if (customerEmail) params.append('customerEmail', customerEmail);

    return this.makeRequest(`/getcardholder/?${params}`, {
      method: 'GET',
    });
  }

  /**
   * 3) Update Customer
   */
  async updateCustomer(customerId: string, updates: Partial<Omit<StrowalletCustomerData, 'public_key'>>): Promise<any> {
    const data = {
      public_key: this.publicKey,
      customerId,
      ...updates,
      // Ensure phone number is in correct format if provided
      ...(updates.phoneNumber && { phoneNumber: updates.phoneNumber.replace(/^\+/, '') }),
    };

    return this.makeRequest('/updateCardCustomer/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * 4) Create Card
   */
  async createCard(cardData: Omit<StrowalletCardData, 'public_key' | 'mode'>): Promise<any> {
    const data: StrowalletCardData = {
      ...cardData,
      public_key: this.publicKey,
      card_type: cardData.card_type || "visa",
      ...(this.mode === "sandbox" && { mode: "sandbox" }),
    };

    return this.makeRequest('/create-card/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 5) Fund Card
   */
  async fundCard(cardId: string, amount: string): Promise<any> {
    const data: StrowalletFundData = {
      card_id: cardId,
      amount,
      public_key: this.publicKey,
      ...(this.mode === "sandbox" && { mode: "sandbox" }),
    };

    return this.makeRequest('/fund-card/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 6) Get Card Details
   */
  async getCardDetails(cardId: string): Promise<any> {
    const data: StrowalletCardDetailsData = {
      card_id: cardId,
      public_key: this.publicKey,
      ...(this.mode === "sandbox" && { mode: "sandbox" }),
    };

    return this.makeRequest('/fetch-card-detail/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 7) Card Transactions (recent)
   */
  async getCardTransactions(cardId: string): Promise<any> {
    const data: StrowalletTransactionsData = {
      card_id: cardId,
      public_key: this.publicKey,
      ...(this.mode === "sandbox" && { mode: "sandbox" }),
    };

    return this.makeRequest('/card-transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 8) Freeze / Unfreeze Card
   */
  async cardAction(cardId: string, action: "freeze" | "unfreeze"): Promise<any> {
    const data: StrowalletCardActionData = {
      action,
      card_id: cardId,
      public_key: this.publicKey,
    };

    return this.makeRequest('/action/status/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * 9) Full Card History (paginated)
   */
  async getCardHistory(cardId: string, page: number = 1, take: number = 50): Promise<any> {
    const params = new URLSearchParams({
      card_id: cardId,
      page: page.toString(),
      take: Math.min(take, 50).toString(), // Max 50 per docs
      public_key: this.publicKey,
    });

    return this.makeRequest(`/apicard-transactions/?${params}`, {
      method: 'GET',
    });
  }

  /**
   * Helper method to convert date to MM/DD/YYYY format required by StroWallet
   */
  static formatDateOfBirth(date: string | Date): string {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  /**
   * Helper method to format phone number (remove + prefix)
   */
  static formatPhoneNumber(phone: string): string {
    return phone.replace(/^\+/, '');
  }

  /**
   * Helper method to validate required environment variables
   */
  static validateConfig(): { isValid: boolean; missing: string[] } {
    const required = ['STROWALLET_PUBLIC_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    return {
      isValid: missing.length === 0,
      missing,
    };
  }
}