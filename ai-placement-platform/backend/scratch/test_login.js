const API_URL = 'http://localhost:5000/api/auth';

async function runTest() {
  try {
    console.log('--- Testing Login with test@gmail.com ---');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@gmail.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', loginData);

    if (loginData.success && loginData.token) {
      console.log('\n✅ Login test PASSED');
    } else {
      console.log('\n❌ Login test FAILED');
    }
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  }
}

runTest();
