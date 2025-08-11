import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { 
  usersTable, 
  cardsTable, 
  transactionsTable, 
  apiKeysTable, 
  depositsTable, 
  kycDocumentsTable 
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, {
  schema: {
    users: usersTable,
    cards: cardsTable,
    transactions: transactionsTable,
    apiKeys: apiKeysTable,
    deposits: depositsTable,
    kycDocuments: kycDocumentsTable,
  },
});

export type DbType = typeof db;