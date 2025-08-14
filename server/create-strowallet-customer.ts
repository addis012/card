import { StrowalletService } from './strowallet';

// Create a Strowallet customer using the API
async function createStrowalletCustomer() {
  try {
    console.log('Creating Strowallet customer for kalkidan adamu...');
    
    const strowallet = new StrowalletService();
    
    const customerData = {
      public_key: 'pub_SkVqm5mglsqS1mOkoilo06HiobYqhdibn8UehMJf',
      firstName: 'kalkidan',
      lastName: 'adamu',
      customerEmail: 'addisumelke04@gmail.com',
      phoneNumber: '251911234567', // International format without +
      dateOfBirth: '01/15/1995', // mm/dd/yyyy format
      idNumber: 'ID123456789',
      idType: 'NIN', // National ID Number
      houseNumber: '123',
      line1: 'Main Street',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      zipCode: '1000',
      country: 'Ethiopia',
      idImage: 'https://example.com/id-image.jpg', // Replace with actual image URL
      userPhoto: 'https://example.com/user-photo.jpg' // Replace with actual photo URL
    };
    
    const result = await strowallet.createCustomer(customerData);
    
    if (result.success) {
      console.log('SUCCESS: Strowallet customer created!');
      console.log('Customer ID:', result.data.customer_id);
      console.log('Reference:', result.data.reference);
      return result.data;
    } else {
      console.log('FAILED:', result.message);
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error creating Strowallet customer:', error);
    throw error;
  }
}

// Execute the customer creation
createStrowalletCustomer()
  .then(customerData => {
    console.log('Customer creation successful');
    console.log(JSON.stringify(customerData, null, 2));
  })
  .catch(error => {
    console.error('Customer creation failed:', error.message);
  });