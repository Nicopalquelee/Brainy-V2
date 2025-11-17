# Configuración de Email de Confirmación en Supabase

> **Nota:** Actualmente la aplicación registra e inicia sesión automáticamente sin requerir confirmación. Usa esta guía solo si en algún momento deseas habilitar la verificación por email.

Este documento explica cómo configurar Supabase para enviar correos de confirmación cuando los usuarios se registran.

## 📧 Configuración en el Dashboard de Supabase

### 1. Habilitar Confirmación de Email

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** → **Settings** (o **Configuración**)
3. En la sección **Email Auth**, asegúrate de que:
   - ✅ **Enable email confirmations** esté activado
   - ✅ **Secure email change** esté activado (opcional pero recomendado)

### 2. Configurar Plantillas de Email

1. En el mismo panel, ve a **Email Templates**
2. Personaliza las plantillas según necesites:
   - **Confirm signup**: Email de confirmación de registro
   - **Magic Link**: Para inicio de sesión con enlace mágico
   - **Change Email Address**: Para cambio de email
   - **Reset Password**: Para recuperación de contraseña

#### Ejemplo de Plantilla de Confirmación (Confirm signup)

Aquí tienes un ejemplo de plantilla HTML personalizada para el email de confirmación:

```html
<h2>¡Bienvenido a <strong>Brainy USS</strong>! 💡</h2>

<p>Gracias por unirte a nuestra comunidad académica. Antes de comenzar a explorar apuntes, recursos y el asistente inteligente, necesitamos que confirmes tu cuenta.</p>

<p><strong>Sigue este enlace para activar tu usuario:</strong></p>

<p style="margin: 16px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #1a1a1a; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">
     Confirmar mi cuenta
  </a>
</p>

<p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />

<p style="font-size: 12px; color: #555;">
Este correo fue enviado automáticamente por <strong>Brainy USS</strong> — Plataforma académica de la Universidad San Sebastián.
</p>
```

**Nota:** La variable `{{ .ConfirmationURL }}` es reemplazada automáticamente por Supabase con el enlace de confirmación.

### 3. Configurar SMTP (RECOMENDADO para Producción)

⚠️ **IMPORTANTE:** Si estás recibiendo errores de "rate limit exceeded", debes configurar SMTP personalizado.

Por defecto, Supabase usa su propio servicio de email con límites estrictos. Para producción, es **altamente recomendado** configurar tu propio SMTP.

#### Pasos para configurar SMTP:

1. Ve a **Settings** → **Auth** → **SMTP Settings** en el dashboard de Supabase
2. Activa **Enable Custom SMTP**
3. Configura tu proveedor SMTP:
   - **Host**: smtp.tu-proveedor.com
   - **Port**: 587 (TLS) o 465 (SSL)
   - **Username**: tu-usuario-smtp
   - **Password**: tu-contraseña-smtp
   - **Sender email**: noreply@tudominio.com (debe ser un email verificado)
   - **Sender name**: Brainy USS

#### Proveedores SMTP recomendados:

