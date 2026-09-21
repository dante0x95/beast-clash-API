# Beast Clash API

API REST para **Beast Clash**, una aplicación de batallas de monstruos por turnos.

La API permite crear y administrar monstruos, simular batallas determinísticas entre dos participantes, guardar el historial completo de cada combate y devolver los turnos necesarios para que un frontend pueda reproducir la batalla visualmente.

## API desplegada

- API: https://beast-clash-api.onrender.com
- Swagger UI: https://beast-clash-api.onrender.com/docs
- OpenAPI JSON: https://beast-clash-api.onrender.com/docs/openapi.json
- Readiness: https://beast-clash-api.onrender.com/health/ready
- Liveness: https://beast-clash-api.onrender.com/health/live

> La API está desplegada en el plan gratuito de Render y PostgreSQL está alojado en Neon. Después de un periodo sin tráfico, la primera petición puede tardar más mientras los servicios vuelven a activarse.

---

## Funcionalidades

- CRUD de monstruos
- Soft delete de monstruos
- Simulación de batallas por turnos
- Historial persistente de batallas
- Snapshots inmutables de los monstruos participantes
- Log completo de turnos para reproducción en frontend
- Paginación por offset
- Validación de requests con Zod
- Formato uniforme de errores
- CORS configurable
- Rate limiting por IP
- Headers de seguridad con Helmet
- Request IDs y logs estructurados
- Endpoints separados de liveness y readiness
- Swagger / OpenAPI 3.1
- Migraciones con Prisma
- Seed idempotente con monstruos de ejemplo
- Tests unitarios, de integración y property-based
- Imagen Docker de producción
- CI con GitHub Actions
- Deploy en Render + Neon

---

## Stack

| Área | Tecnología |
| --- | --- |
| Runtime | Node.js 24 |
| Lenguaje | TypeScript 6 en modo estricto |
| HTTP | Express 5 |
| Base de datos local | PostgreSQL 18 |
| Base de datos producción | PostgreSQL en Neon |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Validación | Zod 4 |
| Documentación | Swagger UI + OpenAPI 3.1 |
| Tests | Vitest 5, Supertest, fast-check |
| Logging | pino + pino-http |
| Seguridad HTTP | Helmet, CORS, express-rate-limit |
| Calidad | ESLint, Husky, lint-staged, commitlint |
| CI | GitHub Actions |
| Contenedores | Docker + Docker Compose |
| Deploy | Render + Neon |

> El proyecto usa Prisma 7 de forma intencional. Los upgrades de versión mayor deben validarse antes de aplicarse.

---

## Reglas de batalla

Una batalla recibe dos monstruos existentes y simula el combate hasta que uno de ellos llega a `0` HP.

### Orden de ataque

Ataca primero el monstruo con mayor `speed`.

Si ambos tienen la misma velocidad, ataca primero el que tenga mayor `attack`.

Si también empatan en ataque, comienza **monster A**, es decir, el monstruo enviado como `monsterAId`.

El orden inicial se decide una sola vez y después los turnos se alternan.

### Daño

```text
damage = attacker.attack - defender.defense
```

El daño mínimo siempre es:

```text
1
```

Ejemplo:

```text
attack = 30
defense = 40

damage = 1
```

### Fin de la batalla

La batalla termina cuando la vida de uno de los monstruos llega a `0`.

Cada turno registra:

```json
{
  "turn": 1,
  "attackerId": "uuid",
  "defenderId": "uuid",
  "damage": 35,
  "defenderHpAfter": 55
}
```

`damage` conserva el daño completo calculado aunque sea mayor que la vida restante.

`defenderHpAfter` nunca baja de `0`.

Como todo ataque hace al menos `1` de daño, toda batalla válida está garantizada a terminar.

---

## Snapshots de batalla

Cada batalla guarda una copia de los datos de ambos monstruos en el momento del combate:

```text
name
imageUrl
hp
attack
defense
speed
```

Esto permite que el historial no cambie si posteriormente un monstruo es editado o eliminado.

---

## Arquitectura

El flujo principal de una request es:

```text
HTTP request
    ↓
Router
    ↓
Service
    ↓
Repository
    ↓
Prisma
    ↓
PostgreSQL
```

