const fs = require('fs');

const content = [
  'SUPABASE_URL=REPLACE_WITH_YOUR_SUPABASE_URL',
  'SUPABASE_ANON_KEY=REPLACE_WITH_YOUR_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY',
  'PORT=3000',
  'CORS_ORIGIN=http://localhost:5173',
  'JWT_SECRET=REPLACE_WITH_JWT_SECRET',
  'OPENAI_API_KEY=REPLACE_WITH_OPENAI_KEY'
].join('\n');

fs.writeFileSync('.env', content, { encoding: 'utf8', flag: 'w' });
console.log('✅ .env escrito (placeholders). Actualiza .env con tus valores privados y no los comites.');
