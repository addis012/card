import { pgTable, text, timestamp, boolean, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role", { enum: ['user', 'admin'] }).notNull().default('user'),
  kycStatus: text("kyc_status", { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  kycDocuments: text("kyc_documents"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cards table
export const cardsTable = pgTable("cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  cardNumber: text("card_number"),
  maskedNumber: text("masked_number"),
  expiryDate: text("expiry_date"),
  cvv: text("cvv"),
  cardType: text("card_type", { enum: ['virtual', 'physical'] }).notNull().default('virtual'),
  status: text("status", { enum: ['pending', 'active', 'frozen', 'cancelled'] }).notNull().default('pending'),
  balance: text("balance").notNull().default('0.00'),
  spendingLimit: text("spending_limit").notNull().default('1000.00'),
  currency: text("currency").notNull().default('USDT'),
  strowalletCardId: text("strowallet_card_id"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  billingCountry: text("billing_country"),
  nameOnCard: text("name_on_card"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions table
export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull(),
  merchant: text("merchant").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default('USDT'),
  status: text("status", { enum: ['pending', 'completed', 'failed', 'cancelled'] }).notNull().default('pending'),
  type: text("type", { enum: ['purchase', 'withdrawal', 'refund', 'fee', 'deposit'] }).notNull().default('purchase'),
  description: text("description"),
  transactionReference: text("transaction_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// API Keys table
export const apiKeysTable = pgTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  permissions: jsonb("permissions").notNull().default('[]'),
  lastUsed: timestamp("last_used"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Deposits table
export const depositsTable = pgTable("deposits", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull().default('ETB'),
  status: text("status", { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull().default('pending'),
  paymentMethod: text("payment_method", { enum: ['bank_transfer', 'mobile_money'] }).notNull(),
  transactionReference: text("transaction_reference"),
  adminNotes: text("admin_notes"),
  processedBy: text("processed_by"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// KYC Documents table
export const kycDocumentsTable = pgTable("kyc_documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentType: text("document_type", { enum: ['passport', 'id_card', 'driving_license', 'selfie'] }).notNull(),
  documentUrl: text("document_url"),
  fileName: text("file_name").notNull(),
  fileData: text("file_data").notNull(),
  contentType: text("content_type").notNull(),
  fileSize: text("file_size").notNull(),
  status: text("status", { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({
  id: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
  key: true,
});

export const insertDepositSchema = createInsertSchema(depositsTable).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocumentsTable).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

// Type exports
export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Card = typeof cardsTable.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Deposit = typeof depositsTable.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type KycDocument = typeof kycDocumentsTable.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;