import fetch from 'node-fetch';

(async () => {
  const base = 'http://localhost:3000/api/auth';
  const email = `test-${Date.now()}@correo.uss.cl`;
  const password = 'P@ssw0rd123456';
  try {
    // register
    let res = await fetch(`${base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Tester', role: 'student' })
    });
    let json = await res.json();
    console.log('register =>', json);
    if (json.error) process.exit(2);

    // login
    res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    json = await res.json();
    console.log('login =>', json);
    if (json.error) process.exit(3);
    process.exit(0);
  } catch (e: any) {
    console.error('Exception:', e?.message || e);
    process.exit(1);
  }
})();
