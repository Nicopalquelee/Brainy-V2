# BrainyV2 Infrastructure

Este repositorio contiene la configuración de infraestructura para BrainyV2.

## 🏗️ Arquitectura

### Base de Datos
- **Supabase**: Base de datos principal (PostgreSQL en la nube)
- **Row Level Security**: Seguridad a nivel de fila
- **Authentication**: Sistema de autenticación integrado

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Cuenta en Supabase

### Configuración

1. **Crear proyecto en Supabase**:
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Anota la URL y API keys

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   ```
   
   Actualiza el archivo `.env` con tus datos de Supabase:
   ```bash
   SUPABASE_URL=https://tu-proyecto-id.supabase.co
   SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   ```

3. **Configurar base de datos**:
   - En Supabase, ve al SQL Editor
   - Ejecuta el contenido de `supabase-schema.sql`

4. **Configurar frontend**:
   ```bash
   cd front/
   cp .env.example .env
   # Actualizar .env con tus credenciales de Supabase
   npm install
   npm run dev
   ```

## 🔧 Comandos Útiles

### Frontend
```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar tests
npm run test

# Ejecutar linting
npm run lint
```

### Base de Datos (Supabase)
```bash
# Todas las operaciones se realizan desde el dashboard de Supabase:
# - SQL Editor para ejecutar queries
# - Table Editor para modificar estructura
# - Auth para gestionar usuarios
# - Storage para archivos

# Restaurar base de datos
docker-compose exec -T db psql -U postgres < backup.sql
```

### Testing
```bash
# Ejecutar tests de base de datos
./scripts/test-database.sh

# Ejecutar análisis de seguridad
./scripts/security-scan.sh
```

## 🔒 Seguridad

### Configuración de Autenticación
- **Local**: Trust (desarrollo)
- **Remoto**: MD5 (producción)
- **Replicación**: Trust (localhost)

### Mejores Prácticas
1. **Variables de entorno**: Nunca hardcodear credenciales
2. **Redes**: Restringir acceso a la base de datos
3. **Backups**: Implementar estrategia de respaldo
4. **Monitoreo**: Configurar alertas de seguridad

## 📊 Monitoreo

### Métricas Importantes
- **Conexiones activas**: `SELECT count(*) FROM pg_stat_activity;`
- **Tamaño de base de datos**: `SELECT pg_size_pretty(pg_database_size('acaduss_db'));`
- **Consultas lentas**: `SELECT * FROM pg_stat_statements ORDER BY total_time DESC;`

### Logs
```bash
# Ver logs de PostgreSQL
docker-compose logs db

# Filtrar logs por nivel
docker-compose logs db | grep ERROR
```

## 🚀 Despliegue

### Desarrollo
```bash
cd front/
npm run dev
```

### Producción
1. Configurar proyecto en Supabase
2. Configurar variables de entorno de producción
3. Desplegar frontend (Vercel, Netlify, etc.)
4. Configurar dominio personalizado

## � Estructura de Archivos

```
infra/
├── supabase-schema.sql      # Schema completo de la base de datos
├── SUPABASE_README.md       # Documentación detallada de Supabase  
├── .env.example            # Variables de entorno de ejemplo
├── docker-compose.yml      # Configuración simplificada (opcional)
└── README.md              # Este archivo
```

## 🛠️ Troubleshooting

### Problemas Comunes

#### Puerto en uso
```bash
# Verificar puerto
netstat -tulpn | grep 5432

# Cambiar puerto en docker-compose.yml
ports:
  - "5433:5432"
```

#### Permisos de volumen
```bash
# Cambiar permisos
sudo chown -R 999:999 postgres_data/
```

#### Conexión rechazada
```bash
# Verificar configuración de red
docker network ls
docker network inspect infra_default
```

## 📚 Documentación

- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/)

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature
3. Commit cambios
4. Push a la rama
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.








