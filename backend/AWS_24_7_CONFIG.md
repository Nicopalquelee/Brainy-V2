# Configuración AWS Elastic Beanstalk para 24/7

## ⚠️ Cambios Críticos Necesarios en AWS Console

Para que tu aplicación corra 24/7 sin interrupciones, necesitas hacer los siguientes cambios en la consola de AWS Elastic Beanstalk:

### 1. **Capacidad (Paso 4: Escalado y tráfico de instancias)**

**CAMBIAR:**
- **Tipo de entorno**: De "Instancia única" a **"Carga equilibrada"** (Load Balanced)
- **Base bajo demanda**: De `0` a **`1`** (MÍNIMO 1 instancia siempre corriendo)
- **Bajo demanda por encima de la base**: De `70` a **`1`** (máximo 2 instancias total)

**Razón**: Con "Base bajo demanda: 0", AWS puede apagar todas las instancias cuando no hay tráfico, lo que significa que tu app no estará disponible 24/7.

### 2. **Política de Implementación (Paso 5)**

**CAMBIAR:**
- **Política de implementación**: De "AllAtOnce" a **"Rolling"** o **"Immutable"**
- **Tamaño del lote de implementación**: `50` (Percentage)
- **Tipo de tamaño de lote de implementación**: Percentage

**Razón**: "AllAtOnce" causa downtime porque apaga todas las instancias al mismo tiempo. "Rolling" actualiza una instancia a la vez, manteniendo el servicio activo.

### 3. **Health Check (Paso 5)**

**VERIFICAR/CONFIGURAR:**
- **Health Check URL**: `/health` (ya configurado en .ebextensions)
- **Ignorar comprobación de estado**: `false` (mantener así)
- **Umbral de estado**: `Ok`

### 4. **Tipo de Instancia**

**RECOMENDACIÓN:**
- **Tipos de instancia**: `t3.small` (mínimo recomendado para producción 24/7)
- Considera usar solo `t3.small` en lugar de `t3.micro,t3.small` para consistencia

**Razón**: `t3.micro` es muy pequeño y puede causar problemas de rendimiento y timeouts.

### 5. **Sustitución de Instancia (Paso 5)**

**OPCIONAL PERO RECOMENDADO:**
- **Sustitución de instancia**: `true` (habilitar)

**Razón**: Esto permite que AWS reemplace instancias automáticamente si fallan, mejorando la disponibilidad.

### 6. **Monitoreo (Paso 5)**

**YA ESTÁ BIEN CONFIGURADO:**
- ✅ Sistema: enhanced
- ✅ Retención: 7 días
- ✅ Correo electrónico de notificaciones: soporte@brainyai.cl

## 📋 Resumen de Configuración Recomendada

### Paso 4: Escalado y tráfico de instancias
```
Tipo de entorno: Carga equilibrada
Base bajo demanda: 1
Bajo demanda por encima de la base: 1
Tipos de instancia: t3.small
```

### Paso 5: Actualizaciones, monitoreo y registro
```
Política de implementación: Rolling
Tamaño del lote de implementación: 50
Tipo de tamaño de lote: Percentage
Sustitución de instancia: true (recomendado)
Health Check URL: /health
```

## 🔧 Archivos de Configuración Creados

Se han creado los siguientes archivos en `.ebextensions/`:

1. **01-nodejs.config**: Configuración de Node.js, health check, y auto-scaling
2. **02-logs.config**: Configuración de logs y CloudWatch
3. **03-nginx.config**: Configuración de nginx para archivos grandes y timeouts

## 📦 Próximos Pasos

1. **Actualizar el ZIP de despliegue**:
   ```bash
   cd backend
   # Asegúrate de incluir la carpeta .ebextensions en el ZIP
   zip -r ../brainy-backend-deploy.zip . -x "node_modules/*" "dist/*" "coverage/*" "uploads/*" "*.log"
   ```

2. **Hacer los cambios en AWS Console** según las recomendaciones arriba

3. **Subir el nuevo ZIP** a Elastic Beanstalk

4. **Verificar** que el health check funcione: `https://tu-dominio.elasticbeanstalk.com/health`

## 💰 Consideraciones de Costo

- **1 instancia t3.small 24/7**: ~$15-20 USD/mes
- **2 instancias t3.small (con auto-scaling)**: ~$30-40 USD/mes
- **Load Balancer**: ~$16 USD/mes adicional

**Total estimado**: ~$31-56 USD/mes para alta disponibilidad 24/7

## ⚡ Alternativa de Bajo Costo (Solo 1 instancia)

Si quieres minimizar costos y aceptas un pequeño riesgo de downtime:

- **Tipo de entorno**: Instancia única
- **Base bajo demanda**: 1
- **Costo**: ~$15-20 USD/mes (sin load balancer)

**Nota**: Con esta configuración, si la instancia falla, habrá downtime hasta que AWS la reemplace (generalmente 5-10 minutos).

## 🔍 Verificación Post-Despliegue

1. Verifica que el health check responda:
   ```bash
   curl https://tu-dominio.elasticbeanstalk.com/health
   ```

2. Revisa los logs en CloudWatch o en la consola de EB

3. Monitorea las métricas en CloudWatch para asegurar que la instancia esté siempre corriendo



