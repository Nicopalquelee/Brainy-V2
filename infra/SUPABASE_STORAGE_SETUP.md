# Configuración de Supabase Storage para Brainy

Este documento explica cómo guardar los apuntes (PDF/DOCX) en **Supabase Storage** en lugar del filesystem local o S3.

---

## 1. Crear un bucket
1. En tu proyecto Supabase ve a **Storage → Buckets → Create bucket**.
2. Nombre sugerido: `brainy-uploads`.
3. Puedes dejarlo **privado** (recomendado). El backend usará la `service_role` y luego expondrá URLs públicas.
4. Si prefieres URLs públicas sin firmar, marca “Public bucket”. (En ese caso los archivos serán visibles para cualquiera con la URL).

## 2. Variables de entorno
En el backend (Render o `.env` local) agrega:
```
SUPABASE_STORAGE_BUCKET=brainy-uploads
```
Ya tienes `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY`; no cambian.

## 3. Políticas (Policies)
Supabase Storage usa RLS igual que las tablas. Algunas reglas típicas:

### Bucket privado (recomendado)
No necesitas políticas extra para el backend porque la `service_role` **omite RLS**. Sólo asegúrate de que el bucket no sea público.

Si quieres permitir que los usuarios autenticados descarguen directamente:
```sql
-- Permitir lectura a usuarios autenticados
create policy "Allow authenticated read"
on storage.objects for select
using (
  bucket_id = 'brainy-uploads'
  and auth.role() = 'authenticated'
);
```

### Bucket público
Si decides hacerlo público:
```sql
-- Lectura pública
create policy "Public read"
on storage.objects for select
using (bucket_id = 'brainy-uploads');
```
Con esto cualquiera podrá abrir la URL de un PDF sin autenticarse.

> **Importante:** crea las políticas desde **Storage → bucket → Policies → New policy** o ejecutando el SQL en el editor de Supabase.

## 4. Flujo en el backend
El controlador `DocumentsController` ahora:
1. Guarda temporalmente el archivo en `./uploads`.
2. Convierte DOCX → PDF si es necesario.
3. Sube el archivo final a Storage usando:
   ```ts
   supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType })
   ```
4. Obtiene un `publicUrl` (si el bucket es público) y lo guarda en la tabla `notes.file_url`.
5. Elimina los archivos temporales locales.

## 5. Usar URLs firmadas (opcional)
Si el bucket es privado y no quieres hacerlo público:
```ts
const link = await supabaseAdmin.storage
  .from(bucket)
  .createSignedUrl(path, 60 * 5); // 5 minutos
```
Puedes exponer un endpoint `/documents/:id/url` que devuelva esta URL temporal. Actualmente no se usa porque se trabaja con URLs públicas.

## 6. Migrar archivos existentes
Si tenías archivos en `uploads/` o en S3:
1. Sube cada archivo al bucket (por ejemplo usando la UI de Supabase o un script).
2. Conserva la misma ruta (`uploads/<nombre>`).
3. Actualiza las filas de `notes.file_url` para que apunten a la nueva URL pública.

## 7. Verificación
1. Sube un PDF desde el frontend.
2. En Supabase Storage deberías ver el objeto dentro del bucket.
3. Copia la URL pública y ábrela en el navegador: debe mostrar o descargar el archivo.

Con esto, todos los archivos quedan almacenados en Supabase y no se pierden entre redeploys.


