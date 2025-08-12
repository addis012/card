import { pgTable, text, timestamp, decimal, boolean, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const kycStatusEnum = pgEnum('kyc_status', ['pending', 'approved', 'rejected']);
export const cardTypeEnum = pgEnum('card_type', ['virtual', 'physical']);
export const cardStatusEnum = pgEnum('card_status', ['pending', 'active', 'frozen', 'cancelled']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'cancelled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['purchase', 'withdrawal', 'refund', 'fee', 'deposit']);
export const depositStatusEnum = pgEnum('deposit_status', ['pending', 'processing', 'completed', 'failed']);
export const paymentMethodEnum = pgEnum('payment_method', ['bank_transfer', 'mobile_money']);
export const documentTypeEnum = pgEnum('document_type', ['passport', 'id_card', 'driving_license', 'selfie']);
export const documentStatusEnum = pgEnum('document_status', ['pending', 'approved', 'rejected']);

// Define tables
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  role: userRoleEnum('role').notNull().default('user'),
  kycStatus: kycStatusEnum('kyc_status').notNull().default('pending'),
  kycDocuments: text('kyc_documents'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const cards = pgTable('cards', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  cardNumber: varchar('card_number', { length: 20 }),
  maskedNumber: varchar('masked_number', { length: 20 }),
  expiryDate: varchar('expiry_date', { length: 10 }),
  cvv: varchar('cvv', { length: 4 }),
  cardType: cardTypeEnum('card_type').notNull().default('virtual'),
  status: cardStatusEnum('status').notNull().default('pending'),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  spendingLimit: decimal('spending_limit', { precision: 12, scale: 2 }).notNull().default('1000.00'),
  currency: varchar('currency', { length: 10 }).notNull().default('USDT'),
  strowalletCardId: varchar('strowallet_card_id', { length: 255 }),
  billingAddress: text('billing_address'),
  billingCity: varchar('billing_city', { length: 255 }),
  billingState: varchar('billing_state', { length: 255 }),
  billingZip: varchar('billing_zip', { length: 20 }),
  billingCountry: varchar('billing_country', { length: 255 }),
  nameOnCard: varchar('name_on_card', { length: 255 }),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  cardId: text('card_id').notNull().references(() => cards.id),
  merchant: varchar('merchant', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USDT'),
  status: transactionStatusEnum('status').notNull().default('pending'),
  type: transactionTypeEnum('type').notNull().default('purchase'),
  description: text('description'),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  permissions: text('permissions').array(),
  lastUsed: timestamp('last_used'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const deposits = pgTable('deposits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('ETB'),
  status: depositStatusEnum('status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  adminNotes: text('admin_notes'),
  processedBy: text('processed_by').references(() => users.id),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const kycDocuments = pgTable('kyc_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  documentType: documentTypeEnum('document_type').notNull(),
  documentUrl: text('document_url'),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileData: text('file_data').notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  fileSize: varchar('file_size', { length: 20 }).notNull(),
  status: documentStatusEnum('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Validation schemas using Zod
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
});

export const insertCardSchema = z.object({
  userId: z.string().min(1),
  cardType: z.enum(['virtual', 'physical']).default('virtual'),
  status: z.enum(['pending', 'active', 'frozen', 'cancelled']).optional(),
  spendingLimit: z.string().default('1000.00'),
  currency: z.string().default('USDT'),
  cardNumber: z.string().optional(),
  maskedNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),
  nameOnCard: z.string().optional(),
  strowalletCardId: z.string().optional(),
  balance: z.string().optional(),
});

export const insertTransactionSchema = z.object({
  cardId: z.string().min(1),
  merchant: z.string().min(1),
  amount: z.string().min(1),
  currency: z.string().default('USDT'),
  type: z.enum(['purchase', 'withdrawal', 'refund', 'fee', 'deposit']).default('purchase'),
  description: z.string().optional(),
  transactionReference: z.string().optional(),
});

export const insertApiKeySchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

export const insertDepositSchema = z.object({
  userId: z.string().min(1),
  amount: z.string().min(1),
  currency: z.string().default('ETB'),
  paymentMethod: z.enum(['bank_transfer', 'mobile_money']),
  transactionReference: z.string().optional(),
  adminNotes: z.string().optional(),
});

export const insertKycDocumentSchema = z.object({
  userId: z.string().min(1),
  documentType: z.enum(['passport', 'id_card', 'driving_license', 'selfie']),
  documentUrl: z.string().optional(),
  fileName: z.string().min(1),
  fileData: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.string().min(1),
});

// Type exports for insertions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;

// Plain object types for interfaces (without MongoDB _id)
export type UserPlain = {
  id: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'user' | 'admin';
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycDocuments: string | null;
  createdAt: Date;
};

export type CardPlain = {
  id: string;
  userId: string;
  cardNumber: string | null;
  maskedNumber: string | null;
  expiryDate: string | null;
  cvv: string | null;
  cardType: 'virtual' | 'physical';
  status: 'pending' | 'active' | 'frozen' | 'cancelled';
  balance: string;
  spendingLimit: string;
  currency: string;
  strowalletCardId: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingZip: string | null;
  billingCountry: string | null;
  nameOnCard: string | null;
  approvedAt: Date | null;
  createdAt: Date;
};

export type TransactionPlain = {
  id: string;
  cardId: string;
  merchant: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'purchase' | 'withdrawal' | 'refund' | 'fee' | 'deposit';
  description: string | null;
  transactionReference: string | null;
  createdAt: Date;
};

export type ApiKeyPlain = {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export type DepositPlain = {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'mobile_money';
  transactionReference: string | null;
  adminNotes: string | null;
  processedBy: string | null;
  processedAt: Date | null;
  createdAt: Date;
};

export type KycDocumentPlain = {
  id: string;
  userId: string;
  documentType: 'passport' | 'id_card' | 'driving_license' | 'selfie';
  documentUrl: string | null;
  fileName: string;
  fileData: string;
  contentType: string;
  fileSize: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};