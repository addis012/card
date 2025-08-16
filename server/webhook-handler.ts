/**
 * StroWallet Webhook Handler
 * Based on official documentation
 */
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import { storage } from './hybrid-storage';

interface StrowalletWebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

export function registerWebhookHandler(app: Express) {
  // StroWallet webhook endpoint
  app.post('/api/webhook/strowallet', async (req: Request, res: Response) => {
    try {
      console.log('StroWallet webhook received:', {
        headers: req.headers,
        body: req.body
      });

      // Get the raw body for signature verification
      const rawBody = JSON.stringify(req.body);
      const signature = req.headers['x-strowallet-signature'] as string;

      // Verify signature if webhook secret is configured
      if (process.env.STROWALLET_WEBHOOK_SECRET && signature) {
        const expectedSignature = crypto
          .createHmac('sha256', process.env.STROWALLET_WEBHOOK_SECRET)
          .update(rawBody)
          .digest('hex');

        if (`sha256=${expectedSignature}` !== signature) {
          console.error('Invalid webhook signature');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }

      const event: StrowalletWebhookEvent = req.body;

      // Process the webhook event
      await processWebhookEvent(event);

      // Respond with success
      res.status(200).json({ ok: true });

    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

async function processWebhookEvent(event: StrowalletWebhookEvent) {
  console.log(`Processing webhook event: ${event.type}`, event);

  try {
    switch (event.type) {
      case 'card.created':
        await handleCardCreated(event.data);
        break;
      
      case 'card.funded':
        await handleCardFunded(event.data);
        break;
      
      case 'card.frozen':
        await handleCardFrozen(event.data);
        break;
      
      case 'card.unfrozen':
        await handleCardUnfrozen(event.data);
        break;
      
      case 'transaction.posted':
        await handleTransactionPosted(event.data);
        break;
      
      case 'customer.created':
        await handleCustomerCreated(event.data);
        break;
      
      case 'customer.updated':
        await handleCustomerUpdated(event.data);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Store the webhook event for audit purposes
    await storeWebhookEvent(event);

  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error);
    throw error;
  }
}

async function handleCardCreated(data: any) {
  console.log('Card created webhook:', data);
  
  // Update local card record if we have it
  if (data.card_id) {
    try {
      // Find card by StroWallet card ID
      const cards = await storage.getAllCards();
      const card = cards.find(c => c.strowalletCardId === data.card_id);
      
      if (card) {
        await storage.updateCard(card.id, {
          status: 'active',
          cardNumber: data.card_number,
          maskedNumber: data.masked_number,
          expiryDate: data.expiry_date,
          cvv: data.cvv,
          balance: data.balance || '0.00'
        });
        console.log(`Updated local card ${card.id} from webhook`);
      }
    } catch (error) {
      console.error('Error updating card from webhook:', error);
    }
  }
}

async function handleCardFunded(data: any) {
  console.log('Card funded webhook:', data);
  
  if (data.card_id && data.amount) {
    try {
      const cards = await storage.getAllCards();
      const card = cards.find(c => c.strowalletCardId === data.card_id);
      
      if (card) {
        const currentBalance = parseFloat(card.balance || '0');
        const fundAmount = parseFloat(data.amount);
        const newBalance = (currentBalance + fundAmount).toFixed(2);
        
        await storage.updateCard(card.id, {
          balance: newBalance
        });

        // Create a funding transaction record
        await storage.createTransaction({
          cardId: card.id,
          merchant: 'StroWallet Funding',
          amount: data.amount,
          currency: card.currency || 'USDT',
          status: 'completed',
          type: 'deposit',
          description: 'Card funding via StroWallet',
          transactionReference: data.transaction_id || `fund_${Date.now()}`
        });

        console.log(`Updated card balance: ${card.id} -> ${newBalance}`);
      }
    } catch (error) {
      console.error('Error updating card balance from webhook:', error);
    }
  }
}

async function handleCardFrozen(data: any) {
  console.log('Card frozen webhook:', data);
  
  if (data.card_id) {
    try {
      const cards = await storage.getAllCards();
      const card = cards.find(c => c.strowalletCardId === data.card_id);
      
      if (card) {
        await storage.updateCard(card.id, {
          status: 'frozen'
        });
        console.log(`Froze card ${card.id} from webhook`);
      }
    } catch (error) {
      console.error('Error freezing card from webhook:', error);
    }
  }
}

async function handleCardUnfrozen(data: any) {
  console.log('Card unfrozen webhook:', data);
  
  if (data.card_id) {
    try {
      const cards = await storage.getAllCards();
      const card = cards.find(c => c.strowalletCardId === data.card_id);
      
      if (card) {
        await storage.updateCard(card.id, {
          status: 'active'
        });
        console.log(`Unfroze card ${card.id} from webhook`);
      }
    } catch (error) {
      console.error('Error unfreezing card from webhook:', error);
    }
  }
}

async function handleTransactionPosted(data: any) {
  console.log('Transaction posted webhook:', data);
  
  if (data.card_id) {
    try {
      const cards = await storage.getAllCards();
      const card = cards.find(c => c.strowalletCardId === data.card_id);
      
      if (card) {
        // Create transaction record
        await storage.createTransaction({
          cardId: card.id,
          merchant: data.merchant || 'Unknown Merchant',
          amount: data.amount,
          currency: data.currency || card.currency || 'USDT',
          status: data.status || 'completed',
          type: data.transaction_type || 'purchase',
          description: data.description || `Transaction at ${data.merchant}`,
          transactionReference: data.transaction_id || data.reference
        });

        // Update card balance if provided
        if (data.remaining_balance !== undefined) {
          await storage.updateCard(card.id, {
            balance: data.remaining_balance.toString()
          });
        }

        console.log(`Created transaction record for card ${card.id}`);
      }
    } catch (error) {
      console.error('Error creating transaction from webhook:', error);
    }
  }
}

async function handleCustomerCreated(data: any) {
  console.log('Customer created webhook:', data);
  
  // Update StroWallet customer record if we have it
  if (data.customer_id && data.email) {
    try {
      const customers = await storage.getAllStrowalletCustomers();
      const customer = customers.find(c => c.customerEmail === data.email);
      
      if (customer) {
        await storage.updateStrowalletCustomer(customer.id, {
          strowalletCustomerId: data.customer_id,
          status: 'created'
        });
        console.log(`Updated StroWallet customer ${customer.id} from webhook`);
      }
    } catch (error) {
      console.error('Error updating customer from webhook:', error);
    }
  }
}

async function handleCustomerUpdated(data: any) {
  console.log('Customer updated webhook:', data);
  // Handle customer updates if needed
}

async function storeWebhookEvent(event: StrowalletWebhookEvent) {
  try {
    // In a production system, you'd store this in a dedicated webhooks table
    // For now, we'll just log it
    console.log('Storing webhook event:', {
      id: event.id,
      type: event.type,
      created: event.created,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error storing webhook event:', error);
  }
}