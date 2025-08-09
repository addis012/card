import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default('user'), // 'user' | 'admin'
  kycStatus: text("kyc_status").notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  kycDocuments: text("kyc_documents"), // JSON array of document URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deposits = pgTable("deposits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('ETB'),
  status: text("status").notNull().default('pending'), // 'pending' | 'processing' | 'completed' | 'failed'
  paymentMethod: text("payment_method").notNull(), // 'bank_transfer' | 'mobile_money'
  transactionReference: text("transaction_reference"),
  adminNotes: text("admin_notes"),
  processedBy: varchar("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kycDocuments = pgTable("kyc_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // 'passport' | 'id_card' | 'driving_license' | 'selfie'
  documentUrl: text("document_url").notNull(),
  status: text("status").notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cards = pgTable("cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  cardNumber: text("card_number"), // Full card number (stored securely)
  maskedNumber: text("masked_number"), // Masked display version
  expiryDate: text("expiry_date"), // MM/YY format
  cvv: text("cvv"), // CVV code
  cardType: text("card_type").notNull().default('virtual'), // 'virtual' | 'physical'
  status: text("status").notNull().default('pending'), // 'pending' | 'active' | 'frozen' | 'cancelled'
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default('0.00'),
  spendingLimit: decimal("spending_limit", { precision: 15, scale: 2 }).notNull().default('1000.00'),
  currency: text("currency").notNull().default('USDT'),
  strowalletCardId: text("strowallet_card_id"), // Strowallet API card reference
  
  // Address fields for card holder
  billingAddress: text("billing_address"), // Street address
  billingCity: text("billing_city"), // City
  billingState: text("billing_state"), // State/Province
  billingZip: text("billing_zip"), // Postal/ZIP code
  billingCountry: text("billing_country"), // Country
  nameOnCard: text("name_on_card"), // Name as it appears on the card
  
  approvedAt: timestamp("approved_at"), // When admin approved the card
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cardId: varchar("card_id").references(() => cards.id).notNull(),
  merchant: text("merchant").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USDT'),
  status: text("status").notNull().default('completed'), // 'pending' | 'completed' | 'failed'
  type: text("type").notNull(), // 'debit' | 'credit'
  description: text("description"),
  strowalletTransactionId: text("strowallet_transaction_id"), // Strowallet API transaction reference
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  publicKey: text("public_key").notNull(),
  secretKey: text("secret_key").notNull(),
  isTestMode: boolean("is_test_mode").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCardSchema = createInsertSchema(cards).omit({
  id: true,
  createdAt: true,
  maskedNumber: true,
  strowalletCardId: true,
}).extend({
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be 16 digits"),
  cvv: z.string().regex(/^\d{3}$/, "CVV must be 3 digits"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  strowalletTransactionId: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertDepositSchema = createInsertSchema(deposits).omit({
  id: true,
  createdAt: true,
  processedBy: true,
  processedAt: true,
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  createdAt: true,
  reviewedBy: true,
  reviewedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
