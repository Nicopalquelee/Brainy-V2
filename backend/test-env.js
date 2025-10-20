const dotenv = require('dotenv');
const path = require('path');

console.log('📁 Directorio actual:', process.cwd());
console.log('📄 Archivo .env esperado:', path.join(process.cwd(), '.env'));

const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
console.log('📄 Contenido del .env:');
console.log(envContent.substring(0, 200) + '...');

const result = dotenv.config();
console.log('🔧 Resultado de dotenv.config():', result.error ? result.error.message : 'OK');
console.log('🔧 Variables parseadas:', result.parsed ? Object.keys(result.parsed) : 'Ninguna');

console.log('🔍 Verificando variables de entorno...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Configurada' : 'Faltante');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Faltante');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Configurada' : 'Faltante');

if (process.env.SUPABASE_URL) {
  console.log('✅ URL:', process.env.SUPABASE_URL);
}
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Service Key primeros 20 chars:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}