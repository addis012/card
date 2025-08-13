import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI not found in environment variables. Using fallback in-memory storage.');
}

// Connect to MongoDB with SSL/TLS options
export const connectToMongoDB = async () => {
  if (!MONGODB_URI) {
    console.log('MongoDB connection skipped - using in-memory storage');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB Atlas...');
    console.log('Connection string prefix:', MONGODB_URI.substring(0, 20) + '...');
    
    // Try different connection approaches
    const connectionOptions = [
      // Option 1: Standard secure connection
      {
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      },
      // Option 2: Allow insecure certificates for Replit environment
      {
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true
      },
      // Option 3: Minimal connection settings
      {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        bufferCommands: false,
        bufferMaxEntries: 0
      }
    ];

    for (let i = 0; i < connectionOptions.length; i++) {
      try {
        console.log(`Trying connection option ${i + 1}...`);
        await mongoose.connect(MONGODB_URI, connectionOptions[i]);
        console.log(`Connected to MongoDB Atlas successfully with option ${i + 1}`);
        return;
      } catch (optionError) {
        console.log(`Connection option ${i + 1} failed:`, optionError instanceof Error ? optionError.message : 'Unknown error');
        if (i < connectionOptions.length - 1) {
          console.log('Trying next connection option...');
        }
      }
    }
    
    throw new Error('All connection options failed');
  } catch (error) {
    console.error('All MongoDB connection attempts failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('Falling back to in-memory storage - application will continue to work');
  }
};

// MongoDB connection instance
export const db = mongoose.connection;

// Handle connection events
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});