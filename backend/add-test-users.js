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
    console.log(`Created user: ${fullName} (${email})`);

    const token = signupRes.data.token;

    // Join session
    await axios.post(`http://localhost:5001/api/sessions/${sessionId}/join`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`  Joined session ${sessionId}`);

  } catch (err) {
    console.error(`Error for ${fullName}:`, err.response?.data?.error || err.message);
  }
}

async function addTestUsers() {
  const users = [
    { email: 'priya@example.com', password: 'password123', fullName: 'Priya Sharma', phoneNumber: '+919876543211' },
    { email: 'amit@example.com', password: 'password123', fullName: 'Amit Singh', phoneNumber: '+919876543212' },
    { email: 'neha@example.com', password: 'password123', fullName: 'Neha Gupta', phoneNumber: '+919876543213' },
    { email: 'vikram@example.com', password: 'password123', fullName: 'Vikram Patel', phoneNumber: '+919876543214' }
  ];

  for (const user of users) {
    await createAndJoinUser(user.email, user.password, user.fullName, user.phoneNumber, 6);
  }

  console.log('\nAll test users created and added to session 6');
}

addTestUsers();
