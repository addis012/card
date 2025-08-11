import { 
  User, Deposit, KYCDocument, Card, Transaction, APIKey,
  type IUser, type IDeposit, type IKYCDocument, type ICard, 
  type ITransaction, type IAPIKey,
  type InsertUser, type InsertDeposit, type InsertKYCDocument, 
  type InsertCard, type InsertTransaction, type InsertAPIKey,
  type SelectUser, type SelectDeposit, type SelectKYCDocument, 
  type SelectCard, type SelectTransaction, type SelectAPIKey
} from '@shared/mongodb-schema';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<SelectUser>;
  getUserById(id: string): Promise<SelectUser | null>;
  getUserByEmail(email: string): Promise<SelectUser | null>;
  getUserByUsername(username: string): Promise<SelectUser | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser | null>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<SelectUser[]>;

  // Deposit operations
  createDeposit(deposit: InsertDeposit): Promise<SelectDeposit>;
  getDepositById(id: string): Promise<SelectDeposit | null>;
  getDepositsByUserId(userId: string): Promise<SelectDeposit[]>;
  updateDeposit(id: string, updates: Partial<InsertDeposit>): Promise<SelectDeposit | null>;
  getAllDeposits(): Promise<SelectDeposit[]>;
  getPendingDeposits(): Promise<SelectDeposit[]>;

  // KYC Document operations
  createKYCDocument(document: InsertKYCDocument): Promise<SelectKYCDocument>;
  getKYCDocumentById(id: string): Promise<SelectKYCDocument | null>;
  getKYCDocumentsByUserId(userId: string): Promise<SelectKYCDocument[]>;
  updateKYCDocument(id: string, updates: Partial<InsertKYCDocument>): Promise<SelectKYCDocument | null>;
  deleteKYCDocument(id: string): Promise<boolean>;
  getAllKYCDocuments(): Promise<SelectKYCDocument[]>;
  getPendingKYCDocuments(): Promise<SelectKYCDocument[]>;

  // Card operations
  createCard(card: InsertCard): Promise<SelectCard>;
  getCardById(id: string): Promise<SelectCard | null>;
  getCardsByUserId(userId: string): Promise<SelectCard[]>;
  updateCard(id: string, updates: Partial<InsertCard>): Promise<SelectCard | null>;
  deleteCard(id: string): Promise<boolean>;
  getAllCards(): Promise<SelectCard[]>;
  getPendingCards(): Promise<SelectCard[]>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<SelectTransaction>;
  getTransactionById(id: string): Promise<SelectTransaction | null>;
  getTransactionsByCardId(cardId: string): Promise<SelectTransaction[]>;
  updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<SelectTransaction | null>;
  deleteTransaction(id: string): Promise<boolean>;
  getAllTransactions(): Promise<SelectTransaction[]>;

  // API Key operations
  createAPIKey(apiKey: InsertAPIKey): Promise<SelectAPIKey>;
  getAPIKeyById(id: string): Promise<SelectAPIKey | null>;
  getAPIKeysByUserId(userId: string): Promise<SelectAPIKey[]>;
  getAPIKeyByKey(key: string): Promise<SelectAPIKey | null>;
  updateAPIKey(id: string, updates: Partial<InsertAPIKey>): Promise<SelectAPIKey | null>;
  deleteAPIKey(id: string): Promise<boolean>;
  getAllAPIKeys(): Promise<SelectAPIKey[]>;
}

