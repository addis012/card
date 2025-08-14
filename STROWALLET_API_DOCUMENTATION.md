
# Strowallet API Integration Documentation

## Overview

This document provides comprehensive documentation for integrating with the Strowallet API for card management operations. The API supports both sandbox and production modes, with webhook integration for real-time notifications.

## Base URL
```
https://strowallet.com/api/bitvcard/
```

## Authentication

All requests require authentication using:
- **Authorization Header**: `Bearer {STROWALLET_SECRET_KEY}`
- **Public Key**: Passed in request body or as `X-Public-Key` header

## Environment Variables Required

```bash
STROWALLET_PUBLIC_KEY=your_public_key_here
STROWALLET_SECRET_KEY=your_secret_key_here
```

## API Endpoints

### 1. Create Customer

Creates a new customer profile in Strowallet.

**Endpoint**: `POST /api/bitvcard/create-user/`

**Request Body**:
```json
{
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG",
  "firstName": "John",
  "lastName": "Doe",
  "customerEmail": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "01/15/1990",
  "idNumber": "123456789",
  "idType": "PASSPORT",
  "idImage": "https://example.com/id-image.jpg",
  "userPhoto": "https://example.com/user-photo.jpg",
  "line1": "123 Main Street",
  "houseNumber": "123",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "US"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Customer created successfully",
  "customer_id": "customer_uuid_here"
}
```

### 2. Get Customer Details

Retrieves customer information by ID or email.

**Endpoint**: `GET /api/bitvcard/getcardholder/`

**Query Parameters**:
- `public_key` (required): Strowallet public key
- `customerId` (optional): Customer ID
- `customerEmail` (optional): Customer email

**Example**:
```bash
GET /api/bitvcard/getcardholder/?public_key=VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG&customerId=customer_uuid
```

### 3. Update Customer

Updates existing customer information.

**Endpoint**: `PUT /api/bitvcard/updateCardCustomer/`

**Request Body**:
```json
{
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG",
  "customerId": "customer_uuid",
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890",
  "city": "Los Angeles",
  "state": "CA"
}
```

### 4. Create New Card

Creates a virtual card for a customer.

**Endpoint**: `POST /api/bitvcard/create-card/`

**Request Body**:
```json
{
  "name_on_card": "John Doe",
  "card_type": "visa",
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG",
  "amount": "100",
  "customerEmail": "john.doe@example.com",
  "mode": "sandbox"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Card created successfully",
  "response": {
    "card_id": "6470011835",
    "card_number": "4532********1234",
    "expiry_month": "12",
    "expiry_year": "28",
    "cvv": "123",
    "name_on_card": "John Doe",
    "card_type": "visa",
    "card_brand": "visa",
    "card_status": "active",
    "balance": "100.00",
    "customer_id": "customer_uuid",
    "card_created_date": "2025-01-15",
    "reference": "78467",
    "card_user_id": "card_user_uuid"
  }
}
```

### 5. Fund Card

Adds funds to an existing card.

**Endpoint**: `POST /api/bitvcard/fund-card/`

**Request Body**:
```json
{
  "card_id": "6470011835",
  "amount": "50",
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG",
  "mode": "sandbox"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Card funded successfully",
  "new_balance": "150.00",
  "transaction_id": "txn_uuid"
}
```

### 6. Get Card Details

Retrieves detailed information about a specific card.

**Endpoint**: `POST /api/bitvcard/fetch-card-detail/`

**Request Body**:
```json
{
  "card_id": "6470011835",
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG",
  "mode": "sandbox"
}
```

**Response**:
```json
{
  "success": true,
  "response": {
    "card_detail": {
      "card_id": "6470011835",
      "card_number": "4532********1234",
      "expiry": "12/28",
      "cvv": "123",
      "card_holder_name": "John Doe",
      "card_status": "active",
      "balance": 150.00,
      "customer_id": "customer_uuid",
      "card_created_date": "2025-01-15"
    }
  }
}
```

### 7. Get Card Transactions

