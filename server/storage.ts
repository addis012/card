import { type User, type InsertUser, type Card, type InsertCard, type Transaction, type InsertTransaction, type ApiKey, type InsertApiKey } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cards: Map<string, Card> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();

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
        currency: 'USD',
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
        currency: 'USD',
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
        currency: 'USD',
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
        currency: 'USD',
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
        currency: 'USD',
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
        currency: 'USD',
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
        currency: 'USD',
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
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
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
}

export const storage = new MemStorage();
