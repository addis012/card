import mongoose from 'mongoose';
import type {
  User,
  Card,
  Transaction,
  ApiKey,
  Deposit,
  KycDocument,
  InsertUser,
  InsertCard,
  InsertTransaction,
  InsertApiKey,
  InsertDeposit,
  InsertKycDocument,
} from "@shared/schema";
import { IStorage, MemStorage } from "./storage";
import { randomUUID } from "crypto";

// MongoDB Models (import from existing schema)
import { 
  User as UserModel,
  Deposit as DepositModel,
  IKYCDocument,
} from "../shared/mongodb-schema";

// Create MongoDB models for missing entities
const cardSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  cardNumber: { type: String },
  maskedNumber: { type: String },
  expiryDate: { type: String },
  cvv: { type: String },
  cardType: { type: String, enum: ['virtual', 'physical'], default: 'virtual' },
  status: { type: String, enum: ['pending', 'active', 'frozen', 'cancelled'], default: 'pending' },
  balance: { type: String, default: '0.00' },
  spendingLimit: { type: String, default: '1000.00' },
  currency: { type: String, default: 'USDT' },
  strowalletCardId: { type: String },
  billingAddress: { type: String },
  billingCity: { type: String },
  billingState: { type: String },
  billingZip: { type: String },
  billingCountry: { type: String },
  nameOnCard: { type: String },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
  cardId: { type: String, required: true },
  merchant: { type: String, required: true },
  amount: { type: String, required: true },
  currency: { type: String, default: 'USDT' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  type: { type: String, enum: ['purchase', 'withdrawal', 'refund', 'fee', 'deposit'], required: true },
  description: { type: String },
  transactionReference: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const apiKeySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  permissions: { type: [String], default: [] },
  lastUsed: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const kycDocumentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  documentType: { type: String, enum: ['passport', 'id_card', 'driving_license', 'selfie'], required: true },
  documentUrl: { type: String },
  fileName: { type: String, required: true },
  fileData: { type: String, required: true },
  contentType: { type: String, required: true },
  fileSize: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: String },
  reviewNotes: { type: String },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Create models if they don't exist
const CardModel = mongoose.models.Card || mongoose.model('Card', cardSchema);
const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
const ApiKeyModel = mongoose.models.ApiKey || mongoose.model('ApiKey', apiKeySchema);
const KycDocumentModel = mongoose.models.KycDocument || mongoose.model('KycDocument', kycDocumentSchema);

export class HybridStorage implements IStorage {
  private memStorage: MemStorage;
  private useMongoDb: boolean;

  constructor() {
    this.memStorage = new MemStorage();
    this.useMongoDb = mongoose.connection.readyState === 1; // Connected
    
    // Listen for MongoDB connection changes
    mongoose.connection.on('connected', () => {
      this.useMongoDb = true;
      console.log('Switched to MongoDB storage');
    });
    
    mongoose.connection.on('disconnected', () => {
      this.useMongoDb = false;
      console.log('Switched to in-memory storage');
    });
  }

  private convertMongoDoc<T>(doc: any): T {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : doc;
    if (obj._id) {
      obj.id = obj._id.toString();
      delete obj._id;
      delete obj.__v;
    }
    return obj;
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.useMongoDb) {
      return this.memStorage.createUser(insertUser);
    }

    try {
      const userDoc = new UserModel(insertUser);
      const savedUser = await userDoc.save();
      return this.convertMongoDoc<User>(savedUser);
    } catch (error) {
      console.error('MongoDB error, falling back to memory storage:', error);
      return this.memStorage.createUser(insertUser);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.getUserByEmail(email);
    }

    try {
      const user = await UserModel.findOne({ email });
      return user ? this.convertMongoDoc<User>(user) : undefined;
    } catch (error) {
      return this.memStorage.getUserByEmail(email);
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.getUserByUsername(username);
    }

    try {
      const user = await UserModel.findOne({ username });
      return user ? this.convertMongoDoc<User>(user) : undefined;
    } catch (error) {
      return this.memStorage.getUserByUsername(username);
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.getUserById(id);
    }

    try {
      const user = await UserModel.findById(id);
      return user ? this.convertMongoDoc<User>(user) : undefined;
    } catch (error) {
      return this.memStorage.getUserById(id);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.updateUser(id, updates);
    }

