// server/test-create-group.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const StudyGroup = require('./models/StudyGroups/StudyGroups');
const User = require('./models/User');

const testCreateGroup = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('Current directory:', __dirname);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);

    // Find a student user
    console.log('\n👤 Looking for a student user...');
    const user = await User.findOne({ role: 'student' });
    
    if (!user) {
      console.log('❌ No student user found.');
      
      // List all users to see what roles exist
      const allUsers = await User.find({});
      console.log('\n📋 Existing users:');
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
      });
      
      console.log('\n💡 Please create a student user through the registration page first.');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Found student user:', user.name);
    console.log('User ID:', user._id);
    console.log('User Role:', user.role);

    // Check existing groups
    const existingGroups = await StudyGroup.find({});
    console.log(`\n📊 Existing groups in database: ${existingGroups.length}`);
    if (existingGroups.length > 0) {
      console.log('Current groups:');
      existingGroups.forEach(g => {
        console.log(`- ${g.name} (Active: ${g.isActive})`);
      });
    }

    // Create a test group
    console.log('\n📝 Creating test study group...');
    const testGroup = new StudyGroup({
      name: `Test Group ${new Date().toLocaleTimeString()}`,
      description: 'This is a test group created to verify database connection',
      type: 'open',
      faculty: 'Computing',
      academicYear: 'Year 1',
      owner: user._id,
      members: [{
        user: user._id,
        status: 'approved',
        joinedAt: new Date()
      }],
      isActive: true
    });

    await testGroup.save();
    console.log('✅ Test group created successfully!');
    console.log('Group ID:', testGroup._id);
    console.log('Group Name:', testGroup.name);
    console.log('Is Active:', testGroup.isActive);

    // Verify the group was saved
    const verifyGroup = await StudyGroup.findById(testGroup._id);
    console.log('\n🔍 Verification:');
    console.log('Group exists in DB:', !!verifyGroup);
    
    if (verifyGroup) {
      console.log('Group details:');
      console.log(`- Name: ${verifyGroup.name}`);
      console.log(`- Active: ${verifyGroup.isActive}`);
      console.log(`- Members: ${verifyGroup.members.length}`);
      console.log(`- Created: ${verifyGroup.createdAt}`);
    }

    // Count all groups after creation
    const totalGroups = await StudyGroup.countDocuments();
    console.log(`\n📊 Total groups now in DB: ${totalGroups}`);

    // List all groups
    const allGroups = await StudyGroup.find({});
    console.log('\n📋 All groups in database:');
    allGroups.forEach(g => {
      console.log(`- ${g.name}`);
      console.log(`  ID: ${g._id}`);
      console.log(`  Active: ${g.isActive}`);
      console.log(`  Type: ${g.type}`);
      console.log(`  Faculty: ${g.faculty}`);
      console.log(`  Members: ${g.members.length}`);
      console.log('---');
    });

    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    await mongoose.disconnect();
  }
};

// Run the test
testCreateGroup();