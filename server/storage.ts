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

// DatabaseStorage class removed - using MemStorage for Replit environment

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cards: Map<string, Card> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private deposits: Map<string, Deposit> = new Map();
  private kycDocuments: Map<string, KycDocument> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUser: User = {
      id: 'user-1',
      username: 'demo@cardflow.com',
      password: 'demo123',
      email: 'demo@cardflow.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+251901234567',
      role: 'user',
      kycStatus: 'pending',
      kycDocuments: null,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create API keys
    const apiKey: ApiKey = {
      id: 'api-1',
      userId: defaultUser.id,
      publicKey: 'pub_hoAnJXAVOxfE6VibvCya7EiXEnw3YyjLhhLAk4cF',
      secretKey: 'sec_neCKIYtRYqCwOvHJcBwwBAz4PASKF4gHvvtvdNde',
      isTestMode: true,
      createdAt: new Date(),
    };
    this.apiKeys.set(apiKey.id, apiKey);

    // Create sample cards
    const cards: Card[] = [
      {
        id: 'card-1',
        userId: defaultUser.id,
        cardNumber: '4532123456781234',
        maskedNumber: '**** **** **** 4532',
        expiryDate: '12/25',
        cvv: '123',
        cardType: 'virtual',
        status: 'active',
        balance: '2450.00',
        spendingLimit: '5000.00',
        currency: 'USDT',
        strowalletCardId: null,
        billingAddress: null,
        billingCity: null,
        billingState: null,
        billingZip: null,
        billingCountry: null,
        nameOnCard: null,
        approvedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'card-2',
        userId: defaultUser.id,
        cardNumber: '4532987654327891',
        maskedNumber: '**** **** **** 7891',
        expiryDate: '08/26',
        cvv: '456',
        cardType: 'physical',
        status: 'frozen',
        balance: '875.50',
        spendingLimit: '1500.00',
        currency: 'USDT',
        strowalletCardId: null,
        billingAddress: null,
        billingCity: null,
        billingState: null,
        billingZip: null,
        billingCountry: null,
        nameOnCard: null,
        approvedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'card-3',
        userId: defaultUser.id,
        cardNumber: '4532111122222468',
        maskedNumber: '**** **** **** 2468',
        expiryDate: '03/27',
        cvv: '789',
        cardType: 'physical',
        status: 'active',
        balance: '15230.75',
        spendingLimit: '25000.00',
        currency: 'USDT',
        strowalletCardId: null,
        billingAddress: null,
        billingCity: null,
        billingState: null,
        billingZip: null,
        billingCountry: null,
        nameOnCard: null,
        approvedAt: new Date(),
        createdAt: new Date(),
      },
    ];

    cards.forEach(card => this.cards.set(card.id, card));

    // Create sample transactions
    const transactions: Transaction[] = [
      {
        id: 'txn-1',
        cardId: 'card-1',
        merchant: 'Amazon Web Services',
        amount: '-89.50',
        currency: 'USDT',
        strowalletTransactionId: null,
        status: 'completed',
        type: 'debit',
        description: 'Monthly AWS hosting',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 'txn-2',
        cardId: 'card-2',
        merchant: 'Office Supplies Inc',
        amount: '-156.78',
        currency: 'USDT',
        strowalletTransactionId: null,
        status: 'completed',
        type: 'debit',
        description: 'Office supplies purchase',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: 'txn-3',
        cardId: 'card-3',
        merchant: 'Business Travel',
        amount: '-445.20',
        currency: 'USDT',
        strowalletTransactionId: null,
        status: 'completed',
        type: 'debit',
        description: 'Flight booking',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'txn-4',
        cardId: 'card-1',
        merchant: 'Software License',
        amount: '-299.00',
        currency: 'USDT',
        strowalletTransactionId: null,
        status: 'completed',
        type: 'debit',
        description: 'Annual software license',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ];

    transactions.forEach(txn => this.transactions.set(txn.id, txn));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      phone: insertUser.phone || null,
      role: insertUser.role || 'user',
      kycStatus: insertUser.kycStatus || 'pending',
      kycDocuments: insertUser.kycDocuments || null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
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
    const id = randomUUID();
    const maskedNumber = `**** **** **** ${insertCard.cardNumber.slice(-4)}`;
    const finalCard: Card = { 
      ...insertCard,
      id,
      cardNumber: insertCard.cardNumber,
      cvv: insertCard.cvv,
      expiryDate: insertCard.expiryDate || null,
      maskedNumber,
      balance: '0.00',
      currency: insertCard.currency || 'USDT',
      status: insertCard.status || 'pending',
      cardType: insertCard.cardType || 'virtual',
      strowalletCardId: null,
      billingAddress: insertCard.billingAddress || null,
      billingCity: insertCard.billingCity || null,
      billingState: insertCard.billingState || null,
      billingZip: insertCard.billingZip || null,
      billingCountry: insertCard.billingCountry || null,
      nameOnCard: insertCard.nameOnCard || null,
      approvedAt: insertCard.approvedAt || null,
      createdAt: new Date()
    };
    this.cards.set(id, finalCard);
    return finalCard;
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
    return Array.from(this.transactions.values())
      .filter(txn => txn.cardId === cardId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const userCards = await this.getCardsByUserId(userId);
    const cardIds = userCards.map(card => card.id);
    return Array.from(this.transactions.values())
      .filter(txn => cardIds.includes(txn.cardId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      currency: insertTransaction.currency || 'USDT',
      status: insertTransaction.status || 'completed',
      description: insertTransaction.description || null,
      strowalletTransactionId: null,
      createdAt: new Date() 
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  // API Key methods
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = randomUUID();
    const apiKey: ApiKey = { 
      ...insertApiKey, 
      id,
      isTestMode: insertApiKey.isTestMode ?? true,
      createdAt: new Date() 
    };
    this.apiKeys.set(id, apiKey);
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
    return Array.from(this.deposits.values())
      .filter(deposit => deposit.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return Array.from(this.deposits.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const id = randomUUID();
    const deposit: Deposit = { 
      ...insertDeposit, 
      id,
      currency: insertDeposit.currency || 'ETB',
      status: insertDeposit.status || 'pending',
      transactionReference: insertDeposit.transactionReference || null,
      adminNotes: insertDeposit.adminNotes || null,
      createdAt: new Date(),
      processedBy: null,
      processedAt: null 
    };
    this.deposits.set(id, deposit);
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
    return Array.from(this.kycDocuments.values())
      .filter(doc => doc.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocuments.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createKycDocument(insertDocument: InsertKycDocument): Promise<KycDocument> {
    const id = randomUUID();
    const document: KycDocument = { 
      ...insertDocument, 
      id,
      status: insertDocument.status || 'pending',
      reviewNotes: insertDocument.reviewNotes || null,
      createdAt: new Date(),
      reviewedBy: null,
      reviewedAt: null 
    };
    this.kycDocuments.set(id, document);
    return document;
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const document = this.kycDocuments.get(id);
    if (!document) return undefined;
    const updatedDocument = { ...document, ...updates };
    this.kycDocuments.set(id, updatedDocument);
    return updatedDocument;
  }
}

export const storage = new MemStorage();