El motor de batalla está separado de toda infraestructura:

```text
src/domain/battle/
```

Es TypeScript puro y no depende de Express, Prisma, PostgreSQL ni logging.

La inyección de dependencias se realiza mediante factories:

```text
createApp(deps)
createMonsterService(repo)
createBattleService(...)
createPrismaMonsterRepository(prisma)
```

No se utilizan singletons ni clases de servicio.

---

## Estructura principal

```text
.
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── docs/
│   ├── domain/
│   │   └── battle/
│   ├── lib/
│   ├── modules/
│   │   ├── battles/
│   │   ├── health/
│   │   └── monsters/
│   ├── scripts/
│   ├── shared/
│   ├── testing/
│   ├── app.ts
│   └── index.ts
├── docker/
├── Dockerfile
├── docker-compose.yml
├── prisma.config.ts
├── tsconfig.json
├── tsconfig.build.json
└── vitest.config.mts
```

---

## Documentación de la API

La documentación interactiva está disponible en:

```text
https://beast-clash-api.onrender.com/docs
```

Swagger permite revisar los schemas y ejecutar requests directamente desde el navegador.

El documento OpenAPI 3.1 está disponible en:

```text
https://beast-clash-api.onrender.com/docs/openapi.json
```

---

## Endpoints

### Health

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/health/live` | Confirma que el proceso HTTP está vivo |
| `GET` | `/health/ready` | Confirma que la API y la base de datos están disponibles |
| `GET` | `/health` | Alias de readiness |

### Monstruos

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/monsters` | Crear un monstruo |
| `GET` | `/monsters` | Listar monstruos con paginación |
| `GET` | `/monsters/:id` | Obtener un monstruo |
| `PATCH` | `/monsters/:id` | Editar un monstruo |
| `DELETE` | `/monsters/:id` | Eliminar un monstruo mediante soft delete |

### Batallas

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/battles` | Simular y guardar una batalla |
| `GET` | `/battles` | Listar historial de batallas |
| `GET` | `/battles/:id` | Obtener una batalla con todos sus turnos |
| `DELETE` | `/battles/:id` | Eliminar físicamente una batalla |

---

## Modelo de monstruo

Ejemplo:

```json
{
  "id": "uuid",
  "name": "Emberclaw",
  "hp": 120,
  "attack": 55,
  "defense": 20,
  "speed": 60,
  "imageUrl": "https://example.com/monster.png",
  "createdAt": "2026-09-21T00:00:00.000Z",
  "updatedAt": "2026-09-21T00:00:00.000Z"
}
```

Límites actuales:

| Campo | Límite |
| --- | --- |
| `name` | 1–50 caracteres |
| `hp` | 1–1000 |
| `attack` | 0–100 |
| `defense` | 0–100 |
| `speed` | 0–100 |
| `imageUrl` | URL HTTP o HTTPS |

Los schemas rechazan propiedades desconocidas.

Los valores numéricos del body deben enviarse como números. Por ejemplo, `"30"` no se acepta como reemplazo de `30`.

---

## Paginación

Los endpoints de listado utilizan paginación por offset.

Ejemplo:

```http
GET /monsters?page=1&pageSize=20
```

Respuesta:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

Reglas:

```text
page >= 1
1 <= pageSize <= 100
pageSize por defecto = 20
```

---

## Formato de errores

Todos los errores HTTP siguen la misma estructura:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "issues": [
      {
        "path": "hp",
        "message": "..."
      }
    ]
  }
}
```

Códigos utilizados:

```text
VALIDATION_ERROR
INVALID_JSON
NOT_FOUND
ROUTE_NOT_FOUND
PAYLOAD_TOO_LARGE
RATE_LIMITED
INTERNAL_ERROR
```

Los errores internos nunca exponen al cliente la excepción original.

---

## Ejecutar el proyecto localmente

### Requisitos

- Node.js 24
- Docker
- Docker Compose

La versión esperada de Node está definida en:

```text
.node-version
```

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el archivo de entorno

```bash
cp .env.example .env
```

