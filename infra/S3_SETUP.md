# Configuración de AWS S3 para archivos de Brainy

## 1. Crear el bucket en AWS

1. Ingresa a la consola de AWS → S3 → **Create bucket**.
2. Nombre sugerido: `brainy-uploads-prod`.
3. Región: la misma que uses en Render (ej: `us-east-1`).
4. Desactiva “Block all public access” **solo si** quieres objetos públicos. Recomendado dejarlo activado y servir los PDFs mediante URLs firmadas.
5. Crea el bucket.

## 2. Credenciales IAM

1. Crea un usuario IAM con acceso programático (Access key + Secret).
2. Asígnale una política que permita `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` sobre el bucket.
3. Guarda las credenciales (se usarán en Render).

## 3. Variables de entorno (Render)

Agrega en tu servicio backend:

```
AWS_REGION=us-east-1
AWS_S3_BUCKET=brainy-uploads-prod
AWS_ACCESS_KEY_ID=XXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXX
# Opcional: si prefieres usar un dominio propio/CDN
AWS_S3_PUBLIC_URL=https://brainy-uploads-prod.s3.amazonaws.com
```

> **Nota:** Si no defines `AWS_S3_PUBLIC_URL`, el backend generará automáticamente una URL estándar (`https://<bucket>.s3.<region>.amazonaws.com/<key>`).

## 4. Dependencias y código

El backend ya incluye:

- `@aws-sdk/client-s3` para subir archivos.
- `backend/src/config/s3.ts` para centralizar el cliente.
- `DocumentsController` que:
  - Recibe el archivo con Multer (disco temporal).
  - Convierte DOC/DOCX a PDF (si aplica).
  - Sube el archivo final a S3.
  - Limpia los archivos temporales.
  - Guarda en la base la URL del objeto en S3.

No se exponen archivos desde `uploads/` en el servidor. Todo se sirve desde S3.

## 5. Conversión DOC → PDF

- La conversión se hace localmente (en `/uploads` temporal).
- Tras convertir a PDF, **sólo** el PDF se sube al bucket.
- Los archivos temporales se eliminan automáticamente.

## 6. Migrar archivos existentes (opcional)

1. Sube manualmente los archivos de `uploads/` al bucket manteniendo el nombre (ej: `uploads/1234.pdf`).
2. Actualiza las filas en la tabla `notes` para que `file_url` apunte a la nueva URL del objeto (puedes usar un UPDATE masivo).

## 7. Limpieza en Render

- El directorio local `uploads/` se usa sólo como temporal. No necesitas almacenamiento persistente.
- Asegúrate de que el servicio tenga permisos para escribir en disco temporal (`/tmp` o `./uploads`).

## 8. ¿Bucket público o privado?

- **Privado + URLs firmadas:** más seguro. Necesitarías un endpoint que genere URLs firmadas para la vista previa. (Aún no implementado; por ahora el bucket se asume público o con política de lectura).
- **Público (read-only):** sencillo. Basta con `ACL: public-read` o una política de bucket que permita `s3:GetObject` público.

Si quieres cambiar a URLs firmadas en el futuro, debes ajustar el backend para generar un `getSignedUrl` y devolverlo al frontend.

## 9. Verificación

1. Subir un PDF desde el frontend.
2. En la respuesta (`/documents`) deberías ver la URL final en S3.
3. Abre esa URL en el navegador: debe descargar/mostrar el PDF.
4. Verifica en el bucket que el objeto se creó en `uploads/<timestamp>-archivo.pdf`.

¡Listo! Ahora los archivos son persistentes y no se pierden cuando Render redepliega el backend.

