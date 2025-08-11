import mongoose, { Schema, Document } from 'mongoose';
import { z } from "zod";

// MongoDB Interfaces
export interface User extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: 'user' | 'admin';
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycDocuments?: string | null;
  createdAt: Date;
}

export interface Card extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  cardNumber?: string | null;
  maskedNumber?: string | null;
  expiryDate?: string | null;
  cvv?: string | null;
  cardType: 'virtual' | 'physical';
  status: 'pending' | 'active' | 'frozen' | 'cancelled';
  balance: string;
  spendingLimit: string;
  currency: string;
  strowalletCardId?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingZip?: string | null;
  billingCountry?: string | null;
  nameOnCard?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

export interface Transaction extends Document {
  _id: mongoose.Types.ObjectId;
  cardId: string;
  merchant: string;
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  type: 'purchase' | 'withdrawal' | 'refund' | 'fee' | 'deposit';
  description?: string | null;
  transactionReference?: string | null;
  createdAt: Date;
}

export interface ApiKey extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Deposit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'mobile_money';
  transactionReference?: string | null;
  adminNotes?: string | null;
  processedBy?: string | null;
  processedAt?: Date | null;
  createdAt: Date;
}

export interface KycDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  documentType: 'passport' | 'id_card' | 'driving_license' | 'selfie';
  documentUrl?: string | null;
  fileName: string;
  fileData: string;
  contentType: string;
  fileSize: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

// MongoDB Schemas
const userSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocuments: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const cardSchema = new Schema<Card>({
  userId: { type: String, required: true },
  cardNumber: { type: String, default: null },
  maskedNumber: { type: String, default: null },
  expiryDate: { type: String, default: null },
  cvv: { type: String, default: null },
  cardType: { type: String, enum: ['virtual', 'physical'], default: 'virtual' },
  status: { type: String, enum: ['pending', 'active', 'frozen', 'cancelled'], default: 'pending' },
  balance: { type: String, default: '0.00' },
  spendingLimit: { type: String, default: '1000.00' },
  currency: { type: String, default: 'USDT' },
  strowalletCardId: { type: String, default: null },
  billingAddress: { type: String, default: null },
  billingCity: { type: String, default: null },
  billingState: { type: String, default: null },
  billingZip: { type: String, default: null },
  billingCountry: { type: String, default: null },
  nameOnCard: { type: String, default: null },
  approvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new Schema<Transaction>({
  cardId: { type: String, required: true },
  merchant: { type: String, required: true },
  amount: { type: String, required: true },
  currency: { type: String, default: 'USDT' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  type: { type: String, enum: ['purchase', 'withdrawal', 'refund', 'fee', 'deposit'], default: 'purchase' },
  description: { type: String, default: null },
  transactionReference: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const apiKeySchema = new Schema<ApiKey>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  permissions: { type: [String], default: [] },
  lastUsed: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const depositSchema = new Schema<Deposit>({
  userId: { type: String, required: true },
  amount: { type: String, required: true },
  currency: { type: String, default: 'ETB' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['bank_transfer', 'mobile_money'], required: true },
  transactionReference: { type: String, default: null },
  adminNotes: { type: String, default: null },
  processedBy: { type: String, default: null },
  processedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const kycDocumentSchema = new Schema<KycDocument>({
  userId: { type: String, required: true },
  documentType: { type: String, enum: ['passport', 'id_card', 'driving_license', 'selfie'], required: true },
  documentUrl: { type: String, default: null },
  fileName: { type: String, required: true },
  fileData: { type: String, required: true },
  contentType: { type: String, required: true },
  fileSize: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: String, default: null },
  reviewNotes: { type: String, default: null },
  reviewedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Export models
export const UserModel = mongoose.model<User>('User', userSchema);
export const CardModel = mongoose.model<Card>('Card', cardSchema);
export const TransactionModel = mongoose.model<Transaction>('Transaction', transactionSchema);
export const ApiKeyModel = mongoose.model<ApiKey>('ApiKey', apiKeySchema);
export const DepositModel = mongoose.model<Deposit>('Deposit', depositSchema);
export const KycDocumentModel = mongoose.model<KycDocument>('KycDocument', kycDocumentSchema);

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