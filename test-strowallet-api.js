// Test Strowallet API with proper format from documentation

async function testStrowalletAPI() {
  const publicKey = process.env.STROWALLET_PUBLIC_KEY;
  const secretKey = process.env.STROWALLET_SECRET_KEY;
  
  console.log('Testing Strowallet API with your credentials...');
  console.log('Public Key:', publicKey?.substring(0, 10) + '...');
  console.log('Secret Key:', secretKey?.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://strowallet.com/api/bitvcard/create-card/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name_on_card: 'Addisu',
        card_type: 'visa',
        public_key: publicKey,
        amount: '100',
        customerEmail: 'addisu@example.com',
        mode: 'sandbox'  // Using sandbox mode for testing
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    const responseText = await response.text();
    console.log('Raw Response:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('Parsed Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('Request Error:', error.message);
  }
}

testStrowalletAPI();