Retrieves transaction history for a specific card.

**Endpoint**: `POST /api/bitvcard/card-transactions/`

**Request Body**:
```json
{
  "card_id": "6470011835",
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG",
  "mode": "sandbox"
}
```

**Response**:
```json
{
  "success": true,
  "response": {
    "card_transactions": [
      {
        "id": "txn_001",
        "amount": "-25.00",
        "type": "debit",
        "narrative": "Online purchase",
        "status": "success",
        "currency": "USD",
        "createdAt": "2025-01-15T10:30:00Z",
        "cardBalanceAfter": "125.00"
      }
    ]
  }
}
```

### 8. Freeze/Unfreeze Card

Controls card status - freeze or unfreeze.

**Endpoint**: `POST /api/bitvcard/action/status/`

**Request Body**:
```json
{
  "action": "freeze",
  "card_id": "6470011835",
  "public_key": "VN21ZNMSYCOOJK56TA1KHCRE2ZTMWG"
}
```

**Actions**:
- `freeze`: Blocks the card
- `unfreeze`: Activates the card

### 9. Full Card History

Gets paginated transaction history.

**Endpoint**: `GET /api/apicard-transactions/`

**Query Parameters**:
- `card_id` (required): Card ID
- `page` (required): Page number (default: 1)
- `take` (required): Items per page (max: 50, default: 50)
- `public_key` (required): Public key

## Integration Examples

### Node.js/Express Integration

```javascript
// Create card example
app.post('/api/create-strowallet-card', async (req, res) => {
  try {
    const { nameOnCard, customerEmail, amount } = req.body;
    
    const response = await fetch('https://strowallet.com/api/bitvcard/create-card/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STROWALLET_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name_on_card: nameOnCard,
        card_type: 'visa',
        public_key: process.env.STROWALLET_PUBLIC_KEY,
        amount: amount.toString(),
        customerEmail: customerEmail,
        mode: 'sandbox' // Remove for production
      })
    });

    const data = await response.json();
    
    if (data.success) {
      res.json({
        success: true,
        card: data.response
      });
    } else {
      res.status(400).json({
        success: false,
        error: data.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Webhook Integration

Strowallet sends real-time notifications to your webhook endpoint.

**Webhook URL**: `https://your-domain.com/api/webhook/strowallet`

**Webhook Events**:
- `card.created`: New card created
- `card.funded`: Card funded
- `transaction.created`: New transaction
- `card.blocked`: Card frozen
- `card.unblocked`: Card unfrozen

**Webhook Payload Example**:
```json
{
  "event_type": "card.created",
  "card_id": "6470011835",
  "customer_id": "customer_uuid",
  "card_number": "4532********1234",
  "amount": "100.00",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

**Webhook Handler Example**:
```javascript
app.post('/api/webhook/strowallet', (req, res) => {
  const { event_type, card_id, amount } = req.body;
  
  switch (event_type) {
    case 'card.created':
      console.log(`Card ${card_id} created successfully`);
      break;
    case 'card.funded':
      console.log(`Card ${card_id} funded with ${amount}`);
      break;
    case 'transaction.created':
      console.log(`New transaction on card ${card_id}`);
      break;
  }
  
  res.status(200).json({ message: 'Webhook received' });
});
```

## Testing with Sandbox Mode

For development and testing, use `mode: "sandbox"` in all requests. Sandbox cards:
- Don't deduct real funds
- Allow unlimited testing
- Use test card numbers
- Generate mock transactions

## Production Considerations

1. **Remove sandbox mode**: Omit the `mode` parameter for production
2. **Secure credentials**: Store API keys in environment variables
3. **Error handling**: Implement comprehensive error handling
4. **Rate limiting**: Respect API rate limits
5. **Webhook security**: Verify webhook signatures
6. **SSL/HTTPS**: Use secure connections only

## Error Codes

Common error responses:

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Invalid API keys
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Strowallet server error

## Support

For API support and questions:
- Documentation: https://strowallet.com/docs
- Support: Contact Strowallet support team
