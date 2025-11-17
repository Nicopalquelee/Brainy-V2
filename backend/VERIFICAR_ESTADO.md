# 🔍 Cómo Verificar si el Despliegue Está Correcto

## Estado "Pending" vs "Ok"

- **Pending** = El despliegue está en proceso (puede tardar 5-15 minutos)
- **Ok** (verde) = El despliegue fue exitoso y la app está corriendo
- **Warning** (amarillo) = Hay problemas menores
- **Severe** (rojo) = Hay errores críticos

## ✅ Pasos para Verificar

### 1. Revisar los Eventos
En la pestaña **"Eventos"** que estás viendo:

**Busca estos eventos:**
- ✅ `Environment health has transitioned from Pending to Ok` = **ÉXITO**
- ❌ `Environment health has transitioned to Severe` = **ERROR**
- ❌ `Failed to deploy application` = **ERROR**
- ⚠️ `Environment health has transitioned to Warning` = **ADVERTENCIA**

**Eventos normales durante el despliegue:**
- `Creating application version`
- `Deploying new version to instance(s)`
- `Successfully launched environment`

### 2. Verificar el Health Check

Una vez que el estado cambie a **"Ok"**, prueba:

```bash
curl https://brainyai.us-east-2.elasticbeanstalk.com/health
```

**Debe responder:**
```json
{"status":"ok","timestamp":"2024-..."}
```

### 3. Revisar los Logs

Ve a la pestaña **"Registros"** (Logs) y:
1. Click en **"Solicitar últimos 100 líneas"**
2. Busca errores en rojo
3. Verifica que veas: `Server listening on http://localhost:8080`

### 4. Verificar la Configuración Crítica

**IMPORTANTE:** Aunque el despliegue funcione, para que corra 24/7 necesitas:

1. **Ir a: Configuración → Capacidad**
   - Verificar que **"Base bajo demanda"** sea **1** o mayor
   - Si está en **0**, la app puede apagarse cuando no hay tráfico

2. **Ir a: Configuración → Actualizaciones**
   - Verificar que **"Política de implementación"** sea **"Rolling"** o **"Immutable"**
   - Si está en **"AllAtOnce"**, habrá downtime en cada actualización

## 🚨 Problemas Comunes

### El estado se queda en "Pending" por mucho tiempo (>20 minutos)
- Revisa los eventos para ver si hay errores
- Verifica que el ZIP incluya `dist/` (código compilado)
- Verifica que `Procfile` esté en la raíz del ZIP

### El estado cambia a "Severe" o "Warning"
- Ve a **"Registros"** y revisa los errores
- Verifica las variables de entorno en **Configuración → Seguridad**
- Verifica que el health check responda en `/health`

### La app se apaga después de un tiempo
- **CRÍTICO:** Verifica que "Base bajo demanda" sea **1** o mayor
- Revisa las métricas de CPU/memoria en **"Monitoreo"**
- Verifica que no haya errores que causen que la instancia se reinicie

## 📊 Monitoreo Continuo

Una vez que esté en **"Ok"**:

1. **Monitoreo** (pestaña): Verifica que:
   - CPU < 80%
   - StatusCheckFailed = 0
   - Hay tráfico de red

2. **Alarmas**: Configura alertas para:
   - Estado del entorno cambia a Warning/Severe
   - CPU > 80%
   - Health check falla

## ✅ Checklist Final

- [ ] Estado = **"Ok"** (verde)
- [ ] Health check responde: `/health`
- [ ] Logs muestran: `Server listening on http://localhost:8080`
- [ ] Base bajo demanda = **1** o mayor
- [ ] Política de implementación = **"Rolling"** o **"Immutable"**
- [ ] Variables de entorno configuradas correctamente
- [ ] La app responde en el dominio

## 🆘 Si Algo Falla

1. **Revisa los eventos** - Los eventos muestran qué salió mal
2. **Revisa los logs** - Los logs muestran errores específicos
3. **Verifica el ZIP** - Asegúrate de que incluya todos los archivos necesarios
4. **Revisa la configuración** - Verifica que no haya conflictos en `.ebextensions`



