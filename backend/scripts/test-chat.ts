import 'dotenv/config';
import fetch from 'node-fetch';

async function main() {
  const base = process.env.TEST_API_BASE || 'http://localhost:3000/api';
  const res = await fetch(`${base}/chat/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Resume en una frase el contenido de mis PDFs.' })
  });
  const json = await res.json();
  console.log('[chat/query] status:', res.status);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
