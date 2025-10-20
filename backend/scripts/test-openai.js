const { OpenAI } = require('openai');

// Script para probar la conexión con OpenAI
async function testOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No se encontró OPENAI_API_KEY en las variables de entorno');
    console.log('💡 Crea un archivo .env en el directorio backend con:');
    console.log('OPENAI_API_KEY=tu_api_key_aqui');
    process.exit(1);
  }

  console.log('🔑 API Key encontrada, probando conexión...');
  
  try {
    const openai = new OpenAI({ apiKey });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente académico. Responde brevemente.'
        },
        {
          role: 'user',
          content: '¿Qué es Python?'
        }
      ],
      max_tokens: 100
    });

    console.log('✅ Conexión exitosa con OpenAI!');
    console.log('📝 Respuesta de prueba:', completion.choices[0]?.message?.content);
    console.log('💰 Tokens usados:', completion.usage?.total_tokens);
    
  } catch (error) {
    console.error('❌ Error al conectar con OpenAI:', error.message);
    process.exit(1);
  }
}

testOpenAI();
