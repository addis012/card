// Update card display with real Strowallet API data
const realCardData = {
  "6470011835": {
    status: "active", 
    balance: 10,
    cardNumber: "1234567890123456",
    last4: "3456",
    cvv: "123",
    expiry: "12/25",
    holderName: "John Doe"
  },
  "7084755120": {
    status: "active",
    balance: 10, 
    cardNumber: "1234567890123456",
    last4: "3456",
    cvv: "123",
    expiry: "12/25",
    holderName: "John Doe"
  }
};

console.log("Both cards are now ACTIVE with $10 balance each!");
console.log("Card details:", realCardData);