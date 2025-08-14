import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// User schema
const userBaseSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  kycStatus: z.enum(['pending', 'approved', 'rejected']),
  kycDocuments: z.string().nullable(),
  createdAt: z.date(),
});

export const insertUserSchema = userBaseSchema.omit({ id: true, createdAt: true }).extend({
  role: z.enum(['user', 'admin']).default('user'),
  kycStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  phone: z.string().optional(),
  kycDocuments: z.string().optional(),
});

export type User = z.infer<typeof userBaseSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Card schema
const cardBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  cardNumber: z.string().nullable(),
  maskedNumber: z.string().nullable(),
  expiryDate: z.string().nullable(),
  cvv: z.string().nullable(),
  cardType: z.enum(['virtual', 'physical']),
  status: z.enum(['pending', 'active', 'frozen', 'cancelled']),
  balance: z.string(),
  spendingLimit: z.string(),
  currency: z.string(),
  strowalletCardId: z.string().nullable(),
  billingAddress: z.string().nullable(),
  billingCity: z.string().nullable(),
  billingState: z.string().nullable(),
  billingZip: z.string().nullable(),
  billingCountry: z.string().nullable(),
  nameOnCard: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
});

export const insertCardSchema = cardBaseSchema.omit({ id: true, createdAt: true }).extend({
  cardType: z.enum(['virtual', 'physical']).default('virtual'),
  status: z.enum(['pending', 'active', 'frozen', 'cancelled']).default('pending'),
  balance: z.string().default('0.00'),
  spendingLimit: z.string().default('1000.00'),
  currency: z.string().default('USDT'),
  cardNumber: z.string().optional(),
  maskedNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  strowalletCardId: z.string().optional(),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),
  nameOnCard: z.string().optional(),
  approvedAt: z.date().optional(),
});

export type Card = z.infer<typeof cardBaseSchema>;
export type InsertCard = z.infer<typeof insertCardSchema>;

// Transaction schema
const transactionBaseSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  merchant: z.string(),
  amount: z.string(),
  currency: z.string(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']),
  type: z.enum(['purchase', 'withdrawal', 'refund', 'fee', 'deposit']),
  description: z.string().nullable(),
  transactionReference: z.string().nullable(),
  createdAt: z.date(),
});

export const insertTransactionSchema = transactionBaseSchema.omit({ id: true, createdAt: true }).extend({
  currency: z.string().default('USDT'),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('pending'),
  type: z.enum(['purchase', 'withdrawal', 'refund', 'fee', 'deposit']).default('purchase'),
  description: z.string().optional(),
  transactionReference: z.string().optional(),
});

export type Transaction = z.infer<typeof transactionBaseSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// API Key schema
const apiKeyBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  key: z.string(),
  permissions: z.array(z.string()),
  lastUsed: z.date().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const insertApiKeySchema = apiKeyBaseSchema.omit({ id: true, createdAt: true, key: true }).extend({
  permissions: z.array(z.string()).default([]),
  lastUsed: z.date().optional(),
  isActive: z.boolean().default(true),
});

export type ApiKey = z.infer<typeof apiKeyBaseSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

// Deposit schema
const depositBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.string(),
  currency: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  paymentMethod: z.enum(['bank_transfer', 'mobile_money']),
  transactionReference: z.string().nullable(),
  adminNotes: z.string().nullable(),
  processedBy: z.string().nullable(),
  processedAt: z.date().nullable(),
  createdAt: z.date(),
});

export const insertDepositSchema = depositBaseSchema.omit({ id: true, createdAt: true }).extend({
  currency: z.string().default('ETB'),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  transactionReference: z.string().optional(),
  adminNotes: z.string().optional(),
  processedBy: z.string().optional(),
  processedAt: z.date().optional(),
});

export type Deposit = z.infer<typeof depositBaseSchema>;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;

// KYC Document schema
const kycDocumentBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  documentType: z.enum(['passport', 'id_card', 'driving_license', 'selfie']),
  documentUrl: z.string().nullable(),
  fileName: z.string(),
  fileData: z.string(),
  contentType: z.string(),
  fileSize: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  reviewedBy: z.string().nullable(),
  reviewNotes: z.string().nullable(),
  reviewedAt: z.date().nullable(),
  createdAt: z.date(),
});

export const insertKycDocumentSchema = kycDocumentBaseSchema.omit({ id: true, createdAt: true }).extend({
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  documentUrl: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewNotes: z.string().optional(),
  reviewedAt: z.date().optional(),
});

export type KycDocument = z.infer<typeof kycDocumentBaseSchema>;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;

// Strowallet Customer schema
const strowalletCustomerBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  strowalletCustomerId: z.string().nullable(),
  publicKey: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  customerEmail: z.string().email(),
  phoneNumber: z.string(),
  dateOfBirth: z.string(), // mm/dd/yyyy format
  idNumber: z.string(),
  idType: z.string(), // BVN, NIN, PASSPORT, etc.
  houseNumber: z.string(),
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  idImage: z.string(), // base64 or URL
  userPhoto: z.string(), // base64 or URL
  status: z.enum(['pending', 'created', 'failed']),
  createdAt: z.date(),
});

export const insertStrowalletCustomerSchema = strowalletCustomerBaseSchema.omit({ 
  id: true, 
  createdAt: true 
}).extend({
  status: z.enum(['pending', 'created', 'failed']).default('pending'),
  strowalletCustomerId: z.string().optional(),
});

export type StrowalletCustomer = z.infer<typeof strowalletCustomerBaseSchema>;
export type InsertStrowalletCustomer = z.infer<typeof insertStrowalletCustomerSchema>;