.# Portal Académico USS - Backend
# Portal Académico USS - Backend

Backend construido con NestJS + TypeScript, TypeORM y PostgreSQL.

Resumen rápido:
- API REST para autenticación, gestión de usuarios, documentos, rating y chatbot.
- Swagger/OpenAPI disponible en `/docs`.

Requisitos locales:
- Node.js (>=16), npm
- Docker Desktop (para levantar Postgres) o un Postgres local

Pasos para ejecutar localmente (recomendado)

1) Copiar variables de entorno

```cmd
cd c:\developer\backend
copy .env.example .env
```

2) Instalar dependencias

```cmd
npm install
```

3) Levantar la base de datos (desde la carpeta raíz `infra/`)

```cmd
cd ..\infra
docker compose up -d
```

Nota: si Docker no está disponible, puedes apuntar a un Postgres local ajustando las variables en `backend/.env`.

4) Arrancar la aplicación (modo producción/ts-node)

```cmd
cd ..\backend
npm run start
```

5) Ejecutar tests

```cmd
npm test
```

Opciones útiles
- Para desarrollo con el CLI local (si `nest` no está instalado global):

```cmd
npx nest start --watch
```

- Si quieres arrancar la app sin conectar a la base de datos (útil para depurar rutas que no usan DB):

```cmd
set SKIP_DB=true    # Windows cmd
npm run start
```

Verificación rápida de endpoints
- Health:  http://localhost:3000/api/health
- Swagger UI: http://localhost:3000/docs
- Chat endpoint (POST): http://localhost:3000/api/chat/query

Ejemplo curl (Windows cmd) para probar el chat (responde con un error si no hay GEMINI_API_KEY):

```cmd
curl -X POST http://localhost:3000/api/chat/query -H "Content-Type: application/json" -d "{\"text\":\"hola mundo\"}"
```

Nota sobre la base de datos
- El repositorio incluye `infra/docker-compose.yml` que levanta un contenedor Postgres. Por defecto el contenedor usa las variables en `infra/docker-compose.yml` (usuario `admin`, contraseña `acaduss123`, base `ACADUSS`). Si prefieres usar esas credenciales copia `.env.example` a `.env` y ajusta las variables `DB_*` o exporta variables de entorno antes de arrancar la app.

Documentación
- Swagger: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs-json

Notas
- El archivo `project_context.md` en `backend/` describe los endpoints y la arquitectura esperada.
- Eliminamos un proyecto Django experimental que se creó durante el desarrollo; este repositorio está preparado para NestJS.

Contacto
- Si algo falla al levantar Postgres o la app, revisa los logs de Docker y ejecuta `npm test` para validar el comportamiento del código.