Ejemplo local:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://beast:beast@localhost:5433/beast_clash
LOG_LEVEL=debug
```

### 3. Levantar PostgreSQL

```bash
npm run db:up
```

La base local queda disponible en:

```text
host: localhost
port: 5433
database: beast_clash
user: beast
password: beast
```

### 4. Aplicar migraciones

```bash
npm run db:migrate
```

### 5. Crear los datos de ejemplo

```bash
npm run db:seed
```

El seed es idempotente: si ya existen monstruos, no inserta una segunda copia.

### 6. Arrancar la API

```bash
npm run dev
```

### 7. Verificar

```bash
curl http://localhost:3001/health/ready
```

Respuesta esperada:

```json
{
  "db": "up",
  "status": "ok"
}
```

Swagger local:

```text
http://localhost:3001/docs
```

---

## Variables de entorno

| Variable | Default | Descripción |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP |
| `NODE_ENV` | `development` | `development`, `production` o `test` |
| `DATABASE_URL` | requerida | Connection string de PostgreSQL |
| `LOG_LEVEL` | `info` | Nivel de logs de pino |
| `CORS_ORIGINS` | vacío | Lista de orígenes permitidos separados por coma |
| `TRUST_PROXY` | `0` | Cantidad de proxies confiables delante de Express |
| `RATE_LIMIT_MAX` | `100` | Requests máximas por IP y ventana |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Duración de la ventana en milisegundos |

En Render:

```env
TRUST_PROXY=1
LOG_LEVEL=info
```

Render proporciona `PORT` automáticamente.

Mientras no exista frontend, `CORS_ORIGINS` puede permanecer vacío.

Cuando se despliegue el frontend, debe configurarse con el origen exacto permitido.

---

## Base de datos

### Monsters

Los monstruos usan soft delete mediante `deleted_at`.

Todas las lecturas normales excluyen registros eliminados.

La base de datos incluye restricciones para evitar:

- nombres vacíos
- HP no positivo
- attack negativo
- defense negativo
- speed negativo

### Battles

Las batallas son registros inmutables.

Al usar `DELETE /battles/:id`, la batalla se elimina físicamente.

Cada batalla guarda:

- IDs de ambos participantes
- winner ID
- loser ID
- snapshot de monster A
- snapshot de monster B
- número total de turnos
- log completo de turnos
- fecha de creación

La base de datos también protege invariantes como:

- los participantes deben ser distintos
- winner y loser deben pertenecer a la batalla
- winner y loser deben ser diferentes
- `totalTurns` debe ser positivo
- el número de objetos en `turns` debe coincidir con `totalTurns`
- los snapshots deben ser objetos JSON

---

## Seeds

El proyecto incluye siete monstruos de ejemplo diseñados para demostrar distintas reglas del motor de batalla.

Entre los escenarios cubiertos están:

- ventaja por velocidad
- desempate por ataque
- empate total de velocidad y ataque
- daño mínimo de `1`
- diferencias de HP

Ejecutar:

```bash
npm run db:seed
```

En producción también puede ejecutarse el script compilado:

```bash
node dist/scripts/seed.js
```

---

## Tests

### Unitarios

```bash
npm test
```

### Integración

Primero levantar PostgreSQL:

```bash
npm run db:up
```

Después:

```bash
npm run test:integration
```

### Todos

```bash
npm run test:all
```

### Coverage

```bash
npm run test:coverage
```

La suite cubre, entre otras cosas:

- reglas del dominio de batalla
- comportamiento de services
- repositories
- rutas HTTP
- integración con PostgreSQL
- snapshots
- health checks
- CORS
- rate limiting
- límite de payload
- headers de seguridad
- schemas de OpenAPI
- invariantes de batalla con property-based testing

Al cierre de la implementación previa al deploy, el proyecto contaba con:

```text
172 tests unitarios
28 tests de integración
```

---

## Scripts útiles

| Script | Uso |
| --- | --- |
| `npm run dev` | Desarrollo con watch mode |
| `npm run build` | Compilar TypeScript de producción |
| `npm start` | Ejecutar el build |
| `npm run typecheck` | Validar tipos |
| `npm run lint` | Ejecutar ESLint |
| `npm test` | Tests unitarios |
| `npm run test:watch` | Tests unitarios en watch |
| `npm run test:integration` | Tests de integración |
| `npm run test:all` | Ejecutar todos los proyectos de Vitest |
| `npm run test:coverage` | Ejecutar tests con coverage |
| `npm run db:up` | Levantar PostgreSQL local |
| `npm run db:down` | Detener PostgreSQL local |
| `npm run db:reset` | Recrear el volumen local |
| `npm run db:generate` | Generar Prisma Client |
| `npm run db:migrate` | Ejecutar migraciones de desarrollo |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:seed` | Crear monstruos de ejemplo |
| `npm run release` | Generar versión, changelog y tag |

