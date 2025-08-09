import { 
  type User, type InsertUser, 
  type Card, type InsertCard, 
  type Transaction, type InsertTransaction, 
  type ApiKey, type InsertApiKey,
  type Deposit, type InsertDeposit,
  type KycDocument, type InsertKycDocument,
  users, cards, transactions, apiKeys, deposits, kycDocuments
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Card methods
  async getCard(id: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async getCardsByUserId(userId: string): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.userId, userId));
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const maskedNumber = `**** **** **** ${insertCard.cardNumber.slice(-4)}`;
    const { cardNumber, cvv, ...cardData } = insertCard;
    
    const [card] = await db
      .insert(cards)
      .values({ 
        ...cardData, 
        maskedNumber,
        balance: '0.00'
      })
      .returning();
    return card;
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined> {
    const [card] = await db
      .update(cards)
      .set(updates)
      .where(eq(cards.id, id))
      .returning();
    return card || undefined;
  }

  async deleteCard(id: string): Promise<boolean> {
    const result = await db.delete(cards).where(eq(cards.id, id));
    return result.rowCount > 0;
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByCardId(cardId: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.cardId, cardId));
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const userCards = await this.getCardsByUserId(userId);
    const cardIds = userCards.map(card => card.id);
    
    if (cardIds.length === 0) return [];
    
    return await db.select().from(transactions);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  // API Key methods
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const [apiKey] = await db
      .insert(apiKeys)
      .values(insertApiKey)
      .returning();
    return apiKey;
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const [apiKey] = await db
      .update(apiKeys)
      .set(updates)
      .where(eq(apiKeys.id, id))
      .returning();
    return apiKey || undefined;
  }

  // Deposit methods
  async getDeposit(id: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit || undefined;
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.userId, userId));
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return await db.select().from(deposits);
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const [deposit] = await db
      .insert(deposits)
      .values(insertDeposit)
      .returning();
    return deposit;
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const [deposit] = await db
      .update(deposits)
      .set(updates)
      .where(eq(deposits.id, id))
      .returning();
    return deposit || undefined;
  }

  // KYC methods
  async getKycDocumentsByUserId(userId: string): Promise<KycDocument[]> {
    return await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return await db.select().from(kycDocuments);
  }

  async createKycDocument(insertDocument: InsertKycDocument): Promise<KycDocument> {
    const [document] = await db
      .insert(kycDocuments)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const [document] = await db
      .update(kycDocuments)
      .set(updates)
      .where(eq(kycDocuments.id, id))
      .returning();
    return document || undefined;
  }
}

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
        name: 'Business Virtual Card',
        type: 'virtual',
        status: 'active',
        maskedNumber: '**** **** **** 4532',
        balance: '2450.00',
        limit: '5000.00',
        currency: 'USDT',
        strowalletCardId: null,
        expiryMonth: 12,
        expiryYear: 2025,
        createdAt: new Date(),
      },
      {
        id: 'card-2',
        userId: defaultUser.id,
        name: 'Employee Expense Card',
        type: 'physical',
        status: 'frozen',
        maskedNumber: '**** **** **** 7891',
        balance: '875.50',
        limit: '1500.00',
        currency: 'USDT',
        strowalletCardId: null,
        expiryMonth: 8,
        expiryYear: 2026,
        createdAt: new Date(),
      },
      {
        id: 'card-3',
        userId: defaultUser.id,
        name: 'Premium Corporate Card',
        type: 'physical',
        status: 'active',
        maskedNumber: '**** **** **** 2468',
        balance: '15230.75',
        limit: '25000.00',
        currency: 'USDT',
        strowalletCardId: null,
        expiryMonth: 3,
        expiryYear: 2027,
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
      role: insertUser.role || 'user',
      kycStatus: insertUser.kycStatus || 'pending',
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
    const card: Card = { 
      ...insertCard, 
      id, 
      maskedNumber,
      balance: '0.00',
      createdAt: new Date() 
    };
    // Remove cardNumber and cvv from stored data for security
    const { cardNumber, cvv, ...cardData } = insertCard;
    const finalCard: Card = { ...cardData, id, maskedNumber, balance: '0.00', createdAt: new Date() };
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
    const transaction: Transaction = { ...insertTransaction, id, createdAt: new Date() };
    this.transactions.set(id, transaction);
    return transaction;
  }

  // API Key methods
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter(key => key.userId === userId);
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = randomUUID();
    const apiKey: ApiKey = { ...insertApiKey, id, createdAt: new Date() };
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

export const storage = new DatabaseStorage();
