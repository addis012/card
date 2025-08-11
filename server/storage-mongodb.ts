import { MongoStorage, IStorage } from "./mongodb-storage";
import { connectToMongoDB } from "./mongodb";

// Initialize MongoDB connection
let mongoInstance: MongoStorage | null = null;
let isConnecting = false;

const getMongoStorage = async (): Promise<MongoStorage> => {
  if (mongoInstance) {
    return mongoInstance;
  }
  
  if (isConnecting) {
    // Wait for the connection to complete
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (mongoInstance) {
      return mongoInstance;
    }
  }
  
  isConnecting = true;
  try {
    await connectToMongoDB();
    mongoInstance = new MongoStorage();
    return mongoInstance;
  } finally {
    isConnecting = false;
  }
};

// Storage instance that matches current interface but uses MongoDB
export class StorageAdapter {
  private mongo: MongoStorage | null = null;

  private async getStorage(): Promise<MongoStorage> {
    if (!this.mongo) {
      this.mongo = await getMongoStorage();
    }
    return this.mongo;
  }

  // User methods - mapping to MongoDB storage
  async getUser(id: string) {
    const storage = await this.getStorage();
    return await storage.getUserById(id);
  }

  async getUserByUsername(username: string) {
    const storage = await this.getStorage();
    return await storage.getUserByUsername(username);
  }

  async createUser(insertUser: any) {
    const storage = await this.getStorage();
    return await storage.createUser(insertUser);
  }

  async updateUser(id: string, updates: any) {
    const storage = await this.getStorage();
    return await storage.updateUser(id, updates);
  }

  // Additional user methods for full compatibility
  async getUserById(id: string) {
    return await this.getUser(id);
  }

  async getUserByEmail(email: string) {
    const storage = await this.getStorage();
    return await storage.getUserByEmail(email);
  }

  async deleteUser(id: string) {
    const storage = await this.getStorage();
    return await storage.deleteUser(id);
  }

  async getAllUsers() {
    const storage = await this.getStorage();
    return await storage.getAllUsers();
  }

  // Card methods
  async getCard(id: string) {
    const storage = await this.getStorage();
    return await storage.getCardById(id);
  }

  async getCardById(id: string) {
    return await this.getCard(id);
  }

  async getCardsByUserId(userId: string) {
    const storage = await this.getStorage();
    return await storage.getCardsByUserId(userId);
  }

  async createCard(insertCard: any) {
    const storage = await this.getStorage();
    return await storage.createCard(insertCard);
  }

  async updateCard(id: string, updates: any) {
    const storage = await this.getStorage();
    return await storage.updateCard(id, updates);
  }

  async deleteCard(id: string) {
    const storage = await this.getStorage();
    return await storage.deleteCard(id);
  }

  async getAllCards() {
    const storage = await this.getStorage();
    return await storage.getAllCards();
  }

  async getPendingCards() {
    const storage = await this.getStorage();
    return await storage.getPendingCards();
  }

  // Transaction methods
  async getTransaction(id: string) {
    const storage = await this.getStorage();
    return await storage.getTransactionById(id);
  }

  async getTransactionById(id: string) {
    return await this.getTransaction(id);
  }

  async getTransactionsByCardId(cardId: string) {
    const storage = await this.getStorage();
    return await storage.getTransactionsByCardId(cardId);
  }

