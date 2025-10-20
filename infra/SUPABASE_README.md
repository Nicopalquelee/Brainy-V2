# Supabase Configuration for BrainyV2

Este proyecto utiliza Supabase como base de datos principal. Aquí encontrarás toda la información necesaria para configurar y usar Supabase.

## 🚀 Configuración Inicial

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Anota la URL y las API keys de tu proyecto

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

Actualiza las siguientes variables en el archivo `.env`:

```env
SUPABASE_URL=https://tu-proyecto-id.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Ejecutar el esquema de base de datos

En el panel de Supabase, ve a la pestaña "SQL Editor" y ejecuta el contenido del archivo `supabase-schema.sql`.

## 📊 Estructura de la Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario (extiende auth.users de Supabase)
- **notes**: Notas académicas subidas por los usuarios
- **comments**: Comentarios en las notas
- **favorites**: Notas favoritas de cada usuario
- **categories**: Categorías para organizar las notas
- **note_categories**: Relación many-to-many entre notas y categorías
- **conversations**: Conversaciones de chat
- **messages**: Mensajes del chat AI

### Características de Seguridad

- **Row Level Security (RLS)**: Habilitado en todas las tablas
- **Políticas de acceso**: Configuradas para proteger datos sensibles
- **Autenticación**: Integrada con Supabase Auth
- **Roles de usuario**: student, teacher, admin

## 🔧 Funciones y Triggers

- **update_updated_at_column()**: Actualiza automáticamente timestamp de modificación
- **handle_new_user()**: Crea perfil automáticamente al registrar usuario
- **Triggers**: Aplicados en tablas relevantes para mantenimiento automático

## 📱 Integración con el Frontend

### Instalar dependencias de Supabase

En el directorio `front/`, instala el cliente de Supabase:

```bash
npm install @supabase/supabase-js
```

### Configurar cliente Supabase

Crea un archivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Variables de entorno para el frontend

En `front/.env`:

```env
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 🔐 Autenticación

Supabase Auth proporciona:

- Registro/Login con email y contraseña
- OAuth con Google, GitHub, etc.
- Verificación de email
- Reseteo de contraseña
- Gestión de sesiones

### Ejemplo de uso:

```typescript
import { supabase } from './lib/supabase'

// Registro
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      username: 'usuario123',
      full_name: 'Usuario Ejemplo'
    }
  }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

## 📝 Operaciones de Base de Datos

### Ejemplos de consultas:

```typescript
// Obtener notas publicadas
const { data: notes } = await supabase
  .from('notes')
  .select(`
    *,
    profiles:author_id(username, full_name),
    categories:note_categories(categories(*))
  `)
  .eq('status', 'published')
  .order('created_at', { ascending: false })

// Crear nueva nota
const { data, error } = await supabase
  .from('notes')
  .insert({
    title: 'Mi nota',
    content: 'Contenido de la nota',
    subject: 'Matemáticas',
    author_id: user.id
  })

// Agregar a favoritos
const { error } = await supabase
  .from('favorites')
  .insert({
    user_id: user.id,
    note_id: noteId
  })
```

## 🔄 Migraciones

Para actualizar el esquema de la base de datos:

1. Modifica el archivo `supabase-schema.sql`
2. Ejecuta las nuevas migraciones en el SQL Editor de Supabase
3. Documenta los cambios en este README

## 📊 Backup y Monitoreo

- Supabase proporciona backups automáticos
- Usa el dashboard de Supabase para monitorear uso y performance
- Configura alertas para límites de uso

## 🚨 Solución de Problemas

### Problemas comunes:

1. **Error de RLS**: Verifica que las políticas estén configuradas correctamente
2. **Error de autenticación**: Revisa las API keys en las variables de entorno
3. **Error de CORS**: Configura los dominios permitidos en Supabase

### Logs y debugging:

- Usa las herramientas de desarrollo del navegador
- Revisa los logs en el dashboard de Supabase
- Habilita el modo debug en el cliente de Supabase durante desarrollo

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)