**1. SendGrid (Recomendado para empezar)**
- Plan gratuito: 100 correos/día
- Fácil de configurar
- Buena documentación
- [Registro en SendGrid](https://sendgrid.com)

**2. Mailgun**
- Plan gratuito: 5,000 correos/mes (primeros 3 meses)
- Luego: 1,000 correos/mes gratis
- Excelente para desarrollo y producción pequeña
- [Registro en Mailgun](https://www.mailgun.com)

**3. Amazon SES**
- Muy económico ($0.10 por 1,000 correos)
- Requiere configuración de AWS
- Ideal para alto volumen
- [Documentación de Amazon SES](https://aws.amazon.com/ses/)

**4. Resend (Moderno y fácil)**
- Plan gratuito: 3,000 correos/mes
- API moderna y fácil de usar
- Excelente para startups
- [Registro en Resend](https://resend.com)

**5. Gmail (Solo para desarrollo/testing)**
- Host: `smtp.gmail.com`
- Port: `587`
- Requiere "App Password" (no tu contraseña normal)
- Límite: 500 correos/día
- ⚠️ No recomendado para producción

#### Ejemplo de configuración con SendGrid:

```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Tu API Key de SendGrid]
Sender email: noreply@tudominio.com
Sender name: Brainy USS
```

**Nota:** Después de configurar SMTP, todos los correos de Supabase (confirmación, reset password, etc.) se enviarán a través de tu proveedor SMTP, eliminando los límites de Supabase.

### 4. Configurar URL de Redirección

1. En **Authentication** → **URL Configuration**
2. Configura **Site URL**: `https://tu-dominio.com` (o `http://localhost:5173` para desarrollo)
3. Configura **Redirect URLs**: Agrega las URLs permitidas para redirección después de confirmar email:
   - `https://tu-dominio.com` (o tu dominio de producción)
   - `http://localhost:5173` (para desarrollo)

**Nota:** Cuando el usuario hace clic en el enlace de confirmación, Supabase lo redirigirá a la Site URL con parámetros `?type=signup&token=...`. El frontend detecta estos parámetros y muestra una página de confirmación exitosa.

## 🔧 Configuración en el Código

El código ya está configurado para requerir confirmación de email:

### Backend (`backend/src/users/users.service.ts`)

```typescript
email_confirm: false, // Requiere confirmación de email
```

### Frontend

- **`front/src/components/RegisterForm.tsx`**: El formulario de registro muestra un mensaje de confirmación después del registro exitoso.
- **`front/src/components/EmailConfirmation.tsx`**: Componente que muestra una página de confirmación exitosa cuando el usuario hace clic en el enlace del correo.
- **`front/src/App.tsx`**: Detecta automáticamente los parámetros de confirmación en la URL y muestra la página de confirmación.

## ✅ Verificación

### Probar el Flujo Completo

1. **Registro:**
   - Registra un nuevo usuario con email válido
   - Deberías ver el mensaje: "Revisa tu correo"
   - NO deberías poder iniciar sesión aún

2. **Confirmación:**
   - Revisa el correo del usuario registrado
   - Haz clic en el enlace de confirmación "Confirmar mi cuenta"
   - Deberías ser redirigido a tu aplicación y ver una página de confirmación exitosa
   - La página mostrará: "¡Email Confirmado!" con un botón para ir al inicio de sesión

3. **Login:**
   - Intenta iniciar sesión con el usuario confirmado
   - Debería funcionar correctamente

4. **Login sin Confirmar:**
   - Intenta iniciar sesión con un usuario no confirmado
   - Deberías ver el error: "Por favor, confirma tu correo electrónico..."

## 🐛 Solución de Problemas

### Error: "email rate limit exceeded"

Este error ocurre cuando se excede el límite de correos del plan de Supabase:

**Límites del plan gratuito de Supabase:**
- 3 correos por hora por usuario
- 4 correos por día por usuario
- Límite total del proyecto (varía según el plan)

**Soluciones:**

1. **Configurar SMTP personalizado (RECOMENDADO para producción):**
   - Ve a **Settings** → **Auth** → **SMTP Settings** en Supabase
   - Configura un proveedor SMTP profesional (SendGrid, Mailgun, Amazon SES, etc.)
   - Esto elimina los límites de Supabase y mejora la deliverability
   - Ver sección "Configurar SMTP" más arriba para instrucciones detalladas

2. **Esperar a que se reinicie el límite:**
   - Los límites se reinician cada hora/día según el tipo
   - Puedes verificar el uso en el dashboard de Supabase

3. **Actualizar el plan de Supabase:**
   - Los planes de pago tienen límites más altos
   - Considera esto si necesitas enviar muchos correos

### Los correos no se envían

1. **Verifica la configuración de SMTP:**
   - Si usas SMTP personalizado, verifica las credenciales
   - Si usas el servicio por defecto de Supabase, verifica los límites de tu plan

2. **Revisa los logs:**
   - Ve a **Logs** → **Auth Logs** en el dashboard de Supabase
   - Busca errores relacionados con el envío de emails

3. **Verifica el spam:**
   - Los correos pueden llegar a la carpeta de spam
   - Agrega el dominio de Supabase a la lista blanca

### El usuario puede iniciar sesión sin confirmar

1. **Verifica la configuración:**
   - Asegúrate de que `email_confirm: false` en el código
   - Verifica que "Enable email confirmations" esté activado en Supabase

2. **Verifica el código:**
   - El método `validateUser` en `auth.service.ts` verifica `email_confirmed_at`
   - Si el problema persiste, revisa los logs del backend

### El enlace de confirmación no funciona

1. **Verifica las URLs de redirección:**
   - Asegúrate de que la URL de redirección esté en la lista permitida
   - Verifica que la URL sea accesible (no bloqueada por firewall/CORS)

2. **Verifica el token:**
   - Los tokens de confirmación expiran después de cierto tiempo
   - El usuario puede solicitar un nuevo correo de confirmación

## 📝 Notas Adicionales

- Los correos de confirmación expiran después de 24 horas por defecto
- Puedes personalizar el tiempo de expiración en la configuración de Supabase
- Para desarrollo, puedes usar servicios como [Mailtrap](https://mailtrap.io) para capturar emails
- En producción, considera usar un servicio SMTP profesional para mejor deliverability

## 🔗 Recursos

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Configuración de Email en Supabase](https://supabase.com/docs/guides/auth/auth-email)
- [Plantillas de Email Personalizadas](https://supabase.com/docs/guides/auth/auth-email-templates)

