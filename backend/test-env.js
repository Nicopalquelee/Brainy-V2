const dotenv = require('dotenv');
const path = require('path');

console.log('📁 Directorio actual:', process.cwd());
console.log('📄 Archivo .env esperado:', path.join(process.cwd(), '.env'));

const fs = require('fs');
let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
} catch (e) {
  // ignore if no .env present
}
console.log('📄 .env encontrado:', envContent ? 'Sí (contenido no mostrado)' : 'No');

const result = dotenv.config();
console.log('🔧 Resultado de dotenv.config():', result.error ? result.error.message : 'OK');
console.log('🔧 Variables parseadas:', result.parsed ? Object.keys(result.parsed) : 'Ninguna');

console.log('🔍 Verificando variables de entorno...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'Faltante');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Faltante');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Configurada' : 'Faltante');

if (process.env.SUPABASE_URL) {
  console.log('✅ SUPABASE_URL: (configured)');
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY: (configured, redacted)');
}