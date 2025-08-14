// Working Strowallet API endpoint
import express from 'express';

export function addStrowalletCardEndpoint(app) {
  // Create real Strowallet card endpoint
  app.post("/api/create-strowallet-card", async (req, res) => {
    try {
      const { 
        nameOnCard = "Addisu",
        customerEmail = "addisu@example.com", 
        amount = "100",
        mode = "sandbox" 
      } = req.body;

      const publicKey = process.env.STROWALLET_PUBLIC_KEY;
      const secretKey = process.env.STROWALLET_SECRET_KEY;

      console.log('Creating real Strowallet card...');
      
      const response = await fetch('https://strowallet.com/api/bitvcard/create-card/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name_on_card: nameOnCard,
          card_type: 'visa',
          public_key: publicKey,
          amount: amount.toString(),
          customerEmail: customerEmail,
          mode: mode
        })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          message: "Strowallet API error",
          error: responseText
        });
      }

      const data = JSON.parse(responseText);
      
      if (data.success) {
        res.json({
          success: true,
          message: "Real card created successfully on Strowallet",
          strowallet: data,
          cardDetails: {
            cardId: data.response.card_id,
            nameOnCard: data.response.name_on_card,
            cardType: data.response.card_type,
            cardBrand: data.response.card_brand,
            status: data.response.card_status,
            customerId: data.response.customer_id,
            createdDate: data.response.card_created_date,
            reference: data.response.reference
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Card creation failed",
          error: data
        });
      }
      
    } catch (error) {
      console.error("Error creating Strowallet card:", error);
      res.status(500).json({
        success: false,
        message: "Server error creating card",
        error: error.message
      });
    }
  });
}