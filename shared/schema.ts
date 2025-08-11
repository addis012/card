import { z } from "zod";

// User types
export interface User {
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
}

// Deposit types
export interface Deposit {
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
}

// KYC Document types
export interface KycDocument {
  id: string;
  userId: string;
  documentType: 'passport' | 'id_card' | 'driving_license' | 'selfie';
  documentUrl: string | null;
  fileName: string;
  fileData: string;
  contentType: string;
  fileSize: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

// Card types
export interface Card {
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
}

// Transaction types
export interface Transaction {
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
}

// API Key types
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: Date | null;
  isActive: boolean;
  createdAt: Date;
}

// Insert schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']).default('user'),
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
  fileSize: z.number().positive(),
});

export const insertCardSchema = z.object({
  userId: z.string().min(1),
  cardType: z.enum(['virtual', 'physical']).default('virtual'),
  spendingLimit: z.string().default('1000.00'),
  currency: z.string().default('USDT'),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingZip: z.string().optional(),
  billingCountry: z.string().optional(),
  nameOnCard: z.string().optional(),
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

// Type exports for inserts
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;