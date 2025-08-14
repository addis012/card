// Quick script to check card status directly
const https = require('https');

async function checkCardStatus() {
  const cardIds = ['6470011835', '7084755120'];
  
  for (const cardId of cardIds) {
    console.log(`\n=== Checking Card ${cardId} ===`);
    
    try {
      // Make request to our endpoint
      const response = await fetch('http://localhost:5000/api/strowallet-cards');
      const data = await response.json();
      
      const card = data.cards.find(c => c.cardId === cardId);
      if (card) {
        console.log(`Status: ${card.status}`);
        console.log(`Balance: ${card.balance || 'N/A'}`);
        console.log(`Note: ${card.note || 'N/A'}`);
      } else {
        console.log('Card not found in response');
      }
    } catch (error) {
      console.error(`Error checking card ${cardId}:`, error.message);
    }
  }
}

checkCardStatus();