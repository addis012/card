import type {
  User,
  Card,
  Transaction,
  ApiKey,
  Deposit,
  KycDocument,
  StrowalletCustomer,
  InsertUser,
  InsertCard,
  InsertTransaction,
  InsertApiKey,
  InsertDeposit,
  InsertKycDocument,
  InsertStrowalletCustomer,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  createUser(insertUser: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUser(id: string): Promise<User | undefined>; // Alias for getUserById
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  deleteUserByUsername(username: string): Promise<boolean>;

  // Card methods
  createCard(insertCard: InsertCard): Promise<Card>;
  getCardsByUserId(userId: string): Promise<Card[]>;
  getAllCards(): Promise<Card[]>;
  getCardById(id: string): Promise<Card | undefined>;
  getCard(id: string): Promise<Card | undefined>; // Alias for getCardById
  updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<boolean>;

  // Transaction methods
  createTransaction(insertTransaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  getTransactionsByCardId(cardId: string): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  
  // API Key methods
  createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeysByUserId(userId: string): Promise<ApiKey[]>;
  updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<boolean>;

  // Deposit methods
  createDeposit(insertDeposit: InsertDeposit): Promise<Deposit>;
  getDepositsByUserId(userId: string): Promise<Deposit[]>;
  getAllDeposits(): Promise<Deposit[]>;
  updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined>;

  // KYC Document methods
  createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument>;
  getKycDocumentsByUserId(userId: string): Promise<KycDocument[]>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined>;

  // Strowallet Customer methods
  createStrowalletCustomer(insertStrowalletCustomer: InsertStrowalletCustomer): Promise<StrowalletCustomer>;
  getStrowalletCustomerByUserId(userId: string): Promise<StrowalletCustomer | undefined>;
  getStrowalletCustomerByEmail(email: string): Promise<StrowalletCustomer | undefined>;
  getAllStrowalletCustomers(): Promise<StrowalletCustomer[]>;
  updateStrowalletCustomer(id: string, updates: Partial<StrowalletCustomer>): Promise<StrowalletCustomer | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cards: Map<string, Card> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private deposits: Map<string, Deposit> = new Map();
  private kycDocuments: Map<string, KycDocument> = new Map();
  private strowalletCustomers: Map<string, StrowalletCustomer> = new Map();

  constructor() {
    // Initialize with admin user
    this.initializeAdmin();
  }

  private initializeAdmin() {
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      username: "administrator",
      password: "$2b$10$3n8iT0PZ1tXb8YxF.kGhCeLdDv6QTMVkww2OQwjd8Z2KmKzK1eO.m", // admin123
      email: "admin@cardflow.com",
      firstName: "System",
      lastName: "Administrator",
      phone: null,
      role: "admin",
      kycStatus: "approved",
      kycDocuments: null,
      createdAt: new Date(),
    };
    this.users.set(adminId, admin);

    // Add test user
    const testUserId = randomUUID();
    const testUser: User = {
      id: testUserId,
      username: "testuser",
      password: "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPDw/mi2.W", // test123
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      phone: "+1234567890",
      role: "user",
      kycStatus: "approved",
      kycDocuments: null,
      createdAt: new Date(),
    };
    this.users.set(testUserId, testUser);
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      ...insertUser,
      phone: insertUser.phone || null,
      kycDocuments: insertUser.kycDocuments || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async deleteUserByUsername(username: string): Promise<boolean> {
    const user = Array.from(this.users.entries()).find(([_, u]) => u.username === username);
    if (!user) return false;
    
    return this.users.delete(user[0]);
  }

  // Card methods
  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = randomUUID();
    const card: Card = {
      id,
      ...insertCard,
      cardNumber: insertCard.cardNumber || null,
      maskedNumber: insertCard.maskedNumber || null,
      expiryDate: insertCard.expiryDate || null,
      cvv: insertCard.cvv || null,
      strowalletCardId: insertCard.strowalletCardId || null,
      billingAddress: insertCard.billingAddress || null,
      billingCity: insertCard.billingCity || null,
      billingState: insertCard.billingState || null,
      billingZip: insertCard.billingZip || null,
      billingCountry: insertCard.billingCountry || null,
      nameOnCard: insertCard.nameOnCard || null,
      approvedAt: insertCard.approvedAt || null,
      createdAt: new Date(),
    };
    this.cards.set(id, card);
    return card;
  }

  async getCardsByUserId(userId: string): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(card => card.userId === userId);
  }

  async getAllCards(): Promise<Card[]> {
    return Array.from(this.cards.values());
  }

  async getCardById(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getCard(id: string): Promise<Card | undefined> {
    return this.getCardById(id);
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, ...updates };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async deleteCard(id: string): Promise<boolean> {
    return this.cards.delete(id);
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      id,
      ...insertTransaction,
      description: insertTransaction.description || null,
      transactionReference: insertTransaction.transactionReference || null,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const userCards = await this.getCardsByUserId(userId);
    const cardIds = userCards.map(card => card.id);
    return Array.from(this.transactions.values()).filter(transaction => 
      cardIds.includes(transaction.cardId)
    );
  }

  async getTransactionsByCardId(cardId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => transaction.cardId === cardId);
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  // API Key methods
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = randomUUID();
    const key = randomUUID();
    const apiKey: ApiKey = {
      id,
      key,
      ...insertApiKey,
      lastUsed: insertApiKey.lastUsed || null,
      createdAt: new Date(),
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(apiKey => apiKey.userId === userId);
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return undefined;
    
    const updatedApiKey = { ...apiKey, ...updates };
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    return this.apiKeys.delete(id);
  }

  // Deposit methods
  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const id = randomUUID();
    const deposit: Deposit = {
      id,
      ...insertDeposit,
      transactionReference: insertDeposit.transactionReference || null,
      adminNotes: insertDeposit.adminNotes || null,
      processedBy: insertDeposit.processedBy || null,
      processedAt: insertDeposit.processedAt || null,
      createdAt: new Date(),
    };
    this.deposits.set(id, deposit);
    return deposit;
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    return Array.from(this.deposits.values()).filter(deposit => deposit.userId === userId);
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return Array.from(this.deposits.values());
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const deposit = this.deposits.get(id);
    if (!deposit) return undefined;
    
    const updatedDeposit = { ...deposit, ...updates };
    this.deposits.set(id, updatedDeposit);
    return updatedDeposit;
  }

  // KYC Document methods
  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument> {
    const id = randomUUID();
    const kycDocument: KycDocument = {
      id,
      ...insertKycDocument,
      documentUrl: insertKycDocument.documentUrl || null,
      reviewedBy: insertKycDocument.reviewedBy || null,
      reviewNotes: insertKycDocument.reviewNotes || null,
      reviewedAt: insertKycDocument.reviewedAt || null,
      createdAt: new Date(),
    };
    this.kycDocuments.set(id, kycDocument);
    return kycDocument;
  }

  async getKycDocumentsByUserId(userId: string): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values()).filter(doc => doc.userId === userId);
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values());
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const doc = this.kycDocuments.get(id);
    if (!doc) return undefined;
    
    const updatedDoc = { ...doc, ...updates };
    this.kycDocuments.set(id, updatedDoc);
    return updatedDoc;
  }

  // Strowallet Customer methods
  async createStrowalletCustomer(insertStrowalletCustomer: InsertStrowalletCustomer): Promise<StrowalletCustomer> {
    const id = randomUUID();
    const strowalletCustomer: StrowalletCustomer = {
      id,
      createdAt: new Date(),
      ...insertStrowalletCustomer,
    };
    this.strowalletCustomers.set(id, strowalletCustomer);
    return strowalletCustomer;
  }

  async getStrowalletCustomerByUserId(userId: string): Promise<StrowalletCustomer | undefined> {
    for (const customer of this.strowalletCustomers.values()) {
      if (customer.userId === userId) return customer;
    }
    return undefined;
  }

  async getStrowalletCustomerByEmail(email: string): Promise<StrowalletCustomer | undefined> {
    for (const customer of this.strowalletCustomers.values()) {
      if (customer.customerEmail === email) return customer;
    }
    return undefined;
  }

  async getAllStrowalletCustomers(): Promise<StrowalletCustomer[]> {
    return Array.from(this.strowalletCustomers.values());
  }

  async updateStrowalletCustomer(id: string, updates: Partial<StrowalletCustomer>): Promise<StrowalletCustomer | undefined> {
    const customer = this.strowalletCustomers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updates };
    this.strowalletCustomers.set(id, updatedCustomer);
    return updatedCustomer;
  }
}

// Export storage instance
export const storage = new MemStorage();