# 🚨 Solución Rápida para Estado "Warning"

## ⚡ Pasos Inmediatos

### Paso 1: Compilar el Código (CRÍTICO)

```bash
cd backend
npm run build
```

**Verifica que se creó:** `dist/main.js`

### Paso 2: Verificar el ZIP

```bash
verificar-zip.bat
```

Este script te dirá si el ZIP tiene todos los archivos necesarios.

### Paso 3: Si el ZIP está incompleto, crearlo de nuevo

```bash
create-deploy-zip.bat
```

### Paso 4: Verificar el ZIP nuevamente

```bash
verificar-zip.bat
```

### Paso 5: Subir el ZIP a AWS

1. Ve a AWS Console
2. Click en **"Cargar e implementar"**
3. Selecciona `brainy-backend-deploy.zip`
4. Click en **"Implementar"**

### Paso 6: Revisar los Eventos

Después de 5-10 minutos:
1. Ve a la pestaña **"Eventos"**
2. Busca errores en rojo
3. Si ves `Environment health has transitioned from Warning to Ok` = ✅ ÉXITO

## 🔍 Si Sigue en Warning

### Revisa los Logs

1. Ve a la pestaña **"Registros"**
2. Click en **"Solicitar últimos 100 líneas"**
3. Busca líneas en **rojo**
4. **Copia los errores** y compártelos

### Revisa los Eventos

1. Ve a la pestaña **"Eventos"**
2. Busca eventos con icono de error (❌)
3. **Copia los mensajes de error** y compártelos

### Verifica Variables de Entorno

1. Ve a **Configuración → Seguridad → Variables de entorno**
2. Verifica que tengas configuradas:
   - `DATABASE_URL` (si usas base de datos)
   - `JWT_SECRET`
   - `SUPABASE_URL` (si usas Supabase)
   - `SUPABASE_KEY` (si usas Supabase)
   - `OPENAI_API_KEY` (si usas OpenAI)
   - `CORS_ORIGIN`

## 📋 Checklist Pre-Despliegue

Antes de subir el ZIP, verifica:

- [ ] ✅ `npm run build` ejecutado exitosamente
- [ ] ✅ Existe `dist/main.js`
- [ ] ✅ `verificar-zip.bat` muestra "ZIP CORRECTO"
- [ ] ✅ Variables de entorno configuradas en AWS
- [ ] ✅ El ZIP no incluye `node_modules/` (debe ser pequeño, < 10MB sin node_modules)

## 🆘 Errores Comunes

### "Cannot find module 'dist/main.js'"
**Causa:** El código no está compilado
**Solución:** Ejecuta `npm run build`

### "Procfile not found"
**Causa:** El ZIP no incluye Procfile
**Solución:** Verifica que `Procfile` esté en la raíz del ZIP

### "Health check failed"
**Causa:** El endpoint `/health` no responde
**Solución:** Verifica que `main.ts` tenga el health check configurado (ya lo tiene)

### "npm install failed"
**Causa:** Error en `package.json` o dependencias
**Solución:** Revisa los logs para ver qué dependencia falla

## 💡 Próximos Pasos

Una vez que el estado cambie a **"Ok"** (verde):

1. Prueba el health check:
   ```bash
   curl https://brainyai.us-east-2.elasticbeanstalk.com/health
   ```

2. Haz los cambios críticos para 24/7:
   - Base bajo demanda: 0 → 1
   - Política: AllAtOnce → Rolling

3. Configura alarmas en CloudWatch para monitoreo



