# Guía Rápida: Configurar SMTP en Supabase

> **Nota:** El proyecto actualmente no envía correos de confirmación porque el login es inmediato. Esta guía es útil solo si decides habilitar verificación por email u otras notificaciones.

Esta guía te ayudará a configurar SMTP personalizado en Supabase para evitar el error "email rate limit exceeded".

## 🚨 Problema: Rate Limit Exceeded

Si estás viendo este error:
```
Failed to send confirmation email: email rate limit exceeded
```

Significa que has excedido el límite de correos del plan gratuito de Supabase (3 correos/hora por usuario).

## ✅ Solución: Configurar SMTP Personalizado

### Opción 1: SendGrid (Más Fácil)

1. **Crear cuenta en SendGrid:**
   - Ve a [sendgrid.com](https://sendgrid.com) y crea una cuenta gratuita
   - Verifica tu email

2. **Crear API Key:**
   - Ve a **Settings** → **API Keys**
   - Click en **Create API Key**
   - Dale un nombre (ej: "Supabase Brainy")
   - Selecciona **Full Access** o **Restricted Access** con permisos de Mail Send
   - Copia el API Key (solo se muestra una vez)

3. **Verificar dominio (Opcional pero recomendado):**
   - Ve a **Settings** → **Sender Authentication**
   - Verifica tu dominio para mejor deliverability

4. **Configurar en Supabase:**
   - Ve a tu proyecto en Supabase Dashboard
   - **Settings** → **Auth** → **SMTP Settings**
   - Activa **Enable Custom SMTP**
   - Completa:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [Pega tu API Key de SendGrid aquí]
     Sender email: noreply@tudominio.com
     Sender name: Brainy USS
     ```
   - Click en **Save**

### Opción 2: Mailgun

1. **Crear cuenta en Mailgun:**
   - Ve a [mailgun.com](https://www.mailgun.com) y crea una cuenta
   - Verifica tu email

2. **Obtener credenciales:**
   - Ve a **Sending** → **Domain Settings**
   - Selecciona tu dominio (o usa el dominio de prueba)
   - Ve a **SMTP credentials**
   - Copia el **SMTP username** y **Default password**

3. **Configurar en Supabase:**
   ```
   Host: smtp.mailgun.org
   Port: 587
   Username: [Tu SMTP username]
   Password: [Tu Default password]
   Sender email: noreply@tudominio.com
   Sender name: Brainy USS
   ```

### Opción 3: Resend (Recomendado para Startups) ⭐

1. **Crear cuenta en Resend:**
   - Ve a [resend.com](https://resend.com) y crea una cuenta
   - Verifica tu email

2. **Obtener API Key:**
   - Ve a **API Keys** en el dashboard de Resend
   - Click en **Create API Key**
   - Dale un nombre (ej: "Supabase Brainy")
   - Copia el API Key (empieza con `re_...`)

3. **Verificar dominio (Opcional pero recomendado):**
   - Ve a **Domains** en Resend
   - Agrega tu dominio y verifica el DNS
   - Esto mejora la deliverability

4. **Configurar en Supabase:**
   - Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Navega a **Settings** → **Auth** → **SMTP Settings**
   - Activa el toggle **Enable Custom SMTP**
   - Completa los campos:
     ```
     Host: smtp.resend.com
     Port: 587
     Username: resend
     Password: [Pega tu API Key de Resend aquí - la que empieza con re_]
     Sender email: noreply@tudominio.com (o onboarding@resend.dev para testing)
     Sender name: Brainy USS
     ```
   - Click en **Save** o **Update**

**Nota importante:** 
- Si no has verificado un dominio en Resend, puedes usar `onboarding@resend.dev` como sender email temporalmente
- Para producción, verifica tu dominio en Resend y usa un email de ese dominio

### Opción 4: Gmail (Solo para Desarrollo)

⚠️ **Solo para testing/desarrollo. No usar en producción.**

1. **Habilitar App Password en Gmail:**
   - Ve a tu cuenta de Google
   - **Seguridad** → **Verificación en 2 pasos** (debe estar activada)
   - **Contraseñas de aplicaciones**
   - Genera una nueva contraseña para "Correo" y "Otro (Supabase)"
   - Copia la contraseña generada

2. **Configurar en Supabase:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: [Tu email de Gmail]
   Password: [La App Password que generaste]
   Sender email: [Tu email de Gmail]
   Sender name: Brainy USS
   ```

## 🧪 Probar la Configuración

1. Después de configurar SMTP, intenta registrar un nuevo usuario
2. Verifica que recibas el correo de confirmación
3. Revisa los logs en Supabase: **Logs** → **Auth Logs**

## 📊 Comparación de Proveedores

| Proveedor | Plan Gratuito | Facilidad | Recomendado Para |
|-----------|---------------|-----------|------------------|
| SendGrid | 100/día | ⭐⭐⭐⭐⭐ | Principiantes |
| Mailgun | 1,000/mes | ⭐⭐⭐⭐ | Desarrollo/Pequeño |
| Resend | 3,000/mes | ⭐⭐⭐⭐⭐ | Startups |
| Amazon SES | Pay-as-you-go | ⭐⭐⭐ | Alto volumen |
| Gmail | 500/día | ⭐⭐⭐⭐⭐ | Solo desarrollo |

## 🔍 Verificar que Funciona

1. Ve a **Logs** → **Auth Logs** en Supabase
2. Busca intentos de envío de correo
3. Deberías ver "Email sent successfully" en lugar de errores de rate limit

## 📝 Notas Importantes

- El **Sender email** debe ser un email verificado en tu proveedor SMTP
- Para producción, verifica tu dominio en el proveedor SMTP
- Los correos pueden tardar unos minutos en llegar
- Revisa la carpeta de spam si no recibes correos
- Después de configurar SMTP, todos los correos de Supabase usan tu proveedor

## 🆘 ¿Necesitas Ayuda?

Si sigues teniendo problemas:
1. Verifica las credenciales SMTP
2. Revisa los logs de Supabase
3. Verifica que el sender email esté verificado
4. Prueba con un proveedor diferente

