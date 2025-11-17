# Guía de Despliegue 24/7 en AWS Elastic Beanstalk

## 🚀 Pasos para Desplegar

### 1. Compilar el Código

```bash
cd backend
npm install
npm run build
```

### 2. Crear el ZIP de Despliegue

**Windows:**
```bash
create-deploy-zip.bat
```

**Linux/Mac:**
```bash
chmod +x create-deploy-zip.sh
./create-deploy-zip.sh
```

**O manualmente:**
```bash
# Asegúrate de estar en la carpeta backend
zip -r ../brainy-backend-deploy.zip . \
    -x "node_modules/*" \
    -x "dist/*" \
    -x "coverage/*" \
    -x "uploads/*" \
    -x "*.log" \
    -x "*.tsbuildinfo" \
    -x ".git/*" \
    -x "test/*" \
    -x "scripts/*" \
    -x "reports/*"
```

**⚠️ IMPORTANTE:** El ZIP DEBE incluir:
- ✅ `package.json`
- ✅ `Procfile`
- ✅ `.ebextensions/` (carpeta completa con los 3 archivos .config)
- ✅ `dist/` (código compilado)

### 3. Configurar Variables de Entorno en AWS

En la consola de AWS Elastic Beanstalk, ve a:
**Configuración → Seguridad → Variables de entorno**

Agrega todas las variables necesarias (ejemplo):
- `DATABASE_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `CORS_ORIGIN`
- etc.

### 4. Hacer los Cambios Críticos en AWS Console

**Lee el archivo `AWS_24_7_CONFIG.md` para las instrucciones detalladas.**

**Cambios MÍNIMOS requeridos:**
1. **Paso 4 → Capacidad:**
   - Base bajo demanda: `0` → **`1`** ⚠️ CRÍTICO
   
2. **Paso 5 → Actualizaciones:**
   - Política de implementación: `AllAtOnce` → **`Rolling`** ⚠️ CRÍTICO

### 5. Subir el ZIP a AWS

1. Ve a la consola de AWS Elastic Beanstalk
2. Selecciona tu entorno `BrainyUSS-env`
3. Click en **"Cargar e implementar"**
4. Selecciona el archivo `brainy-backend-deploy.zip`
5. Click en **"Implementar"**

### 6. Verificar el Despliegue

1. Espera a que el estado cambie a **"Ok"** (verde)
2. Verifica el health check:
   ```bash
   curl https://tu-dominio.elasticbeanstalk.com/health
   ```
   Debe responder: `{"status":"ok","timestamp":"..."}`

3. Revisa los logs en CloudWatch o en la consola de EB

## 🔍 Troubleshooting

### La aplicación no inicia
- Revisa los logs en CloudWatch
- Verifica que `dist/main.js` existe en el ZIP
- Verifica que `Procfile` está en la raíz del ZIP

### Health check falla
- Verifica que el endpoint `/health` responde
- Revisa la configuración en `.ebextensions/01-nodejs.config`
- Verifica que el puerto sea 8080 (puerto estándar de EB)

### La instancia se apaga
- **CRÍTICO:** Verifica que "Base bajo demanda" sea `1` o mayor
- Revisa las métricas de CPU/memoria en CloudWatch
- Verifica que no haya errores en los logs

### Error de permisos
- Verifica que el rol IAM `aws-elasticbeanstalk-ec2-role` tenga los permisos necesarios
- Verifica que el rol de servicio tenga permisos para CloudWatch

## 📊 Monitoreo

### CloudWatch Metrics
- `CPUUtilization`: Debe estar < 80%
- `NetworkIn/NetworkOut`: Tráfico de red
- `StatusCheckFailed`: Debe ser 0

### Logs
- `/var/log/eb-engine.log`: Logs del motor de EB
- `/var/log/eb-hooks.log`: Logs de hooks
- `/var/log/nginx/access.log`: Accesos HTTP
- `/var/log/nginx/error.log`: Errores nginx

## 💰 Costos Estimados

- **1 instancia t3.small 24/7**: ~$15-20 USD/mes
- **Load Balancer**: ~$16 USD/mes (solo si usas "Carga equilibrada")
- **CloudWatch Logs**: ~$0.50 USD/GB

**Total mínimo (1 instancia, sin LB)**: ~$15-20 USD/mes
**Total con alta disponibilidad (2 instancias + LB)**: ~$46-56 USD/mes

## 🔄 Actualizaciones Futuras

Para actualizar la aplicación:

1. Hacer cambios en el código
2. Compilar: `npm run build`
3. Crear nuevo ZIP: `create-deploy-zip.bat` o `create-deploy-zip.sh`
4. Subir a AWS EB
5. AWS hará el despliegue con la política configurada (Rolling = sin downtime)

## 📝 Notas Importantes

- El health check debe responder en menos de 5 segundos
- Las instancias se reinician automáticamente si fallan (si está habilitado)
- Los logs se retienen por 7 días (configurado en `.ebextensions/02-logs.config`)
- El tamaño máximo de archivo subido es 50MB (configurado en nginx)



