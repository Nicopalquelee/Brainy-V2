# 📦 Dependencias Necesarias para Conversión DOC/DOCX a PDF

## Instalación

Ejecuta estos comandos en la carpeta `backend`:

```bash
npm install mammoth pdfkit
npm install --save-dev @types/pdfkit
```

## Dependencias Instaladas

- **mammoth**: Para extraer texto y HTML de archivos DOCX
- **pdfkit**: Para generar archivos PDF desde el contenido extraído
- **@types/pdfkit**: Tipos TypeScript para pdfkit

## Notas

- `mammoth` solo funciona con archivos `.docx` (formato Office Open XML)
- Para archivos `.doc` antiguos (formato binario), se necesitaría una librería adicional o convertir primero a DOCX
- El servicio automáticamente detecta archivos DOC/DOCX y los convierte a PDF
- El archivo original se elimina después de la conversión exitosa