export class MongoStorage implements IStorage {
  // User operations
  async createUser(userData: InsertUser): Promise<SelectUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = new User({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    return savedUser.toObject();
  }

  async getUserById(id: string): Promise<SelectUser | null> {
    const user = await User.findById(id);
    return user ? user.toObject() : null;
  }

  async getUserByEmail(email: string): Promise<SelectUser | null> {
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  }

  async getUserByUsername(username: string): Promise<SelectUser | null> {
    const user = await User.findOne({ username });
    return user ? user.toObject() : null;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser | null> {
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 12);
    }
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    return user ? user.toObject() : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllUsers(): Promise<SelectUser[]> {
    const users = await User.find();
    return users.map(user => user.toObject());
  }

  // Deposit operations
  async createDeposit(depositData: InsertDeposit): Promise<SelectDeposit> {
    const deposit = new Deposit(depositData);
    const savedDeposit = await deposit.save();
    return savedDeposit.toObject();
  }

  async getDepositById(id: string): Promise<SelectDeposit | null> {
    const deposit = await Deposit.findById(id);
    return deposit ? deposit.toObject() : null;
  }

  async getDepositsByUserId(userId: string): Promise<SelectDeposit[]> {
    const deposits = await Deposit.find({ userId }).sort({ createdAt: -1 });
    return deposits.map(deposit => deposit.toObject());
  }

  async updateDeposit(id: string, updates: Partial<InsertDeposit>): Promise<SelectDeposit | null> {
    const deposit = await Deposit.findByIdAndUpdate(id, updates, { new: true });
    return deposit ? deposit.toObject() : null;
  }

  async getAllDeposits(): Promise<SelectDeposit[]> {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    return deposits.map(deposit => deposit.toObject());
  }

  async getPendingDeposits(): Promise<SelectDeposit[]> {
    const deposits = await Deposit.find({ status: 'pending' }).sort({ createdAt: -1 });
    return deposits.map(deposit => deposit.toObject());
  }

  // KYC Document operations
  async createKYCDocument(documentData: InsertKYCDocument): Promise<SelectKYCDocument> {
    const document = new KYCDocument(documentData);
    const savedDocument = await document.save();
    return savedDocument.toObject();
  }

  async getKYCDocumentById(id: string): Promise<SelectKYCDocument | null> {
    const document = await KYCDocument.findById(id);
    return document ? document.toObject() : null;
  }

  async getKYCDocumentsByUserId(userId: string): Promise<SelectKYCDocument[]> {
    const documents = await KYCDocument.find({ userId }).sort({ createdAt: -1 });
    return documents.map(doc => doc.toObject());
  }

  async updateKYCDocument(id: string, updates: Partial<InsertKYCDocument>): Promise<SelectKYCDocument | null> {
    const document = await KYCDocument.findByIdAndUpdate(id, updates, { new: true });
    return document ? document.toObject() : null;
  }

  async deleteKYCDocument(id: string): Promise<boolean> {
    const result = await KYCDocument.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllKYCDocuments(): Promise<SelectKYCDocument[]> {
    const documents = await KYCDocument.find().sort({ createdAt: -1 });
    return documents.map(doc => doc.toObject());
  }

  async getPendingKYCDocuments(): Promise<SelectKYCDocument[]> {
    const documents = await KYCDocument.find({ status: 'pending' }).sort({ createdAt: -1 });
    return documents.map(doc => doc.toObject());
  }

  // Card operations
  async createCard(cardData: InsertCard): Promise<SelectCard> {
    const card = new Card(cardData);
    const savedCard = await card.save();
    return savedCard.toObject();
  }

  async getCardById(id: string): Promise<SelectCard | null> {
    const card = await Card.findById(id);
    return card ? card.toObject() : null;
  }

  async getCardsByUserId(userId: string): Promise<SelectCard[]> {
    const cards = await Card.find({ userId }).sort({ createdAt: -1 });
    return cards.map(card => card.toObject());
  }

  async updateCard(id: string, updates: Partial<InsertCard>): Promise<SelectCard | null> {
    const card = await Card.findByIdAndUpdate(id, updates, { new: true });
    return card ? card.toObject() : null;
  }

  async deleteCard(id: string): Promise<boolean> {
    const result = await Card.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllCards(): Promise<SelectCard[]> {
    const cards = await Card.find().sort({ createdAt: -1 });
    return cards.map(card => card.toObject());
  }

  async getPendingCards(): Promise<SelectCard[]> {
    const cards = await Card.find({ status: 'pending' }).sort({ createdAt: -1 });
    return cards.map(card => card.toObject());
  }

  // Transaction operations
  async createTransaction(transactionData: InsertTransaction): Promise<SelectTransaction> {
    const transaction = new Transaction(transactionData);
    const savedTransaction = await transaction.save();
    return savedTransaction.toObject();
  }

  async getTransactionById(id: string): Promise<SelectTransaction | null> {
    const transaction = await Transaction.findById(id);
    return transaction ? transaction.toObject() : null;
  }

  async getTransactionsByCardId(cardId: string): Promise<SelectTransaction[]> {
    const transactions = await Transaction.find({ cardId }).sort({ createdAt: -1 });
    return transactions.map(transaction => transaction.toObject());
  }

  async updateTransaction(id: string, updates: Partial<InsertTransaction>): Promise<SelectTransaction | null> {
    const transaction = await Transaction.findByIdAndUpdate(id, updates, { new: true });
    return transaction ? transaction.toObject() : null;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await Transaction.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllTransactions(): Promise<SelectTransaction[]> {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    return transactions.map(transaction => transaction.toObject());
  }

  // API Key operations
  async createAPIKey(apiKeyData: InsertAPIKey): Promise<SelectAPIKey> {
    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = new APIKey({
      ...apiKeyData,
      key,
    });
    const savedAPIKey = await apiKey.save();
    return savedAPIKey.toObject();
  }

  async getAPIKeyById(id: string): Promise<SelectAPIKey | null> {
    const apiKey = await APIKey.findById(id);
    return apiKey ? apiKey.toObject() : null;
  }

  async getAPIKeysByUserId(userId: string): Promise<SelectAPIKey[]> {
    const apiKeys = await APIKey.find({ userId }).sort({ createdAt: -1 });
    return apiKeys.map(apiKey => apiKey.toObject());
  }

  async getAPIKeyByKey(key: string): Promise<SelectAPIKey | null> {
    const apiKey = await APIKey.findOne({ key });
    return apiKey ? apiKey.toObject() : null;
  }

  async updateAPIKey(id: string, updates: Partial<InsertAPIKey>): Promise<SelectAPIKey | null> {
    const apiKey = await APIKey.findByIdAndUpdate(id, updates, { new: true });
    return apiKey ? apiKey.toObject() : null;
  }

  async deleteAPIKey(id: string): Promise<boolean> {
    const result = await APIKey.findByIdAndDelete(id);
    return result !== null;
  }

  async getAllAPIKeys(): Promise<SelectAPIKey[]> {
    const apiKeys = await APIKey.find().sort({ createdAt: -1 });
    return apiKeys.map(apiKey => apiKey.toObject());
  }
}