    try {
      const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
      return user ? this.convertMongoDoc<User>(user) : undefined;
    } catch (error) {
      return this.memStorage.updateUser(id, updates);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.useMongoDb) {
      return this.memStorage.deleteUser(id);
    }

    try {
      const result = await UserModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      return this.memStorage.deleteUser(id);
    }
  }

  async deleteUserByUsername(username: string): Promise<boolean> {
    if (!this.useMongoDb) {
      return this.memStorage.deleteUserByUsername(username);
    }

    try {
      const result = await UserModel.findOneAndDelete({ username });
      return !!result;
    } catch (error) {
      return this.memStorage.deleteUserByUsername(username);
    }
  }

  // Card methods
  async createCard(insertCard: InsertCard): Promise<Card> {
    if (!this.useMongoDb) {
      return this.memStorage.createCard(insertCard);
    }

    try {
      const cardDoc = new CardModel(insertCard);
      const savedCard = await cardDoc.save();
      return this.convertMongoDoc<Card>(savedCard);
    } catch (error) {
      return this.memStorage.createCard(insertCard);
    }
  }

  async getCardsByUserId(userId: string): Promise<Card[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getCardsByUserId(userId);
    }

    try {
      const cards = await CardModel.find({ userId });
      return cards.map(card => this.convertMongoDoc<Card>(card));
    } catch (error) {
      return this.memStorage.getCardsByUserId(userId);
    }
  }

  async getAllCards(): Promise<Card[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getAllCards();
    }

    try {
      const cards = await CardModel.find({});
      return cards.map(card => this.convertMongoDoc<Card>(card));
    } catch (error) {
      return this.memStorage.getAllCards();
    }
  }

  async getCardById(id: string): Promise<Card | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.getCardById(id);
    }

    try {
      const card = await CardModel.findById(id);
      return card ? this.convertMongoDoc<Card>(card) : undefined;
    } catch (error) {
      return this.memStorage.getCardById(id);
    }
  }

  async getCard(id: string): Promise<Card | undefined> {
    return this.getCardById(id);
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.updateCard(id, updates);
    }

    try {
      const card = await CardModel.findByIdAndUpdate(id, updates, { new: true });
      return card ? this.convertMongoDoc<Card>(card) : undefined;
    } catch (error) {
      return this.memStorage.updateCard(id, updates);
    }
  }

  async deleteCard(id: string): Promise<boolean> {
    if (!this.useMongoDb) {
      return this.memStorage.deleteCard(id);
    }

    try {
      const result = await CardModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      return this.memStorage.deleteCard(id);
    }
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    if (!this.useMongoDb) {
      return this.memStorage.createTransaction(insertTransaction);
    }

    try {
      const transactionDoc = new TransactionModel(insertTransaction);
      const savedTransaction = await transactionDoc.save();
      return this.convertMongoDoc<Transaction>(savedTransaction);
    } catch (error) {
      return this.memStorage.createTransaction(insertTransaction);
    }
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getTransactionsByUserId(userId);
    }

    try {
      const cards = await this.getCardsByUserId(userId);
      const cardIds = cards.map(card => card.id);
      const transactions = await TransactionModel.find({ cardId: { $in: cardIds } });
      return transactions.map(t => this.convertMongoDoc<Transaction>(t));
    } catch (error) {
      return this.memStorage.getTransactionsByUserId(userId);
    }
  }

  async getTransactionsByCardId(cardId: string): Promise<Transaction[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getTransactionsByCardId(cardId);
    }

    try {
      const transactions = await TransactionModel.find({ cardId });
      return transactions.map(t => this.convertMongoDoc<Transaction>(t));
    } catch (error) {
      return this.memStorage.getTransactionsByCardId(cardId);
    }
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.getTransactionById(id);
    }

    try {
      const transaction = await TransactionModel.findById(id);
      return transaction ? this.convertMongoDoc<Transaction>(transaction) : undefined;
    } catch (error) {
      return this.memStorage.getTransactionById(id);
    }
  }

  // API Key methods
  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    if (!this.useMongoDb) {
      return this.memStorage.createApiKey(insertApiKey);
    }

    try {
      const apiKeyData = {
        ...insertApiKey,
        key: randomUUID(),
      };
      const apiKeyDoc = new ApiKeyModel(apiKeyData);
      const savedApiKey = await apiKeyDoc.save();
      return this.convertMongoDoc<ApiKey>(savedApiKey);
    } catch (error) {
      return this.memStorage.createApiKey(insertApiKey);
    }
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getApiKeysByUserId(userId);
    }

    try {
      const apiKeys = await ApiKeyModel.find({ userId });
      return apiKeys.map(key => this.convertMongoDoc<ApiKey>(key));
    } catch (error) {
      return this.memStorage.getApiKeysByUserId(userId);
    }
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.updateApiKey(id, updates);
    }

    try {
      const apiKey = await ApiKeyModel.findByIdAndUpdate(id, updates, { new: true });
      return apiKey ? this.convertMongoDoc<ApiKey>(apiKey) : undefined;
    } catch (error) {
      return this.memStorage.updateApiKey(id, updates);
    }
  }

  async deleteApiKey(id: string): Promise<boolean> {
    if (!this.useMongoDb) {
      return this.memStorage.deleteApiKey(id);
    }

    try {
      const result = await ApiKeyModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      return this.memStorage.deleteApiKey(id);
    }
  }

  // Deposit methods
  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    if (!this.useMongoDb) {
      return this.memStorage.createDeposit(insertDeposit);
    }

    try {
      const depositDoc = new DepositModel(insertDeposit);
      const savedDeposit = await depositDoc.save();
      return this.convertMongoDoc<Deposit>(savedDeposit);
    } catch (error) {
      return this.memStorage.createDeposit(insertDeposit);
    }
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getDepositsByUserId(userId);
    }

    try {
      const deposits = await DepositModel.find({ userId });
      return deposits.map(d => this.convertMongoDoc<Deposit>(d));
    } catch (error) {
      return this.memStorage.getDepositsByUserId(userId);
    }
  }

  async getAllDeposits(): Promise<Deposit[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getAllDeposits();
    }

    try {
      const deposits = await DepositModel.find({});
      return deposits.map(d => this.convertMongoDoc<Deposit>(d));
    } catch (error) {
      return this.memStorage.getAllDeposits();
    }
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.updateDeposit(id, updates);
    }

    try {
      const deposit = await DepositModel.findByIdAndUpdate(id, updates, { new: true });
      return deposit ? this.convertMongoDoc<Deposit>(deposit) : undefined;
    } catch (error) {
      return this.memStorage.updateDeposit(id, updates);
    }
  }

  // KYC Document methods
  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument> {
    if (!this.useMongoDb) {
      return this.memStorage.createKycDocument(insertKycDocument);
    }

    try {
      const kycDoc = new KycDocumentModel(insertKycDocument);
      const savedKyc = await kycDoc.save();
      return this.convertMongoDoc<KycDocument>(savedKyc);
    } catch (error) {
      return this.memStorage.createKycDocument(insertKycDocument);
    }
  }

  async getKycDocumentsByUserId(userId: string): Promise<KycDocument[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getKycDocumentsByUserId(userId);
    }

    try {
      const docs = await KycDocumentModel.find({ userId });
      return docs.map(d => this.convertMongoDoc<KycDocument>(d));
    } catch (error) {
      return this.memStorage.getKycDocumentsByUserId(userId);
    }
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    if (!this.useMongoDb) {
      return this.memStorage.getAllKycDocuments();
    }

    try {
      const docs = await KycDocumentModel.find({});
      return docs.map(d => this.convertMongoDoc<KycDocument>(d));
    } catch (error) {
      return this.memStorage.getAllKycDocuments();
    }
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    if (!this.useMongoDb) {
      return this.memStorage.updateKycDocument(id, updates);
    }

    try {
      const doc = await KycDocumentModel.findByIdAndUpdate(id, updates, { new: true });
      return doc ? this.convertMongoDoc<KycDocument>(doc) : undefined;
    } catch (error) {
      return this.memStorage.updateKycDocument(id, updates);
    }
  }
}

// Export hybrid storage instance
export const storage = new HybridStorage();