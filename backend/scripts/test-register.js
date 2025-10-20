const fetch = require('node-fetch');

(async () => {
  const email = `test${Date.now()}@correo.uss.cl`;
  const body = { email, password: 'password123', name: 'Test User' };
  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Request failed:', e.message);
  }
})();
