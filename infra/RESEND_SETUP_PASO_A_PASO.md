# Configurar Resend en Supabase - Paso a Paso

> **Nota:** Actualmente la app no requiere confirmación por email. Sigue estos pasos solo si vuelves a habilitar ese flujo y necesitas enviar correos.

Esta guía te muestra exactamente dónde poner tu API Key de Resend en Supabase.

## 📋 Pasos Detallados

### Paso 1: Obtener tu API Key de Resend

1. Ve a [resend.com](https://resend.com) e inicia sesión
2. En el dashboard, ve a **API Keys** (en el menú lateral)
3. Click en **Create API Key**
4. Dale un nombre descriptivo (ej: "Supabase Brainy USS")
5. **Copia el API Key** - empieza con `re_` (ej: `re_1234567890abcdef...`)
   - ⚠️ **Importante:** Solo se muestra una vez, guárdala bien

### Paso 2: Configurar en Supabase

1. **Abre tu proyecto en Supabase:**
   - Ve a [app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto (Brainy USS)

2. **Navega a la configuración SMTP:**
   - En el menú lateral izquierdo, click en **Settings** (⚙️)
   - Luego click en **Auth** (o busca "Authentication" en el submenú)
   - En la página de Auth, busca la sección **SMTP Settings**
   - O ve directamente a: **Settings** → **Auth** → **SMTP Settings**

3. **Activa SMTP personalizado:**
   - Encuentra el toggle **"Enable Custom SMTP"**
   - Actívalo (debe quedar en verde/activado)

4. **Completa los campos con estos valores:**

   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [PEGA AQUÍ TU API KEY DE RESEND]
   Sender email: onboarding@resend.dev
   Sender name: Brainy USS
   ```

   **Detalles importantes:**
   - **Host:** `smtp.resend.com` (exactamente así)
   - **Port:** `587` (no uses 465)
   - **Username:** `resend` (literalmente la palabra "resend")
   - **Password:** Aquí va tu API Key completa que copiaste (la que empieza con `re_`)
   - **Sender email:** 
     - Para testing: `onboarding@resend.dev` (funciona sin verificar dominio)
     - Para producción: `noreply@tudominio.com` (requiere verificar dominio en Resend)
   - **Sender name:** `Brainy USS` (o el nombre que prefieras)

5. **Guarda la configuración:**
   - Click en el botón **Save** o **Update** (depende de la versión de Supabase)
   - Deberías ver un mensaje de éxito

### Paso 3: Verificar que Funciona

1. **Prueba el registro:**
   - Intenta registrar un nuevo usuario en tu aplicación
   - Deberías recibir el correo de confirmación

2. **Revisa los logs:**
   - En Supabase, ve a **Logs** → **Auth Logs**
   - Busca intentos de envío de correo
   - Deberías ver "Email sent successfully" en lugar de errores

3. **Revisa tu bandeja de entrada:**
   - El correo puede tardar unos segundos
   - Revisa también la carpeta de spam

## 🔍 Ubicación Visual en Supabase

```
Supabase Dashboard
└── Tu Proyecto
    └── Settings (⚙️) [Menú lateral izquierdo]
        └── Auth [Submenú]
            └── SMTP Settings [Sección en la página]
                └── Enable Custom SMTP [Toggle]
                    └── Campos de configuración
```

## ⚠️ Problemas Comunes

### "Invalid credentials"
- Verifica que copiaste el API Key completo (debe empezar con `re_`)
- Asegúrate de que el Username sea exactamente `resend` (sin espacios)
- Verifica que el Host sea `smtp.resend.com` (no `smtp.resend.dev`)

### "Sender email not verified"
- Si usas `onboarding@resend.dev`, debería funcionar sin verificar
- Si usas tu propio dominio, debes verificarlo primero en Resend:
  - Ve a **Domains** en Resend
  - Agrega tu dominio
  - Configura los registros DNS que te indique

### Los correos no llegan
- Revisa la carpeta de spam
- Verifica los logs en Supabase (Logs → Auth Logs)
- Verifica que el API Key tenga permisos de "Send Emails"

## 📝 Notas Importantes

- El API Key de Resend es tu "Password" en Supabase (no uses tu contraseña de Resend)
- El Username siempre es `resend` (no cambia)
- Para producción, verifica tu dominio en Resend para mejor deliverability
- Resend permite 3,000 correos/mes en el plan gratuito

## ✅ Checklist

- [ ] Tengo mi API Key de Resend (empieza con `re_`)
- [ ] Fui a Settings → Auth → SMTP Settings en Supabase
- [ ] Activé "Enable Custom SMTP"
- [ ] Configuré Host: `smtp.resend.com`
- [ ] Configuré Port: `587`
- [ ] Configuré Username: `resend`
- [ ] Configuré Password: [Mi API Key de Resend]
- [ ] Configuré Sender email: `onboarding@resend.dev` (o mi dominio verificado)
- [ ] Configuré Sender name: `Brainy USS`
- [ ] Guardé la configuración
- [ ] Probé registrando un usuario nuevo
- [ ] Recibí el correo de confirmación

## 🆘 ¿Necesitas Ayuda?

Si sigues teniendo problemas:
1. Verifica que el API Key esté activo en Resend
2. Revisa los logs de Supabase para ver el error exacto
3. Prueba con `onboarding@resend.dev` primero para verificar que funciona
4. Contacta al soporte de Resend si el problema persiste

