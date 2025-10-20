# Project Context - Backend Portal Académico USS

## 1. Descripción General
El backend del **Portal Académico USS** será un API REST construida con **Node.js + NestJS** (u opcionalmente Express) y **PostgreSQL** como base de datos.  
El objetivo es soportar funcionalidades clave del portal: gestión de usuarios, roles, documentos académicos, sistema de rating, y un endpoint para integrar el **chatbot académico** (LangChain + OpenAI).

### Principios importantes:
- No se utilizará Docker dentro del backend; la base de datos y servicios estarán orquestados desde **infra/docker-compose.yml**.
- Todo el backend debe ser compatible con pipelines de **Azure DevOps**, incluyendo tests, build y análisis de seguridad.
- Se aplicarán buenas prácticas de calidad y estilo (Husky + ESLint + Prettier).
- Se integrará **SonarCloud** para análisis de calidad y seguridad del código.

---

## 2. Funcionalidades Principales

### Autenticación y Usuarios
- Registro de usuarios (`POST /auth/register`) con validación de correo institucional.
- Login (`POST /auth/login`) con JWT.
- Roles de usuarios: estudiante y administrador.
- Gestión de perfiles (`GET /users`, `GET /users/:id`, `PUT /users/:id`).

### Documentos Académicos
- CRUD de documentos: subir, listar, filtrar, eliminar.
- Sistema de rating (`POST /documents/:id/rate`) y filtrado por calificación/visitas.
- Endpoint `/documents/search` para buscar por materia o palabra clave.

### Chatbot Académico
- Endpoint `POST /chat/query` que recibe la consulta del usuario y devuelve la respuesta procesada con **LangChain + OpenAI**.
- Abstracción: la API Key de OpenAI nunca se expone al frontend.
- Posibilidad de recomendar documentos relacionados según la consulta.

### Salud del Sistema y Configuración
- Endpoint `/health` para verificar estado del backend.
- Endpoint `/config/cors` para revisar políticas CORS activas.

---

## 3. Arquitectura y Estructura de Carpetas

/backend
│── src/
│ ├── auth/ # Controladores, servicios y DTOs de autenticación
│ ├── users/ # CRUD usuarios y roles
│ ├── documents/ # CRUD documentos y rating
│ ├── chatbot/ # Integración con OpenAI + LangChain
│ ├── common/ # Filtros, pipes, interceptors, utilidades
│ ├── config/ # Configuración de entorno, CORS y variables
│ ├── main.ts # Entry point NestJS
│ └── app.module.ts # Modulos y dependencias
│
│── test/ # Pruebas unitarias y de integración con SQLite en memoria
│── tsconfig.json
│── package.json
│── .env # Variables locales, no subir credenciales reales
│── README.md
│── PROJECT_CONTEXT.md


---

## 4. Integración con PostgreSQL
- Conexión configurada usando variables de entorno:
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT`.
- No habrá Dockerfile; la DB se levanta desde `infra/docker-compose.yml`.
- Se puede usar **Prisma** o **TypeORM** para manejar la base de datos.

---

## 5. Calidad de Código
- **Husky**: pre-commit hooks para lint y tests.
- **ESLint + Prettier**: aplicar reglas de estilo y formato consistente.
- **SonarCloud**:
  - Integrado con Azure DevOps.
  - Se debe crear un Personal Access Token con permisos full.
  - Pipeline correrá análisis de calidad y seguridad.

---

## 6. CI/CD / Azure DevOps Pipelines
- Se creará un archivo `azure-pipelines.yml` dentro del backend para:
  - `npm install`
  - `npm run build`
  - `npm run test` (unitarios e integración)
  - Generación de artefacto para despliegue.
  - Ejecución de SonarCloud.
  - Empaquetado del backend en Docker desde infra (pipeline referenciando docker-compose).
- Pipeline construido **dentro del proyecto**, no desde Azure portal.
- Observación: si el pipeline falla, todo el flujo queda detenido.
- En fases posteriores se integrará **OWASP** y análisis de seguridad DevSecOps.

---

## 7. Seguridad y DevSecOps
- Políticas CORS activas y configurables.
- Tokens JWT para autenticación.
- Pipeline incluirá análisis de dependencias y vulnerabilidades (OWASP Dependency Check).
- Se documenta la transición de **DevOps → DevSecOps**, con seguridad continua.

---

## 8. Recomendaciones para Copilot
- Generar todo el **backend con NestJS**, incluyendo módulos, controladores, servicios y DTOs.  
- Generar **pruebas unitarias con `unittest` o Jest** simulando DB en memoria (SQLite).  
- Crear **Swagger/OpenAPI** documentando todos los endpoints propios (`/auth`, `/users`, `/documents`, `/chat/query`, `/health`).  
- Configurar pipelines en YAML según la sección CI/CD.  
- Aplicar Husky, ESLint, Prettier y SonarCloud en el flujo de commits y builds.  
- Todo código generado debe **respetar estructura de carpetas indicada**, sin incluir Dockerfile en backend.

---

Con este `PROJECT_CONTEXT.md`, Copilot tiene **todo el contexto necesario** para generar:  
- Estructura completa del backend.  
- Endpoints, servicios y controladores.  
- Conexión a PostgreSQL vía docker-compose.  
- Swagger, tests, calidad de código y pipeline YAML.  
- Buenas prácticas de seguridad y DevSecOps.

---
