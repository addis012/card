import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin';
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycDocuments?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocuments: { type: String }, // JSON array of document URLs
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);

// Deposit Schema
export interface IDeposit extends Document {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'mobile_money';
  transactionReference?: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
}

const depositSchema = new Schema<IDeposit>({
  userId: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'ETB' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  paymentMethod: { type: String, enum: ['bank_transfer', 'mobile_money'], required: true },
  transactionReference: { type: String },
  adminNotes: { type: String },
  processedBy: { type: String, ref: 'User' },
  processedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const Deposit = mongoose.model<IDeposit>('Deposit', depositSchema);

// KYC Document Schema
export interface IKYCDocument extends Document {
  _id: string;
  userId: string;
  documentType: 'passport' | 'id_card' | 'driving_license' | 'selfie';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const kycDocumentSchema = new Schema<IKYCDocument>({
  userId: { type: String, ref: 'User', required: true },
  documentType: { type: String, enum: ['passport', 'id_card', 'driving_license', 'selfie'], required: true },
  documentUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: String, ref: 'User' },
  reviewNotes: { type: String },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export const KYCDocument = mongoose.model<IKYCDocument>('KYCDocument', kycDocumentSchema);

// Card Schema
export interface ICard extends Document {
  _id: string;
  userId: string;
  cardNumber?: string;
  maskedNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardType: 'virtual' | 'physical';
  status: 'pending' | 'active' | 'frozen' | 'cancelled';
  balance: number;
  spendingLimit: number;
  currency: string;
  strowalletCardId?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  nameOnCard?: string;
  approvedAt?: Date;
  createdAt: Date;
}

const cardSchema = new Schema<ICard>({
  userId: { type: String, ref: 'User', required: true },
  cardNumber: { type: String },
  maskedNumber: { type: String },
  expiryDate: { type: String },
  cvv: { type: String },
  cardType: { type: String, enum: ['virtual', 'physical'], default: 'virtual' },
  status: { type: String, enum: ['pending', 'active', 'frozen', 'cancelled'], default: 'pending' },
  balance: { type: Number, default: 0.00 },
  spendingLimit: { type: Number, default: 1000.00 },
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

export const Card = mongoose.model<ICard>('Card', cardSchema);

// Transaction Schema
export interface ITransaction extends Document {
  _id: string;
  cardId: string;
  merchant: string;
  amount: number;
  currency: string;
  type: 'purchase' | 'withdrawal' | 'refund' | 'fee' | 'deposit';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  transactionReference?: string;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  cardId: { type: String, ref: 'Card', required: true },
  merchant: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USDT' },
  type: { type: String, enum: ['purchase', 'withdrawal', 'refund', 'fee', 'deposit'], default: 'purchase' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  description: { type: String },
  transactionReference: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

// API Key Schema
export interface IAPIKey extends Document {
  _id: string;
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed?: Date;
  isActive: boolean;
  createdAt: Date;
}

const apiKeySchema = new Schema<IAPIKey>({
  userId: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  permissions: [{ type: String }],
  lastUsed: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const APIKey = mongoose.model<IAPIKey>('APIKey', apiKeySchema);

// Zod schemas for validation (adapting from Drizzle to work with MongoDB)
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
  amount: z.number().positive(),
  currency: z.string().default('ETB'),
  paymentMethod: z.enum(['bank_transfer', 'mobile_money']),
  transactionReference: z.string().optional(),
  adminNotes: z.string().optional(),
});

export const insertKYCDocumentSchema = z.object({
  userId: z.string().min(1),
  documentType: z.enum(['passport', 'id_card', 'driving_license', 'selfie']),
  documentUrl: z.string().url(),
});

export const insertCardSchema = z.object({
  userId: z.string().min(1),
  cardType: z.enum(['virtual', 'physical']).default('virtual'),
  spendingLimit: z.number().positive().default(1000),
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
  amount: z.number(),
  currency: z.string().default('USDT'),
  type: z.enum(['purchase', 'withdrawal', 'refund', 'fee', 'deposit']).default('purchase'),
  description: z.string().optional(),
  transactionReference: z.string().optional(),
});

export const insertAPIKeySchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type InsertKYCDocument = z.infer<typeof insertKYCDocumentSchema>;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertAPIKey = z.infer<typeof insertAPIKeySchema>;

export type SelectUser = IUser;
export type SelectDeposit = IDeposit;
export type SelectKYCDocument = IKYCDocument;
export type SelectCard = ICard;
export type SelectTransaction = ITransaction;
export type SelectAPIKey = IAPIKey;