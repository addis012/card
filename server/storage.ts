import { 
  type User, type InsertUser, 
  type Card, type InsertCard, 
  type Transaction, type InsertTransaction, 
  type ApiKey, type InsertApiKey,
  type Deposit, type InsertDeposit,
  type KycDocument, type InsertKycDocument
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Card methods
  getCard(id: string): Promise<Card | undefined>;
  getCardsByUserId(userId: string): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined>;
  deleteCard(id: string): Promise<boolean>;

  // Transaction methods
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByCardId(cardId: string): Promise<Transaction[]>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // API Key methods
  getApiKeysByUserId(userId: string): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined>;

  // Deposit methods
  getDeposit(id: string): Promise<Deposit | undefined>;
  getDepositsByUserId(userId: string): Promise<Deposit[]>;
  getAllDeposits(): Promise<Deposit[]>;
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined>;

  // KYC methods
  getKycDocumentsByUserId(userId: string): Promise<KycDocument[]>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  createKycDocument(document: InsertKycDocument): Promise<KycDocument>;
  updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cards: Map<string, Card> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private deposits: Map<string, Deposit> = new Map();
  private kycDocuments: Map<string, KycDocument> = new Map();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create a default user
    const defaultUser: User = {
      id: 'user-1',
      username: 'demo',
      password: '$2b$10$demohashedpassword',
      email: 'demo@cardflow.com',
      firstName: 'Demo',
      lastName: 'User',
      phone: null,
      role: 'user',
      kycStatus: 'pending',
      kycDocuments: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create an admin user
    const adminUser: User = {
      id: 'admin-1',
      username: 'admin',
      password: '$2b$10$adminhashedpassword',
      email: 'admin@cardflow.com',
      firstName: 'Admin',
      lastName: 'User',
      phone: null,
      role: 'admin',
      kycStatus: 'approved',
      kycDocuments: null,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      role: insertUser.role || 'user',
      kycStatus: 'pending',
      kycDocuments: null,
      phone: insertUser.phone || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Card methods
  async getCard(id: string): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async getCardsByUserId(userId: string): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(card => card.userId === userId);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const card: Card = {
      ...insertCard,
      id: randomUUID(),
      cardNumber: insertCard.cardNumber || null,
      maskedNumber: insertCard.maskedNumber || null,
      expiryDate: insertCard.expiryDate || null,
      cvv: insertCard.cvv || null,
      balance: insertCard.balance || "0.00",
      spendingLimit: insertCard.spendingLimit || "1000.00",
      currency: insertCard.currency || "USDT",
      cardType: insertCard.cardType || "virtual",
      status: "pending",
      strowalletCardId: insertCard.strowalletCardId || null,
      billingAddress: insertCard.billingAddress || null,
      billingCity: insertCard.billingCity || null,
      billingState: insertCard.billingState || null,
      billingZip: insertCard.billingZip || null,
      billingCountry: insertCard.billingCountry || null,
      nameOnCard: insertCard.nameOnCard || null,
      approvedAt: null,
      createdAt: new Date(),
    };
    this.cards.set(card.id, card);
    return card;
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
  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByCardId(cardId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(tx => tx.cardId === cardId);
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const userCards = await this.getCardsByUserId(userId);
    const cardIds = userCards.map(card => card.id);
    return Array.from(this.transactions.values()).filter(tx => cardIds.includes(tx.cardId));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const transaction: Transaction = {
      ...insertTransaction,
      id: randomUUID(),
      type: insertTransaction.type || 'purchase',
      status: insertTransaction.status || 'pending',
      currency: insertTransaction.currency || 'USDT',
      description: insertTransaction.description || null,
      transactionReference: insertTransaction.transactionReference || null,
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  // API Key methods
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const apiKey: ApiKey = {
      ...insertApiKey,
      id: randomUUID(),
      key: `ak_${randomUUID().replace(/-/g, '')}`,
      permissions: insertApiKey.permissions || [],
      lastUsed: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.apiKeys.set(apiKey.id, apiKey);
    return apiKey;
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return undefined;
    
    const updatedApiKey = { ...apiKey, ...updates };
    this.apiKeys.set(id, updatedApiKey);
    return updatedApiKey;
  }

  // Deposit methods
  async getDeposit(id: string): Promise<Deposit | undefined> {
    return this.deposits.get(id);
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    return Array.from(this.deposits.values()).filter(deposit => deposit.userId === userId);
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return Array.from(this.deposits.values());
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const deposit: Deposit = {
      ...insertDeposit,
      id: randomUUID(),
      status: insertDeposit.status || 'pending',
      currency: insertDeposit.currency || 'ETB',
      transactionReference: insertDeposit.transactionReference || null,
      adminNotes: insertDeposit.adminNotes || null,
      processedBy: null,
      processedAt: null,
      createdAt: new Date(),
    };
    this.deposits.set(deposit.id, deposit);
    return deposit;
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const deposit = this.deposits.get(id);
    if (!deposit) return undefined;
    
    const updatedDeposit = { ...deposit, ...updates };
    this.deposits.set(id, updatedDeposit);
    return updatedDeposit;
  }

  // KYC methods
  async getKycDocumentsByUserId(userId: string): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values()).filter(doc => doc.userId === userId);
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values());
  }

  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument> {
    const kycDocument: KycDocument = {
      ...insertKycDocument,
      id: randomUUID(),
      documentUrl: insertKycDocument.documentUrl || null,
      status: "pending",
      reviewedBy: null,
      reviewNotes: null,
      reviewedAt: null,
      createdAt: new Date(),
    };
    this.kycDocuments.set(kycDocument.id, kycDocument);
    return kycDocument;
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const kycDocument = this.kycDocuments.get(id);
    if (!kycDocument) return undefined;
    
    const updatedKycDocument = { ...kycDocument, ...updates };
    this.kycDocuments.set(id, updatedKycDocument);
    return updatedKycDocument;
  }
}

export const storage = new MemStorage();