import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { createWriteStream } from 'fs';
import * as mammoth from 'mammoth';
const PDFDocument = require('pdfkit');

@Injectable()
export class DocConverterService {
  /**
   * Convierte un archivo DOC/DOCX a PDF
   * @param inputPath Ruta del archivo DOC/DOCX original
   * @returns Ruta del archivo PDF generado
   */
  async convertDocToPdf(inputPath: string): Promise<string> {
    try {
      // Leer el archivo
      const buffer = await readFile(inputPath);
      
      // Verificar si es DOCX (mammoth solo soporta DOCX)
      const isDocx = inputPath.toLowerCase().endsWith('.docx') || 
                     buffer[0] === 0x50 && buffer[1] === 0x4B; // ZIP signature (DOCX es un ZIP)
      
      if (!isDocx && inputPath.toLowerCase().endsWith('.doc')) {
        throw new Error('Los archivos .doc antiguos no son soportados. Por favor, convierte el archivo a .docx primero.');
      }
      
      // Extraer texto y HTML del DOCX usando mammoth
      const result = await mammoth.extractRawText({ buffer });
      const htmlResult = await mammoth.convertToHtml({ buffer });
      
      const text = result.value;
      const html = htmlResult.value;
      
      // Si no hay texto extraído, intentar usar HTML
      const contentToUse = text.trim() || this.extractTextFromHtml(html);
      
      if (!contentToUse) {
        throw new Error('No se pudo extraer contenido del documento');
      }
      
      // Generar nombre del archivo PDF
      const pdfPath = inputPath.replace(/\.(doc|docx)$/i, '.pdf');
      
      // Crear PDF con el contenido extraído
      await this.createPdfFromContent(contentToUse, html, pdfPath);
      
      return pdfPath;
    } catch (error) {
      console.error('Error converting DOC/DOCX to PDF:', error);
      throw new Error(`Error al convertir documento a PDF: ${error.message}`);
    }
  }

  /**
   * Extrae texto simple del HTML
   */
  private extractTextFromHtml(html: string): string {
    // Remover tags HTML y obtener texto
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Crea un PDF a partir del texto y HTML extraído
   */
  private async createPdfFromContent(text: string, html: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          size: 'A4'
        });

        const stream = createWriteStream(outputPath);
        doc.pipe(stream);

        // Procesar el texto y agregarlo al PDF
        const lines = text.split('\n');
        let yPosition = 50;
        const pageHeight = 792; // A4 height in points
        const margin = 50;
        const lineHeight = 15;
        const maxWidth = 495; // A4 width - margins

        lines.forEach((line, index) => {
          // Verificar si necesitamos una nueva página
          if (yPosition > pageHeight - margin - lineHeight) {
            doc.addPage();
            yPosition = margin;
          }

          // Limpiar el texto de caracteres especiales que pueden causar problemas
          const cleanLine = line.trim();
          if (cleanLine) {
            // Detectar títulos (líneas cortas, mayúsculas, o con formato especial)
            const isTitle = cleanLine.length < 100 && (
              /^[A-ZÁÉÍÓÚÑ\s]+$/.test(cleanLine) ||
              cleanLine.startsWith('#') ||
              /^\d+\.\s/.test(cleanLine)
            );

            if (isTitle) {
              doc.fontSize(14).font('Helvetica-Bold');
            } else {
              doc.fontSize(11).font('Helvetica');
            }

            // Dividir líneas largas
            const words = cleanLine.split(' ');
            let currentLine = '';
            
            words.forEach((word) => {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const width = doc.widthOfString(testLine);
              
              if (width > maxWidth && currentLine) {
                doc.text(currentLine, margin, yPosition, { width: maxWidth });
                yPosition += lineHeight;
                currentLine = word;
                
                // Nueva página si es necesario
                if (yPosition > pageHeight - margin - lineHeight) {
                  doc.addPage();
                  yPosition = margin;
                }
              } else {
                currentLine = testLine;
              }
            });
            
            if (currentLine) {
              doc.text(currentLine, margin, yPosition, { width: maxWidth });
              yPosition += lineHeight;
            }
            
            // Espacio adicional después de títulos
            if (isTitle) {
              yPosition += 5;
            }
          } else {
            // Línea vacía
            yPosition += lineHeight;
          }
        });

        doc.end();
        
        stream.on('finish', () => {
          resolve();
        });
        
        stream.on('error', (err: Error) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Verifica si un archivo es DOC o DOCX
   */
  isDocFile(mimetype: string, filename: string): boolean {
    const docMimeTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const docExtensions = ['.doc', '.docx'];
    
    const hasDocMimeType = docMimeTypes.includes(mimetype);
    const hasDocExtension = docExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
    
    return hasDocMimeType || hasDocExtension;
  }
}

