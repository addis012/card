// Quick script to test Strowallet API directly
const fetch = require('node-fetch');
require('dotenv').config();

async function testStrowalletAPI() {
  const publicKey = process.env.STROWALLET_PUBLIC_KEY;
  const secretKey = process.env.STROWALLET_SECRET_KEY;
  
  console.log('Testing Strowallet API...');
  console.log('Public Key:', publicKey?.substring(0, 15) + '...');
  console.log('Secret Key:', secretKey?.substring(0, 15) + '...');
  
  const endpoints = [
    'https://strowallet.com/api/bitvcard/account-balance',
    'https://strowallet.com/api/bitvcard/fetch-card-detail/',
    'https://strowallet.com/api/bitvcard/card-transactions/',
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'X-Public-Key': publicKey,
          'Content-Type': 'application/json',
        },
      });
      
      const text = await response.text();
      console.log('Status:', response.status);
      
      try {
        const json = JSON.parse(text);
        console.log('Response:', JSON.stringify(json, null, 2));
      } catch {
        console.log('Non-JSON Response:', text.substring(0, 200) + '...');
      }
    } catch (error) {
      console.log('Error:', error.message);
    }
  }
}

testStrowalletAPI();