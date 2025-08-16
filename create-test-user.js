import bcrypt from 'bcrypt';

async function createTestUser() {
  // Hash the password "test123"
  const hashedPassword = await bcrypt.hash("test123", 10);
  console.log("Hashed password for 'test123':", hashedPassword);
  
  // Test user data
  const testUserData = {
    username: "testuser",
    password: hashedPassword,
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    phone: "+1234567890",
    role: "user",
    kycStatus: "approved"
  };
  
  // Create user via API
  const response = await fetch('http://localhost:5000/api/auth/register-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUserData)
  });
  
  const result = await response.text();
  console.log("User creation response:", result);
}

createTestUser().catch(console.error);