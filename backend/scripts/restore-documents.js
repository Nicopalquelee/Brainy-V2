const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'acaduss_user',
  password: 'acaduss_password_2024',
  database: 'acaduss_db'
});

async function restoreDocuments() {
  try {
    await client.connect();
    console.log('Conectado a la base de datos');

    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'document'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('La tabla document no existe. Creando...');
      await client.query(`
        CREATE TABLE document (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          subject VARCHAR(255) NOT NULL,
          description TEXT,
          filename VARCHAR(255) NOT NULL,
          filepath VARCHAR(500) NOT NULL,
          filetype VARCHAR(50),
          filesize INTEGER,
          rating DECIMAL(3,2) DEFAULT 0,
          visits INTEGER DEFAULT 0,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // Verificar si hay documentos
    const docCount = await client.query('SELECT COUNT(*) FROM document');
    console.log(`Documentos existentes: ${docCount.rows[0].count}`);

    if (parseInt(docCount.rows[0].count) === 0) {
      console.log('Insertando documentos de ejemplo...');
      
      const documents = [
        {
          title: 'Apuntes de Programación I',
          subject: 'Introducción a la Programación',
          description: 'Fundamentos básicos de programación usando Python',
          filename: '1758704509779.pdf',
          filepath: '/uploads/1758704509779.pdf',
          filetype: 'application/pdf',
          filesize: 1024000,
          rating: 4.5,
          visits: 25
        },
        {
          title: 'Matemáticas Discretas - Teoría',
          subject: 'Matemáticas Discretas I',
          description: 'Lógica, conjuntos, relaciones y funciones',
          filename: '1758705483071.pdf',
          filepath: '/uploads/1758705483071.pdf',
          filetype: 'application/pdf',
          filesize: 2048000,
          rating: 4.2,
          visits: 18
        },
        {
          title: 'Álgebra Lineal - Ejercicios',
          subject: 'Álgebra Lineal',
          description: 'Vectores, matrices y sistemas lineales',
          filename: '1758705628318.pdf',
          filepath: '/uploads/1758705628318.pdf',
          filetype: 'application/pdf',
          filesize: 1536000,
          rating: 4.0,
          visits: 32
        },
        {
          title: 'Estructuras de Datos - Algoritmos',
          subject: 'Estructuras de Datos',
          description: 'Listas, pilas, colas, árboles y grafos',
          filename: '1758706720563.pdf',
          filepath: '/uploads/1758706720563.pdf',
          filetype: 'application/pdf',
          filesize: 3072000,
          rating: 4.8,
          visits: 45
        },
        {
          title: 'Base de Datos - SQL Avanzado',
          subject: 'Base de Datos I',
          description: 'Diseño relacional y SQL',
          filename: '1758707055982.pdf',
          filepath: '/uploads/1758707055982.pdf',
          filetype: 'application/pdf',
          filesize: 2560000,
          rating: 4.3,
          visits: 28
        }
      ];

      for (const doc of documents) {
        await client.query(`
          INSERT INTO document (title, subject, description, filename, filepath, filetype, filesize, rating, visits)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          doc.title,
          doc.subject,
          doc.description,
          doc.filename,
          doc.filepath,
          doc.filetype,
          doc.filesize,
          doc.rating,
          doc.visits
        ]);
      }

      console.log('Documentos restaurados exitosamente');
    } else {
      console.log('Los documentos ya existen en la base de datos');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

restoreDocuments();
