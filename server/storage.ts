import {
  UserModel,
  CardModel,
  TransactionModel,
  ApiKeyModel,
  DepositModel,
  KycDocumentModel,
  type UserPlain,
  type CardPlain,
  type TransactionPlain,
  type ApiKeyPlain,
  type DepositPlain,
  type KycDocumentPlain,
  type InsertUser,
  type InsertCard,
  type InsertTransaction,
  type InsertApiKey,
  type InsertDeposit,
  type InsertKycDocument,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for MongoDB
export interface IStorage {
  // User methods
  createUser(insertUser: InsertUser): Promise<UserPlain>;
  getUserByEmail(email: string): Promise<UserPlain | undefined>;
  getUserByUsername(username: string): Promise<UserPlain | undefined>;
  getUserById(id: string): Promise<UserPlain | undefined>;
  getUser(id: string): Promise<UserPlain | undefined>; // Alias for getUserById
  updateUser(id: string, updates: Partial<UserPlain>): Promise<UserPlain | undefined>;
  deleteUser(id: string): Promise<boolean>;
  deleteUserByUsername(username: string): Promise<boolean>;

  // Card methods
  createCard(insertCard: InsertCard): Promise<CardPlain>;
  getCardsByUserId(userId: string): Promise<CardPlain[]>;
  getCardById(id: string): Promise<CardPlain | undefined>;
  getCard(id: string): Promise<CardPlain | undefined>; // Alias for getCardById
  updateCard(id: string, updates: Partial<CardPlain>): Promise<CardPlain | undefined>;
  deleteCard(id: string): Promise<boolean>;

  // Transaction methods
  createTransaction(insertTransaction: InsertTransaction): Promise<TransactionPlain>;
  getTransactionsByUserId(userId: string): Promise<TransactionPlain[]>;
  getTransactionsByCardId(cardId: string): Promise<TransactionPlain[]>;
  getTransactionById(id: string): Promise<TransactionPlain | undefined>;
  
  // API Key methods
  createApiKey(insertApiKey: InsertApiKey): Promise<ApiKeyPlain>;
  getApiKeysByUserId(userId: string): Promise<ApiKeyPlain[]>;
  updateApiKey(id: string, updates: Partial<ApiKeyPlain>): Promise<ApiKeyPlain | undefined>;
  deleteApiKey(id: string): Promise<boolean>;

  // Deposit methods
  createDeposit(insertDeposit: InsertDeposit): Promise<DepositPlain>;
  getDepositsByUserId(userId: string): Promise<DepositPlain[]>;
  getAllDeposits(): Promise<DepositPlain[]>;
  updateDeposit(id: string, updates: Partial<DepositPlain>): Promise<DepositPlain | undefined>;

  // KYC Document methods
  createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocumentPlain>;
  getKycDocumentsByUserId(userId: string): Promise<KycDocumentPlain[]>;
  getAllKycDocuments(): Promise<KycDocumentPlain[]>;
  updateKycDocument(id: string, updates: Partial<KycDocumentPlain>): Promise<KycDocumentPlain | undefined>;
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  // Helper method to convert MongoDB document to plain object
  private toPlain<T>(doc: any): T {
    if (!doc) return doc;
    const plain = doc.toObject ? doc.toObject() : doc;
    if (plain._id) {
      plain.id = plain._id.toString();
      delete plain._id;
      delete plain.__v;
    }
    return plain;
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<UserPlain> {
    const user = new UserModel(insertUser);
    const savedUser = await user.save();
    return this.toPlain<UserPlain>(savedUser);
  }

  async getUserByEmail(email: string): Promise<UserPlain | undefined> {
    const user = await UserModel.findOne({ email });
    return user ? this.toPlain<UserPlain>(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<UserPlain | undefined> {
    const user = await UserModel.findOne({ username });
    return user ? this.toPlain<UserPlain>(user) : undefined;
  }

  async getUserById(id: string): Promise<UserPlain | undefined> {
    const user = await UserModel.findById(id);
    return user ? this.toPlain<UserPlain>(user) : undefined;
  }

  async getUser(id: string): Promise<UserPlain | undefined> {
    return this.getUserById(id);
  }

  async updateUser(id: string, updates: Partial<UserPlain>): Promise<UserPlain | undefined> {
    const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
    return user ? this.toPlain<UserPlain>(user) : undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async deleteUserByUsername(username: string): Promise<boolean> {
    const result = await UserModel.findOneAndDelete({ username });
    return !!result;
  }

  // Card methods
  async createCard(insertCard: InsertCard): Promise<CardPlain> {
    const card = new CardModel(insertCard);
    const savedCard = await card.save();
    return this.toPlain<CardPlain>(savedCard);
  }

  async getCardsByUserId(userId: string): Promise<CardPlain[]> {
    const cards = await CardModel.find({ userId });
    return cards.map(card => this.toPlain<CardPlain>(card));
  }

  async getCardById(id: string): Promise<CardPlain | undefined> {
    const card = await CardModel.findById(id);
    return card ? this.toPlain<CardPlain>(card) : undefined;
  }

  async getCard(id: string): Promise<CardPlain | undefined> {
    return this.getCardById(id);
  }

  async updateCard(id: string, updates: Partial<CardPlain>): Promise<CardPlain | undefined> {
    const card = await CardModel.findByIdAndUpdate(id, updates, { new: true });
    return card ? this.toPlain<CardPlain>(card) : undefined;
  }

  async deleteCard(id: string): Promise<boolean> {
    const result = await CardModel.findByIdAndDelete(id);
    return !!result;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<TransactionPlain> {
    const transaction = new TransactionModel(insertTransaction);
    const savedTransaction = await transaction.save();
    return this.toPlain<TransactionPlain>(savedTransaction);
  }

  async getTransactionsByUserId(userId: string): Promise<TransactionPlain[]> {
    // Get user's cards first, then get transactions for those cards
    const cards = await CardModel.find({ userId });
    const cardIds = cards.map(card => card._id.toString());
    const transactions = await TransactionModel.find({ cardId: { $in: cardIds } });
    return transactions.map(tx => this.toPlain<TransactionPlain>(tx));
  }

  async getTransactionById(id: string): Promise<TransactionPlain | undefined> {
    const transaction = await TransactionModel.findById(id);
    return transaction ? this.toPlain<TransactionPlain>(transaction) : undefined;
  }

  async getTransactionsByCardId(cardId: string): Promise<TransactionPlain[]> {
    const transactions = await TransactionModel.find({ cardId });
    return transactions.map(tx => this.toPlain<TransactionPlain>(tx));
  }

  // API Key methods
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKeyPlain> {
    const apiKeyData = {
      ...insertApiKey,
      key: `ak_${randomUUID().replace(/-/g, '')}`,
    };
    const apiKey = new ApiKeyModel(apiKeyData);
    const savedApiKey = await apiKey.save();
    return this.toPlain<ApiKeyPlain>(savedApiKey);
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKeyPlain[]> {
    const apiKeys = await ApiKeyModel.find({ userId });
    return apiKeys.map(key => this.toPlain<ApiKeyPlain>(key));
  }

  async updateApiKey(id: string, updates: Partial<ApiKeyPlain>): Promise<ApiKeyPlain | undefined> {
    const apiKey = await ApiKeyModel.findByIdAndUpdate(id, updates, { new: true });
    return apiKey ? this.toPlain<ApiKeyPlain>(apiKey) : undefined;
  }

  async deleteApiKey(id: string): Promise<boolean> {
    const result = await ApiKeyModel.findByIdAndDelete(id);
    return !!result;
  }

  // Deposit methods
  async createDeposit(insertDeposit: InsertDeposit): Promise<DepositPlain> {
    const deposit = new DepositModel(insertDeposit);
    const savedDeposit = await deposit.save();
    return this.toPlain<DepositPlain>(savedDeposit);
  }

  async getDepositsByUserId(userId: string): Promise<DepositPlain[]> {
    const deposits = await DepositModel.find({ userId });
    return deposits.map(deposit => this.toPlain<DepositPlain>(deposit));
  }

  async getAllDeposits(): Promise<DepositPlain[]> {
    const deposits = await DepositModel.find();
    return deposits.map(deposit => this.toPlain<DepositPlain>(deposit));
  }

  async updateDeposit(id: string, updates: Partial<DepositPlain>): Promise<DepositPlain | undefined> {
    const deposit = await DepositModel.findByIdAndUpdate(id, updates, { new: true });
    return deposit ? this.toPlain<DepositPlain>(deposit) : undefined;
  }

  // KYC Document methods
  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocumentPlain> {
    const kycDocument = new KycDocumentModel(insertKycDocument);
    const savedDocument = await kycDocument.save();
    return this.toPlain<KycDocumentPlain>(savedDocument);
  }

  async getKycDocumentsByUserId(userId: string): Promise<KycDocumentPlain[]> {
    const documents = await KycDocumentModel.find({ userId });
    return documents.map(doc => this.toPlain<KycDocumentPlain>(doc));
  }

  async getAllKycDocuments(): Promise<KycDocumentPlain[]> {
    const documents = await KycDocumentModel.find();
    return documents.map(doc => this.toPlain<KycDocumentPlain>(doc));
  }

  async updateKycDocument(id: string, updates: Partial<KycDocumentPlain>): Promise<KycDocumentPlain | undefined> {
    const document = await KycDocumentModel.findByIdAndUpdate(id, updates, { new: true });
    return document ? this.toPlain<KycDocumentPlain>(document) : undefined;
  }
}

// Export a singleton instance
export const storage = new MongoStorage();