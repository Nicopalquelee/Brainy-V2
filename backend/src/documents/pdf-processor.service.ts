import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import fetch from 'node-fetch';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfProcessorService {
  /**
   * Extrae el texto de un archivo PDF
   * @param filePath Ruta del archivo PDF
   * @returns Texto extraído del PDF
   */
  async extractTextFromPdf(filePath: string): Promise<string> {
    try {
      const pdfBuffer = await this.loadPdfBuffer(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('No se pudo procesar el archivo PDF');
    }
  }

  /**
   * Procesa múltiples PDFs y extrae su contenido
   * @param filePaths Array de rutas de archivos PDF
   * @returns Array de objetos con el contenido de cada PDF
   */
  async processMultiplePdfs(filePaths: string[]): Promise<Array<{
    filePath: string;
    content: string;
    pageCount: number;
  }>> {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        const pdfBuffer = await this.loadPdfBuffer(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        
        results.push({
          filePath,
          content: pdfData.text,
          pageCount: pdfData.numpages
        });
      } catch (error) {
        console.error(`Error processing PDF ${filePath}:`, error);
        // Continuar con otros archivos aunque uno falle
      }
    }
    
    return results;
  }

  /**
   * Divide el texto en chunks para evitar límites de tokens
   * @param text Texto a dividir
   * @param maxChunkSize Tamaño máximo de cada chunk
   * @returns Array de chunks de texto
   */
  splitTextIntoChunks(text: string, maxChunkSize: number = 4000): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Carga un PDF desde una ruta local o URL y devuelve su Buffer
   */
  private async loadPdfBuffer(filePathOrUrl: string): Promise<Buffer> {
    // Tratar URLs http/https
    if (/^https?:\/\//i.test(filePathOrUrl)) {
      const res = await fetch(filePathOrUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al descargar PDF: ${filePathOrUrl}`);
      }
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    }

    // Normalizar rutas que comienzan con '/uploads/...'
    let localPath = filePathOrUrl;
    if (filePathOrUrl.startsWith('/uploads/')) {
      // Remover el prefijo '/' y resolver respecto al cwd
      localPath = path.join(process.cwd(), filePathOrUrl.replace(/^\//, ''));
    } else if (filePathOrUrl.startsWith('uploads/')) {
      localPath = path.join(process.cwd(), filePathOrUrl);
    } else if (!path.isAbsolute(filePathOrUrl) && /\\|\//.test(filePathOrUrl)) {
      // Ruta relativa: resolver respecto al cwd
      localPath = path.join(process.cwd(), filePathOrUrl);
    }

    return readFile(localPath);
  }
}
