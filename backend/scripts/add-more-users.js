const axios = require('axios');

async function createAndJoinUser(email, password, fullName, phoneNumber, sessionId) {
  try {
    // Create user
    const signupRes = await axios.post('http://localhost:5001/api/auth/signup', {
      email,
      password,
      full_name: fullName,
      phone_number: phoneNumber
    });
    console.log(`✓ Created: ${fullName}`);

    const token = signupRes.data.token;

    // Join session
    await axios.post(`http://localhost:5001/api/sessions/${sessionId}/join`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`  ✓ Joined session ${sessionId}\n`);
    return true;
  } catch (err) {
    console.error(`✗ Error for ${fullName}:`, err.response?.data?.error || err.message, '\n');
    return false;
  }
}

async function addTestUsers() {
  const users = [
    { email: 'arjun@example.com', password: 'password123', fullName: 'Arjun Verma', phoneNumber: '+919876543215' },
    { email: 'sneha@example.com', password: 'password123', fullName: 'Sneha Reddy', phoneNumber: '+919876543216' },
    { email: 'rohan@example.com', password: 'password123', fullName: 'Rohan Mehta', phoneNumber: '+919876543217' },
    { email: 'ananya@example.com', password: 'password123', fullName: 'Ananya Kapoor', phoneNumber: '+919876543218' },
    { email: 'karan@example.com', password: 'password123', fullName: 'Karan Joshi', phoneNumber: '+919876543219' },
    { email: 'ishita@example.com', password: 'password123', fullName: 'Ishita Nair', phoneNumber: '+919876543220' },
    { email: 'siddharth@example.com', password: 'password123', fullName: 'Siddharth Rao', phoneNumber: '+919876543221' },
    { email: 'riya@example.com', password: 'password123', fullName: 'Riya Desai', phoneNumber: '+919876543222' },
    { email: 'aditya@example.com', password: 'password123', fullName: 'Aditya Malhotra', phoneNumber: '+919876543223' },
    { email: 'kavya@example.com', password: 'password123', fullName: 'Kavya Iyer', phoneNumber: '+919876543224' }
  ];

  let successCount = 0;
  for (const user of users) {
    const result = await createAndJoinUser(user.email, user.password, user.fullName, user.phoneNumber, 6);
    if (result) successCount++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`✓ Successfully added ${successCount} out of ${users.length} users to session 6`);
}

addTestUsers().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