---

## Docker

La imagen de producción utiliza un Dockerfile multi-stage basado en Node 24 Alpine.

Build:

```bash
docker build -t beast-clash-api .
```

Para probar localmente un flujo similar al de producción:

```bash
docker compose --profile app up --build
```

El profile ejecuta las migraciones antes de iniciar la aplicación.

---

## CI

GitHub Actions ejecuta:

```text
typecheck
    ↓
lint
    ↓
unit tests
    ↓
integration tests con PostgreSQL
    ↓
build
```

Además existe un job independiente que construye la imagen Docker de producción para detectar errores específicos del contenedor.

---

## Deploy

Producción:

```text
API: Render
Database: Neon PostgreSQL
```

URL:

```text
https://beast-clash-api.onrender.com
```

Render construye y ejecuta la aplicación desde el `Dockerfile`.

Health check configurado:

```text
/health/ready
```

### Migraciones de producción

Las migraciones de producción se ejecutan con:

```bash
npx prisma migrate deploy
```

No se ejecutan automáticamente cada vez que arranca una instancia de la aplicación.

Para el deploy actual, las migraciones y el seed se ejecutaron manualmente contra Neon antes de desplegar la API.

Ejemplo:

```bash
export DATABASE_URL="<neon-connection-string>"

npx prisma migrate deploy
npm run db:seed
```

Nunca debe commitearse una connection string de producción.

---

## Ejemplo de uso

### 1. Listar monstruos

```http
GET /monsters
```

### 2. Crear una batalla

```http
POST /battles
Content-Type: application/json
```

```json
{
  "monsterAId": "uuid-a",
  "monsterBId": "uuid-b"
}
```

La API responde con `201 Created`, el objeto de batalla y un header `Location` con la URL del recurso creado.

### 3. Obtener la batalla

```http
GET /battles/:id
```

La respuesta incluye los snapshots de los monstruos y el array completo de `turns`.

### 4. Eliminar la batalla

```http
DELETE /battles/:id
```

Respuesta correcta:

```text
204 No Content
```

---

## Seguridad y comportamiento HTTP

La API incluye:

- Helmet
- CORS configurable
- límite de body de `10kb`
- rate limit por IP
- configuración explícita de trusted proxy
- IDs únicos por request
- redacción de headers sensibles en los logs

`/health` y `/docs` están fuera del rate limiter de la API.

---

## Convenciones de desarrollo

- Conventional Commits
- commitlint para validar mensajes de commit
- Husky para Git hooks
- lint de archivos staged antes del commit
- TypeScript en modo estricto
- schemas HTTP con rechazo de propiedades desconocidas
- DTOs con listas blancas explícitas
- repositories que no lanzan excepciones por casos normales de "not found"
- services que traducen resultados del repository a errores de aplicación

---

## Estado actual

El backend está implementado y desplegado.

Completado:

- andamiaje de la aplicación
- motor de batalla
- CRUD de monstruos
- persistencia e historial de batallas
- infraestructura de tests de integración
- hardening HTTP
- seeds
- Swagger / OpenAPI
- imagen Docker de producción
- deploy en Render + Neon

Pendiente para cerrar la entrega:

- revisión final del README
- release `v1.0.0`

El frontend será un proyecto separado y no forma parte de este repositorio.

---

## Mejoras futuras

Algunas mejoras quedaron deliberadamente fuera del alcance actual:

- Redis para compartir el rate limit entre múltiples réplicas
- filtro de historial de batallas por monstruo
- nombres únicos para monstruos activos
- frontend y configuración de CORS de producción
