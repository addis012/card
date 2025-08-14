import strowallet from '@api/strowallet';

// Create production card for kalkidan adamu
async function createProductionCard() {
  try {
    console.log('Creating production card for kalkidan adamu...');
    
    const result = await strowallet.createNewCard({
      name_on_card: 'kalkidan adamu',
      card_type: 'visa',
      public_key: 'pub_SkVqm5mglsqS1mOkoilo06HiobYqhdibn8UehMJf',
      amount: '25',
      customerEmail: 'addisumelke04@gmail.com'
      // No mode parameter for production
    });
    
    console.log('Production card created successfully:');
    console.log(JSON.stringify(result.data, null, 2));
    
    return result.data;
  } catch (error) {
    console.error('Error creating production card:', error);
    throw error;
  }
}

// Execute the card creation
createProductionCard()
  .then(cardData => {
    console.log('SUCCESS: Real production card created!');
    console.log('Card ID:', cardData.card_id);
    console.log('Status:', cardData.status);
  })
  .catch(error => {
    console.error('FAILED: Could not create production card');
    console.error('Reason:', error.message);
  });