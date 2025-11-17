# 🔍 Diagnóstico: Estado "Warning" en AWS Elastic Beanstalk

## ⚠️ Estado Actual
- **Estado:** Warning (amarillo)
- **Métricas:** Todas en "-" (sin datos)
- **Significado:** La aplicación no está respondiendo correctamente

## 🔎 Pasos para Diagnosticar

### 1. Revisar los Eventos (PRIORITARIO)

Ve a la pestaña **"Eventos"** y busca:

**Errores comunes:**
- ❌ `Failed to deploy application`
- ❌ `Application failed to start`
- ❌ `Health check failed`
- ❌ `Command failed on instance`
- ❌ `npm install failed`
- ❌ `Cannot find module`

**Copia el mensaje de error completo** - esto nos dirá exactamente qué está fallando.

### 2. Revisar los Logs

Ve a la pestaña **"Registros"**:

1. Click en **"Solicitar últimos 100 líneas"**
2. Busca líneas en **rojo** (errores)
3. Busca estas líneas importantes:
   - ✅ `Server listening on http://localhost:8080` = La app inició correctamente
   - ❌ `Error: Cannot find module` = Falta código o dependencias
   - ❌ `EADDRINUSE` = Puerto en uso
   - ❌ `ECONNREFUSED` = Error de conexión a base de datos
   - ❌ `npm ERR!` = Error instalando dependencias

### 3. Verificar el Health Check

Prueba manualmente:
```bash
curl https://brainyai.us-east-2.elasticbeanstalk.com/health
```

**Si no responde:**
- La aplicación no está corriendo
- El health check está mal configurado
- Hay un error al iniciar

### 4. Problemas Comunes y Soluciones

#### Problema 1: Falta el código compilado (dist/)

**Síntoma:** Error `Cannot find module` o `dist/main.js not found`

**Solución:**
```bash
cd backend
npm run build
# Luego crear el ZIP nuevamente
create-deploy-zip.bat
```

**Verificar:** El ZIP debe incluir la carpeta `dist/` con `dist/main.js`

#### Problema 2: Variables de entorno faltantes

**Síntoma:** Error de conexión a base de datos o `undefined` en logs

**Solución:**
1. Ve a **Configuración → Seguridad → Variables de entorno**
2. Agrega todas las variables necesarias:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
   - `CORS_ORIGIN`
   - etc.

#### Problema 3: El puerto no es 8080

**Síntoma:** La app inicia pero el health check falla

**Solución:** Verifica que en `main.ts` use:
```typescript
const port = process.env.PORT || 3000;
```

El `PORT` viene de Elastic Beanstalk y debe ser 8080. Si usas `|| 3000`, puede causar problemas.

#### Problema 4: El ZIP no incluye archivos necesarios

**Síntoma:** `Procfile not found` o `package.json not found`

**Solución:**
1. Verifica que el ZIP incluya:
   - ✅ `package.json` (en la raíz)
   - ✅ `Procfile` (en la raíz)
   - ✅ `.ebextensions/` (carpeta completa)
   - ✅ `dist/` (carpeta con código compilado)

2. Crea el ZIP correctamente:
   ```bash
   cd backend
   create-deploy-zip.bat
   ```

#### Problema 5: Dependencias faltantes

**Síntoma:** `npm install` falla o `Cannot find module '@nestjs/...'`

**Solución:**
- Verifica que `package.json` tenga todas las dependencias
- AWS ejecuta `npm install --production` automáticamente
- Si falla, revisa los logs para ver qué dependencia falta

#### Problema 6: Health check mal configurado

**Síntoma:** La app funciona pero el estado sigue en Warning

**Solución:**
1. Verifica que el endpoint `/health` responda
2. Verifica la configuración en `.ebextensions/01-nodejs.config`:
   ```yaml
   HealthCheckPath: /health
   HealthCheckURL: /health
   ```

## 🛠️ Checklist de Verificación

Antes de volver a desplegar, verifica:

- [ ] El código está compilado: `npm run build` ejecutado
- [ ] El ZIP incluye `dist/main.js`
- [ ] El ZIP incluye `Procfile` en la raíz
- [ ] El ZIP incluye `package.json` en la raíz
- [ ] El ZIP incluye `.ebextensions/` completa
- [ ] Las variables de entorno están configuradas en AWS
- [ ] El health check `/health` está implementado en `main.ts`
- [ ] El puerto usa `process.env.PORT` (no hardcodeado)

## 📋 Información Necesaria para Diagnosticar

**Por favor, comparte:**

1. **Los últimos 5-10 eventos** de la pestaña "Eventos"
2. **Las últimas 50 líneas de logs** (especialmente errores en rojo)
3. **El resultado de:** `curl https://brainyai.us-east-2.elasticbeanstalk.com/health`

Con esta información podré darte una solución específica.

## 🚀 Solución Rápida (Si no sabes qué hacer)

1. **Compila el código:**
   ```bash
   cd backend
   npm run build
   ```

2. **Crea el ZIP:**
   ```bash
   create-deploy-zip.bat
   ```

3. **Verifica el ZIP:**
   - Abre el ZIP
   - Verifica que tenga: `package.json`, `Procfile`, `dist/`, `.ebextensions/`

4. **Sube el ZIP:**
   - Click en "Cargar e implementar"
   - Selecciona el ZIP
   - Click en "Implementar"

5. **Espera y revisa:**
   - Espera 5-10 minutos
   - Revisa los eventos
   - Revisa los logs



