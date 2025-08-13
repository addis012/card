// Create a new card using Strowallet API
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function createCard() {
  const publicKey = 'pub_hoAnJXAVOxfE6VibvCya7EiXEnw3YyjLhhLAk4cF';
  const secretKey = 'sec_neCKIYtRYqCwOvHJcBwwBAz4PASKF4gHvvtvdNde';
  const customerId = '8023f891-9583-43be-9dd2-95b3b1ea52c6';
  const customerName = 'Addisu';

  console.log('Creating new card for customer:', customerName);
  console.log('Customer ID:', customerId);
  console.log('Public Key:', publicKey);

  // Try different card creation endpoints
  const endpoints = [
    {
      url: 'https://strowallet.com/api/bitvcard/create-card',
      method: 'POST',
      body: {
        customer_id: customerId,
        customer_name: customerName,
        customerEmail: 'addisu@example.com', // Required field
        amount: 100, // Required field - initial funding amount
        public_key: publicKey, // Required field
        card_type: 'virtual'
      }
    },
    {
      url: 'https://strowallet.com/api/v1/cards',
      method: 'POST', 
      body: {
        customerId: customerId,
        customerName: customerName,
        type: 'virtual'
      }
    },
    {
      url: 'https://strowallet.com/api/bitvcard/issue-card',
      method: 'POST',
      body: {
        customer_id: customerId,
        name: customerName,
        card_type: 'VIRTUAL'
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTrying: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'X-Public-Key': publicKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(endpoint.body)
      });

      const text = await response.text();
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));

      try {
        const json = JSON.parse(text);
        console.log('Response:', JSON.stringify(json, null, 2));
        
        if (response.ok && json.success !== false) {
          console.log('\n✅ Card creation successful!');
          return json;
        }
      } catch {
        console.log('Non-JSON Response:', text.substring(0, 500));
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
  }

  console.log('\n❌ Failed to create card with all endpoints');
}

createCard().catch(console.error);