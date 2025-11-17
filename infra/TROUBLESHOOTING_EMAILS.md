# Troubleshooting: Los Correos No Llegan

> **Nota:** El flujo actual de la app no depende de correos de confirmación. Esta guía es útil solo si vuelves a habilitar ese mecanismo.

Si ya configuraste Resend en Supabase pero los correos no llegan, sigue estos pasos:

## 🔍 Paso 1: Verificar la Configuración SMTP

1. **Ve a Supabase Dashboard:**
   - Settings → Auth → SMTP Settings
   - Verifica que "Enable Custom SMTP" esté **ACTIVADO** (toggle verde)

2. **Verifica los valores:**
   - Host: `smtp.resend.com` (exactamente así)
   - Port: `587` (no 465)
   - Username: `resend` (literalmente la palabra)
   - Password: Tu API Key completa (empieza con `re_`)
   - Sender email: `onboarding@resend.dev` (para testing)

3. **Guarda de nuevo:**
   - A veces necesitas hacer "Save" dos veces
   - Espera unos segundos después de guardar

## 🔍 Paso 2: Revisar los Logs de Supabase

1. **Ve a Logs en Supabase:**
   - En el menú lateral: **Logs** → **Auth Logs**
   - O directamente: [app.supabase.com/project/YOUR_PROJECT/logs/auth](https://app.supabase.com)

2. **Busca errores:**
   - Filtra por "Error" o "Failed"
   - Busca intentos de envío de correo recientes
   - Los errores te dirán qué está mal

**Errores comunes:**
- `Invalid credentials` → API Key incorrecta o Username mal escrito
- `Sender email not verified` → Cambia a `onboarding@resend.dev`
- `Connection timeout` → Verifica Host y Port
- `Rate limit exceeded` → Espera unos minutos

## 🔍 Paso 3: Verificar en Resend

1. **Ve a tu dashboard de Resend:**
   - [resend.com/emails](https://resend.com/emails)
   - Ve a la pestaña **Emails** o **Logs**

2. **Busca intentos de envío:**
   - Deberías ver intentos de envío cuando registras un usuario
   - Si no ves nada, Supabase no está usando Resend
   - Si ves errores, Resend te dirá qué está mal

## 🔍 Paso 4: Probar el Envío Manual

1. **En Supabase Dashboard:**
   - Ve a **Authentication** → **Users**
   - Busca un usuario no confirmado
   - Click en los tres puntos (⋯) → **Resend confirmation email**
   - Esto debería enviar el correo usando Resend

2. **Verifica:**
   - Revisa los logs de Supabase
   - Revisa los logs de Resend
   - Revisa tu bandeja de entrada (y spam)

## ⚠️ Problema Conocido: Admin API No Envía Correos (RESUELTO)

**IMPORTANTE:** Cuando creas un usuario con `admin.createUser()`, Supabase **NO envía automáticamente** el correo de confirmación.

### ✅ Solución Implementada

El código ha sido actualizado para usar `admin.inviteUserByEmail()` que **SÍ envía el correo automáticamente**. Este método:
- Crea el usuario
- Envía el correo de confirmación automáticamente
- Establece la contraseña después de crear el usuario

**Si los correos aún no llegan después de este cambio:**
1. Verifica que el código esté desplegado (reinicia el servidor backend)
2. Verifica la configuración SMTP en Supabase (debe estar activada)
3. Revisa los logs de Supabase y Resend

## 🔧 Verificaciones Adicionales

### Verificar que el Correo No Está en Spam
- Revisa la carpeta de spam
- Busca correos de `onboarding@resend.dev` o tu dominio
- Agrega el remitente a contactos

### Verificar el Sender Email
- Si usas `onboarding@resend.dev`, debería funcionar sin verificar
- Si usas tu propio dominio, debe estar verificado en Resend:
  - Ve a Resend → Domains
  - Verifica que tu dominio esté verificado
  - Configura los registros DNS que te indique

### Verificar el API Key
- Ve a Resend → API Keys
- Verifica que el API Key esté activo
- Verifica que tenga permisos de "Send Emails"
- Si es necesario, crea uno nuevo

## 📋 Checklist Completo

- [ ] **Código actualizado:** El backend usa `inviteUserByEmail()` (verifica que el servidor esté reiniciado)
- [ ] SMTP está activado en Supabase
- [ ] Los valores de configuración son correctos
- [ ] El API Key de Resend es válido y activo
- [ ] Revisé los logs de Supabase (no hay errores)
- [ ] Revisé los logs de Resend (veo intentos de envío)
- [ ] Probé enviar correo manualmente desde Supabase
- [ ] Revisé la carpeta de spam
- [ ] El sender email está verificado (o uso `onboarding@resend.dev`)
- [ ] El servidor backend está corriendo con el código actualizado

## 🆘 Si Nada Funciona

1. **Prueba con otro proveedor SMTP:**
   - SendGrid (más fácil de configurar)
   - Mailgun
   - Gmail (solo para testing)

2. **Contacta soporte:**
   - Supabase: [support.supabase.com](https://support.supabase.com)
   - Resend: [resend.com/support](https://resend.com/support)

3. **Verifica la configuración del proyecto:**
   - Asegúrate de que "Enable email confirmations" esté activado
   - Verifica las URLs de redirección

