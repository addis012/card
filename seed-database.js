import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  kycStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  kycDocuments: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'administrator',
      password: adminPassword,
      email: 'admin@cardflow.com',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      kycStatus: 'approved'
    });
    await admin.save();
    console.log('Created admin user: administrator / admin123');

    // Create test user
    const userPassword = await bcrypt.hash('test123', 10);
    const user = new User({
      username: 'testuser',
      password: userPassword,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'user',
      kycStatus: 'approved'
    });
    await user.save();
    console.log('Created test user: testuser / test123');

    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin Login: administrator / admin123');
    console.log('User Login: testuser / test123');
    console.log('========================\n');

    await mongoose.disconnect();
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();