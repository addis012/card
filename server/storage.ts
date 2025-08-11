import { 
  type User, type InsertUser, 
  type Card, type InsertCard, 
  type Transaction, type InsertTransaction, 
  type ApiKey, type InsertApiKey,
  type Deposit, type InsertDeposit,
  type KycDocument, type InsertKycDocument
} from "@shared/schema";
import { 
  User as UserModel, 
  Card as CardModel, 
  Transaction as TransactionModel, 
  APIKey as APIKeyModel, 
  Deposit as DepositModel, 
  KYCDocument as KYCDocumentModel,
  type IUser,
  type ICard,
  type ITransaction,
  type IAPIKey,
  type IDeposit,
  type IKYCDocument
} from "@shared/mongodb-schema";
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

// MongoDB Storage implementation
export class MongoStorage implements IStorage {
  
  // Helper function to convert MongoDB document to our interface types
  private documentToUser(doc: IUser): User {
    return {
      id: doc._id.toString(),
      username: doc.username,
      password: doc.password,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      phone: doc.phone || null,
      role: doc.role,
      kycStatus: doc.kycStatus,
      kycDocuments: doc.kycDocuments || null,
      createdAt: doc.createdAt
    };
  }

  private documentToCard(doc: ICard): Card {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      cardNumber: doc.cardNumber || null,
      maskedNumber: doc.maskedNumber || null,
      expiryDate: doc.expiryDate || null,
      cvv: doc.cvv || null,
      cardType: doc.cardType,
      status: doc.status,
      balance: doc.balance.toString(),
      spendingLimit: doc.spendingLimit.toString(),
      currency: doc.currency,
      strowalletCardId: doc.strowalletCardId || null,
      billingAddress: doc.billingAddress || null,
      billingCity: doc.billingCity || null,
      billingState: doc.billingState || null,
      billingZip: doc.billingZip || null,
      billingCountry: doc.billingCountry || null,
      nameOnCard: doc.nameOnCard || null,
      approvedAt: doc.approvedAt || null,
      createdAt: doc.createdAt
    };
  }

  private documentToTransaction(doc: ITransaction): Transaction {
    return {
      id: doc._id.toString(),
      cardId: doc.cardId,
      merchant: doc.merchant,
      amount: doc.amount.toString(),
      currency: doc.currency,
      status: doc.status,
      type: doc.type,
      description: doc.description || null,
      transactionReference: doc.transactionReference || null,
      createdAt: doc.createdAt
    };
  }

  private documentToApiKey(doc: IAPIKey): ApiKey {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      name: doc.name,
      key: doc.key,
      permissions: doc.permissions,
      lastUsed: doc.lastUsed || null,
      isActive: doc.isActive,
      createdAt: doc.createdAt
    };
  }

  private documentToDeposit(doc: IDeposit): Deposit {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      amount: doc.amount.toString(),
      currency: doc.currency,
      status: doc.status,
      paymentMethod: doc.paymentMethod,
      transactionReference: doc.transactionReference || null,
      adminNotes: doc.adminNotes || null,
      processedBy: doc.processedBy || null,
      processedAt: doc.processedAt || null,
      createdAt: doc.createdAt
    };
  }

  private documentToKycDocument(doc: IKYCDocument): KycDocument {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      documentType: doc.documentType,
      documentUrl: doc.documentUrl || null,
      fileName: doc.fileName,
      fileData: doc.fileData,
      contentType: doc.contentType,
      fileSize: doc.fileSize,
      status: doc.status,
      reviewedBy: doc.reviewedBy || null,
      reviewNotes: doc.reviewNotes || null,
      reviewedAt: doc.reviewedAt || null,
      createdAt: doc.createdAt
    };
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      return user ? this.documentToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return user ? this.documentToUser(user) : undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const user = new UserModel(insertUser);
      const savedUser = await user.save();
      return this.documentToUser(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      const user = await UserModel.findByIdAndUpdate(id, updates, { new: true });
      return user ? this.documentToUser(user) : undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Card methods
  async getCard(id: string): Promise<Card | undefined> {
    try {
      const card = await CardModel.findById(id);
      return card ? this.documentToCard(card) : undefined;
    } catch (error) {
      console.error('Error getting card:', error);
      return undefined;
    }
  }

  async getCardsByUserId(userId: string): Promise<Card[]> {
    try {
      const cards = await CardModel.find({ userId });
      return cards.map(card => this.documentToCard(card));
    } catch (error) {
      console.error('Error getting cards by user ID:', error);
      return [];
    }
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    try {
      const cardData = {
        ...insertCard,
        balance: parseFloat(insertCard.spendingLimit || "1000.00") // Convert to number for MongoDB
      };
      const card = new CardModel(cardData);
      const savedCard = await card.save();
      return this.documentToCard(savedCard);
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  async updateCard(id: string, updates: Partial<Card>): Promise<Card | undefined> {
    try {
      const updateData: any = { ...updates };
      if (updates.balance !== undefined) {
        updateData.balance = parseFloat(updates.balance);
      }
      if (updates.spendingLimit !== undefined) {
        updateData.spendingLimit = parseFloat(updates.spendingLimit);
      }
      
      const card = await CardModel.findByIdAndUpdate(id, updateData, { new: true });
      return card ? this.documentToCard(card) : undefined;
    } catch (error) {
      console.error('Error updating card:', error);
      return undefined;
    }
  }

  async deleteCard(id: string): Promise<boolean> {
    try {
      const result = await CardModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error('Error deleting card:', error);
      return false;
    }
  }

  // Transaction methods
  async getTransaction(id: string): Promise<Transaction | undefined> {
    try {
      const transaction = await TransactionModel.findById(id);
      return transaction ? this.documentToTransaction(transaction) : undefined;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return undefined;
    }
  }

  async getTransactionsByCardId(cardId: string): Promise<Transaction[]> {
    try {
      const transactions = await TransactionModel.find({ cardId }).sort({ createdAt: -1 });
      return transactions.map(tx => this.documentToTransaction(tx));
    } catch (error) {
      console.error('Error getting transactions by card ID:', error);
      return [];
    }
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    try {
      // First get all cards for this user
      const cards = await CardModel.find({ userId });
      const cardIds = cards.map(card => card._id.toString());
      
      // Then get all transactions for those cards
      const transactions = await TransactionModel.find({ cardId: { $in: cardIds } }).sort({ createdAt: -1 });
      return transactions.map(tx => this.documentToTransaction(tx));
    } catch (error) {
      console.error('Error getting transactions by user ID:', error);
      return [];
    }
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    try {
      const transactionData = {
        ...insertTransaction,
        amount: parseFloat(insertTransaction.amount) // Convert to number for MongoDB
      };
      const transaction = new TransactionModel(transactionData);
      const savedTransaction = await transaction.save();
      return this.documentToTransaction(savedTransaction);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // API Key methods
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    try {
      const apiKeys = await APIKeyModel.find({ userId });
      return apiKeys.map(key => this.documentToApiKey(key));
    } catch (error) {
      console.error('Error getting API keys by user ID:', error);
      return [];
    }
  }

  async createApiKey(insertApiKey: InsertApiKey): Promise<ApiKey> {
    try {
      const apiKeyData = {
        ...insertApiKey,
        key: randomUUID() // Generate unique API key
      };
      const apiKey = new APIKeyModel(apiKeyData);
      const savedApiKey = await apiKey.save();
      return this.documentToApiKey(savedApiKey);
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  async updateApiKey(id: string, updates: Partial<ApiKey>): Promise<ApiKey | undefined> {
    try {
      const apiKey = await APIKeyModel.findByIdAndUpdate(id, updates, { new: true });
      return apiKey ? this.documentToApiKey(apiKey) : undefined;
    } catch (error) {
      console.error('Error updating API key:', error);
      return undefined;
    }
  }

  // Deposit methods
  async getDeposit(id: string): Promise<Deposit | undefined> {
    try {
      const deposit = await DepositModel.findById(id);
      return deposit ? this.documentToDeposit(deposit) : undefined;
    } catch (error) {
      console.error('Error getting deposit:', error);
      return undefined;
    }
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    try {
      const deposits = await DepositModel.find({ userId }).sort({ createdAt: -1 });
      return deposits.map(deposit => this.documentToDeposit(deposit));
    } catch (error) {
      console.error('Error getting deposits by user ID:', error);
      return [];
    }
  }

  async getAllDeposits(): Promise<Deposit[]> {
    try {
      const deposits = await DepositModel.find().sort({ createdAt: -1 });
      return deposits.map(deposit => this.documentToDeposit(deposit));
    } catch (error) {
      console.error('Error getting all deposits:', error);
      return [];
    }
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    try {
      const depositData = {
        ...insertDeposit,
        amount: parseFloat(insertDeposit.amount) // Convert to number for MongoDB
      };
      const deposit = new DepositModel(depositData);
      const savedDeposit = await deposit.save();
      return this.documentToDeposit(savedDeposit);
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    try {
      const updateData: any = { ...updates };
      if (updates.amount !== undefined) {
        updateData.amount = parseFloat(updates.amount);
      }
      
      const deposit = await DepositModel.findByIdAndUpdate(id, updateData, { new: true });
      return deposit ? this.documentToDeposit(deposit) : undefined;
    } catch (error) {
      console.error('Error updating deposit:', error);
      return undefined;
    }
  }

  // KYC methods
  async getKycDocumentsByUserId(userId: string): Promise<KycDocument[]> {
    try {
      const documents = await KYCDocumentModel.find({ userId }).sort({ createdAt: -1 });
      return documents.map(doc => this.documentToKycDocument(doc));
    } catch (error) {
      console.error('Error getting KYC documents by user ID:', error);
      return [];
    }
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    try {
      const documents = await KYCDocumentModel.find().sort({ createdAt: -1 });
      return documents.map(doc => this.documentToKycDocument(doc));
    } catch (error) {
      console.error('Error getting all KYC documents:', error);
      return [];
    }
  }

  async createKycDocument(insertKycDocument: InsertKycDocument): Promise<KycDocument> {
    try {
      const document = new KYCDocumentModel(insertKycDocument);
      const savedDocument = await document.save();
      return this.documentToKycDocument(savedDocument);
    } catch (error) {
      console.error('Error creating KYC document:', error);
      throw error;
    }
  }

  async updateKycDocument(id: string, updates: Partial<KycDocument>): Promise<KycDocument | undefined> {
    try {
      const document = await KYCDocumentModel.findByIdAndUpdate(id, updates, { new: true });
      return document ? this.documentToKycDocument(document) : undefined;
    } catch (error) {
      console.error('Error updating KYC document:', error);
      return undefined;
    }
  }
}

// Export a singleton instance
export const storage = new MongoStorage();