const fs = require('fs');

const content = [
  'SUPABASE_URL=https://oepnkmmhxnvxowmydlox.supabase.co',
  'SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcG5rbW1oeG52eG93bXlkbG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2OTg1NTksImV4cCI6MjA3NjI3NDU1OX0.P9StsUVqKzb3a2fKb9DT1e59j3yQ3JeVwMYf7i7dV-I',
  'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcG5rbW1oeG52eG93bXlkbG94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5ODU1OSwiZXhwIjoyMDc2Mjc0NTU5fQ.PjYVluVxKicF1_tRZzf28YyPTJIoxJOt0VgJM9LRHbE',
  'PORT=3000',
  'CORS_ORIGIN=http://localhost:5173',
  'JWT_SECRET=tu-jwt-secret-super-seguro-aqui-cambiar-en-produccion',
  'OPENAI_API_KEY=tu-openai-api-key-aqui'
].join('\n');

fs.writeFileSync('.env', content, { encoding: 'utf8', flag: 'w' });
console.log('✅ .env escrito en UTF-8. Bytes:', Buffer.byteLength(content), 'Lines:', content.split('\n').length);
