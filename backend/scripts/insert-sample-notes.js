const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

async function insertSampleNotes() {
  const client = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  });

  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar si ya existen apuntes
    const res = await client.query('SELECT COUNT(*) FROM document');
    const documentCount = parseInt(res.rows[0].count, 10);
    console.log('Documentos existentes:', documentCount);

    if (documentCount > 0) {
      console.log('Ya existen documentos en la base de datos. ¿Deseas continuar? (S/N)');
      // En un entorno real, aquí podrías pedir confirmación al usuario
      console.log('Continuando con la inserción...');
    }

    console.log('Insertando apuntes de ejemplo...');
    
    const sampleNotes = [
      // 1er Año - Semestre I
      {
        title: 'Introducción al Cálculo - Límites y Continuidad',
        subject: 'Introducción al Cálculo',
        description: 'Apuntes completos sobre límites, continuidad y sus aplicaciones en cálculo diferencial',
        rating: 4.5,
        author: 'Prof. María González',
        visits: 156,
        contentUrl: '/uploads/intro_calculo_limites.pdf'
      },
      {
        title: 'Álgebra Lineal - Vectores y Matrices',
        subject: 'Álgebra',
        description: 'Fundamentos de álgebra lineal: operaciones con vectores, matrices y determinantes',
        rating: 4.2,
        author: 'Prof. Carlos Ruiz',
        visits: 134,
        contentUrl: '/uploads/algebra_vectores_matrices.pdf'
      },
      {
        title: 'Taller de Aptitudes Lógicas - Ejercicios Resueltos',
        subject: 'Taller de Aptitudes Lógicas y Matemáticas',
        description: 'Colección de ejercicios resueltos para desarrollar habilidades lógicas y matemáticas',
        rating: 4.8,
        author: 'Prof. Ana Martínez',
        visits: 89,
        contentUrl: '/uploads/taller_aptitudes_logicas.pdf'
      },
      {
        title: 'Programación I - Python Básico',
        subject: 'Taller de Programación I',
        description: 'Introducción a la programación con Python: variables, estructuras de control y funciones',
        rating: 4.6,
        author: 'Prof. Roberto Silva',
        visits: 203,
        contentUrl: '/uploads/programacion_python_basico.pdf'
      },
      {
        title: 'Ingeniería Informática - Historia y Perspectivas',
        subject: 'Introducción a la Ingeniería Informática',
        description: 'Evolución de la ingeniería informática, áreas de aplicación y perspectivas futuras',
        rating: 4.1,
        author: 'Prof. Elena Vargas',
        visits: 78,
        contentUrl: '/uploads/ingenieria_informatica_historia.pdf'
      },

      // 1er Año - Semestre II
      {
        title: 'Cálculo Diferencial - Derivadas y Aplicaciones',
        subject: 'Cálculo Diferencial e Integral',
        description: 'Derivadas, reglas de derivación y aplicaciones en optimización',
        rating: 4.4,
        author: 'Prof. Miguel Torres',
        visits: 167,
        contentUrl: '/uploads/calculo_diferencial_derivadas.pdf'
      },
      {
        title: 'Álgebra Lineal - Espacios Vectoriales',
        subject: 'Álgebra Lineal',
        description: 'Espacios vectoriales, bases, dimensión y transformaciones lineales',
        rating: 4.3,
        author: 'Prof. Laura Jiménez',
        visits: 112,
        contentUrl: '/uploads/algebra_espacios_vectoriales.pdf'
      },
      {
        title: 'Química General - Estructura Atómica',
        subject: 'Química General',
        description: 'Fundamentos de química: estructura atómica, enlaces químicos y tabla periódica',
        rating: 4.0,
        author: 'Prof. Diego Herrera',
        visits: 95,
        contentUrl: '/uploads/quimica_estructura_atomica.pdf'
      },
      {
        title: 'Programación II - POO en Java',
        subject: 'Taller de Programación II',
        description: 'Programación orientada a objetos: clases, herencia, polimorfismo y encapsulación',
        rating: 4.7,
        author: 'Prof. Patricia López',
        visits: 189,
        contentUrl: '/uploads/programacion_poo_java.pdf'
      },

      // 2do Año - Semestre III
      {
        title: 'Cálculo Multivariable - Funciones de Varias Variables',
        subject: 'Cálculo Multivariable',
        description: 'Límites, continuidad, derivadas parciales y gradientes en funciones multivariables',
        rating: 4.5,
        author: 'Prof. Fernando Castro',
        visits: 145,
        contentUrl: '/uploads/calculo_multivariable.pdf'
      },
      {
        title: 'Física - Mecánica Clásica',
        subject: 'Física',
        description: 'Leyes de Newton, cinemática, dinámica y conservación de la energía',
        rating: 4.2,
        author: 'Prof. Carmen Díaz',
        visits: 128,
        contentUrl: '/uploads/fisica_mecanica_clasica.pdf'
      },
      {
        title: 'Tecnologías Digitales - Sistemas Numéricos',
        subject: 'Taller de Tecnologías Digitales',
        description: 'Sistemas de numeración, álgebra booleana y circuitos lógicos',
        rating: 4.6,
        author: 'Prof. Andrés Morales',
        visits: 98,
        contentUrl: '/uploads/tecnologias_digitales_sistemas.pdf'
      },
      {
        title: 'Paradigmas de Programación - Funcional vs Imperativo',
        subject: 'Paradigmas de Programación',
        description: 'Comparación entre programación funcional e imperativa con ejemplos prácticos',
        rating: 4.4,
        author: 'Prof. Isabel Ramírez',
        visits: 156,
        contentUrl: '/uploads/paradigmas_programacion.pdf'
      },

      // 2do Año - Semestre IV
      {
        title: 'Ecuaciones Diferenciales - Métodos de Solución',
        subject: 'Ecuaciones Diferenciales',
        description: 'Ecuaciones diferenciales ordinarias, métodos analíticos y numéricos',
        rating: 4.3,
        author: 'Prof. Gabriel Ortega',
        visits: 134,
        contentUrl: '/uploads/ecuaciones_diferenciales.pdf'
      },
      {
        title: 'Electricidad y Magnetismo - Leyes Fundamentales',
        subject: 'Electricidad y Magnetismo',
        description: 'Ley de Coulomb, campo eléctrico, ley de Gauss y magnetismo',
        rating: 4.1,
        author: 'Prof. Valeria Sánchez',
        visits: 107,
        contentUrl: '/uploads/electricidad_magnetismo.pdf'
      },
      {
        title: 'Probabilidades y Estadísticas - Distribuciones',
        subject: 'Probabilidades y Estadísticas',
        description: 'Distribuciones de probabilidad, estadística descriptiva e inferencial',
        rating: 4.5,
        author: 'Prof. Nicolás Vega',
        visits: 142,
        contentUrl: '/uploads/probabilidades_estadisticas.pdf'
      },
      {
        title: 'Matemática Discreta - Teoría de Grafos',
        subject: 'Matemática Discreta',
        description: 'Grafos, árboles, algoritmos de recorrido y aplicaciones en computación',
        rating: 4.7,
        author: 'Prof. Sofía Mendoza',
        visits: 118,
        contentUrl: '/uploads/matematica_discreta_grafos.pdf'
      },
      {
        title: 'Sustentabilidad - Impacto Ambiental de la Tecnología',
        subject: 'Taller de Sustentabilidad',
        description: 'Desarrollo sostenible, huella de carbono y tecnologías verdes',
        rating: 4.0,
        author: 'Prof. Ricardo Flores',
        visits: 89,
        contentUrl: '/uploads/sustentabilidad_impacto_ambiental.pdf'
      },

      // 3er Año - Semestre V
      {
        title: 'Estadística Avanzada - Análisis de Datos',
        subject: 'Estadística Avanzada',
        description: 'Análisis estadístico avanzado, regresión, correlación y pruebas de hipótesis',
        rating: 4.6,
        author: 'Prof. Alejandra Campos',
        visits: 167,
        contentUrl: '/uploads/estadistica_avanzada_analisis.pdf'
      },
      {
        title: 'Optimización - Programación Lineal',
        subject: 'Optimización',
        description: 'Métodos de optimización, programación lineal y algoritmos de optimización',
        rating: 4.4,
        author: 'Prof. Marcelo Rojas',
        visits: 123,
        contentUrl: '/uploads/optimizacion_programacion_lineal.pdf'
      },
      {
        title: 'Algoritmos y Estructuras de Datos - Complejidad',
        subject: 'Algoritmos y Estructura de Datos',
        description: 'Análisis de complejidad, estructuras de datos avanzadas y algoritmos de ordenamiento',
        rating: 4.8,
        author: 'Prof. Claudia Peña',
        visits: 201,
        contentUrl: '/uploads/algoritmos_estructuras_datos.pdf'
      }
    ];

    // Insertar cada apunte
    for (const note of sampleNotes) {
      const insertQuery = `
        INSERT INTO document (title, subject, description, rating, author, visits, "contentUrl", "createdAt", "updatedAt", "isActive") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), TRUE)
        ON CONFLICT (id) DO NOTHING
      `;
      
      await client.query(insertQuery, [
        note.title,
        note.subject,
        note.description,
        note.rating,
        note.author,
        note.visits,
        note.contentUrl
      ]);
    }

    console.log(`${sampleNotes.length} apuntes de ejemplo insertados exitosamente.`);
    
  } catch (err) {
    console.error('Error al insertar apuntes:', err);
  } finally {
    await client.end();
  }
}

insertSampleNotes();