  async getTransactionsByUserId(userId: string) {
    const storage = await this.getStorage();
    const cards = await storage.getCardsByUserId(userId);
    const transactions = [];
    for (const card of cards) {
      const cardTransactions = await storage.getTransactionsByCardId(card._id);
      transactions.push(...cardTransactions);
    }
    return transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTransaction(insertTransaction: any) {
    const storage = await this.getStorage();
    return await storage.createTransaction(insertTransaction);
  }

  async updateTransaction(id: string, updates: any) {
    const storage = await this.getStorage();
    return await storage.updateTransaction(id, updates);
  }

  async deleteTransaction(id: string) {
    const storage = await this.getStorage();
    return await storage.deleteTransaction(id);
  }

  async getAllTransactions() {
    const storage = await this.getStorage();
    return await storage.getAllTransactions();
  }

  // API Key methods
  async getApiKeysByUserId(userId: string) {
    const storage = await this.getStorage();
    return await storage.getAPIKeysByUserId(userId);
  }

  async createApiKey(insertApiKey: any) {
    const storage = await this.getStorage();
    return await storage.createAPIKey(insertApiKey);
  }

  async updateApiKey(id: string, updates: any) {
    const storage = await this.getStorage();
    return await storage.updateAPIKey(id, updates);
  }

  async createAPIKey(insertApiKey: any) {
    return await this.createApiKey(insertApiKey);
  }

  async getAPIKeyById(id: string) {
    const storage = await this.getStorage();
    return await storage.getAPIKeyById(id);
  }

  async getAPIKeysByUserId(userId: string) {
    return await this.getApiKeysByUserId(userId);
  }

  async getAPIKeyByKey(key: string) {
    const storage = await this.getStorage();
    return await storage.getAPIKeyByKey(key);
  }

  async updateAPIKey(id: string, updates: any) {
    return await this.updateApiKey(id, updates);
  }

  async deleteAPIKey(id: string) {
    const storage = await this.getStorage();
    return await storage.deleteAPIKey(id);
  }

  async getAllAPIKeys() {
    const storage = await this.getStorage();
    return await storage.getAllAPIKeys();
  }

  // Deposit methods
  async getDeposit(id: string) {
    const storage = await this.getStorage();
    return await storage.getDepositById(id);
  }

  async getDepositById(id: string) {
    return await this.getDeposit(id);
  }

  async getDepositsByUserId(userId: string) {
    const storage = await this.getStorage();
    return await storage.getDepositsByUserId(userId);
  }

  async getAllDeposits() {
    const storage = await this.getStorage();
    return await storage.getAllDeposits();
  }

  async createDeposit(insertDeposit: any) {
    const storage = await this.getStorage();
    return await storage.createDeposit(insertDeposit);
  }

  async updateDeposit(id: string, updates: any) {
    const storage = await this.getStorage();
    return await storage.updateDeposit(id, updates);
  }

  async getPendingDeposits() {
    const storage = await this.getStorage();
    return await storage.getPendingDeposits();
  }

  // KYC methods
  async getKycDocumentsByUserId(userId: string) {
    const storage = await this.getStorage();
    return await storage.getKYCDocumentsByUserId(userId);
  }

  async getAllKycDocuments() {
    const storage = await this.getStorage();
    return await storage.getAllKYCDocuments();
  }

  async createKycDocument(insertDocument: any) {
    const storage = await this.getStorage();
    return await storage.createKYCDocument(insertDocument);
  }

  async updateKycDocument(id: string, updates: any) {
    const storage = await this.getStorage();
    return await storage.updateKYCDocument(id, updates);
  }

  async createKYCDocument(insertDocument: any) {
    return await this.createKycDocument(insertDocument);
  }

  async getKYCDocumentById(id: string) {
    const storage = await this.getStorage();
    return await storage.getKYCDocumentById(id);
  }

  async getKYCDocumentsByUserId(userId: string) {
    return await this.getKycDocumentsByUserId(userId);
  }

  async updateKYCDocument(id: string, updates: any) {
    return await this.updateKycDocument(id, updates);
  }

  async deleteKYCDocument(id: string) {
    const storage = await this.getStorage();
    return await storage.deleteKYCDocument(id);
  }

  async getAllKYCDocuments() {
    return await this.getAllKycDocuments();
  }

  async getPendingKYCDocuments() {
    const storage = await this.getStorage();
    return await storage.getPendingKYCDocuments();
  }
}

// Export the storage instance
export const storage = new StorageAdapter();