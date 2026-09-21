# Beast Clash API

API REST para **Batalla de Monstruos**: permite crear, editar y eliminar monstruos, y simular batallas por turnos entre dos de ellos. El resultado de cada batalla se guarda con su log completo, turno a turno, para que el frontend pueda reproducirla.

![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![CI](https://github.com/dante0x95/beast-clash-API/actions/workflows/ci.yml/badge.svg)

---

## Stack

| Pieza | Herramienta |
|---|---|
| Runtime | Node 24 (ESM, `--env-file` nativo) |
| Lenguaje | TypeScript estricto |
| HTTP | Express 5 |
| Base de datos | PostgreSQL 17 (Docker Compose en local) |
| Acceso a datos | _Por definir_ |
| Validación | Zod v4 (entorno y requests) |
| Tests | Vitest |
| Logs | pino (+ pino-pretty en dev) |
| Calidad | ESLint (sin Prettier), Husky, commitlint |
| CI | GitHub Actions: typecheck → lint → test → build |

---

## Reglas de batalla

1. **Orden de ataque:** ataca primero el monstruo con mayor `speed`. Si hay empate, el de mayor `attack`. Si también empatan en ataque: _por definir_.
2. **Daño:** `attack` del atacante − `defense` del defensor, con un mínimo de **1**.
3. **Fin:** la batalla termina cuando la vida de un monstruo llega a 0.
4. **Resultado:** se registra el ganador, el perdedor, el total de turnos y el log de cada turno.

La simulación es una función pura en `src/domain/battle/`, sin I/O, y está cubierta por tests unitarios.

Cada batalla guarda un **snapshot** de los stats de ambos monstruos. Por eso editar o eliminar un monstruo no altera el historial.

---

## Requisitos

- **Node 24.** La versión exacta está en `.node-version`.
- **Docker** y Docker Compose, para levantar Postgres en local.

---

## Puesta en marcha

```bash
# 1. Instalar dependencias (activa también los git hooks)
npm install

# 2. Variables de entorno
cp .env.example .env

# 3. Levantar Postgres
docker compose up -d

# 4. Arrancar en modo desarrollo
npm run dev
```

Verifica que todo funciona:

```bash
curl http://localhost:3000/health
```

---

## Variables de entorno

Se validan con Zod al arrancar. Si alguna falta o no es válida, la app se detiene con un error legible.

| Variable | Default | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `PORT` | `3000` | Puerto HTTP |
| `DATABASE_URL` | — (requerida) | Cadena de conexión a Postgres |
| `LOG_LEVEL` | `info` | `fatal` \| `error` \| `warn` \| `info` \| `debug` \| `trace` |

---

## Endpoints

| Método | Ruta | Descripción | Estado |
|---|---|---|---|
| `GET` | `/health` | Estado de la API y de la conexión a la DB | Fase 1 |
| `POST` | `/monsters` | Crear un monstruo | Planeado |
| `GET` | `/monsters` | Listar monstruos (paginado) | Planeado |
| `GET` | `/monsters/:id` | Detalle de un monstruo | Planeado |
| `PATCH` | `/monsters/:id` | Editar un monstruo | Planeado |
| `DELETE` | `/monsters/:id` | Eliminar un monstruo (soft delete) | Planeado |
| `POST` | `/battles` | Simular y registrar una batalla | Planeado |
| `GET` | `/battles` | Historial de batallas (paginado) | Planeado |
| `GET` | `/battles/:id` | Detalle con el log de turnos | Planeado |
| `DELETE` | `/battles/:id` | Eliminar una batalla | Planeado |

### Ejemplo: crear una batalla

```http
POST /battles
Content-Type: application/json

{ "monsterAId": "uuid-a", "monsterBId": "uuid-b" }
```

```json
{
  "id": "uuid-batalla",
  "winnerId": "uuid-a",
  "loserId": "uuid-b",
  "totalTurns": 7,
  "turns": [
    { "turn": 1, "attackerId": "uuid-a", "defenderId": "uuid-b", "damage": 12, "defenderHpAfter": 48 }
  ]
}
```

---

## Scripts

| Script | Para qué |
|---|---|
| `npm run dev` | Desarrollo con recarga (`tsx watch`) |
| `npm run build` | Compila a `dist/` |
| `npm start` | Ejecuta el build |
| `npm run typecheck` | Solo verifica tipos |
| `npm run lint` | Lint y formato (`--fix` para corregir) |
| `npm test` | Tests (una vez) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Tests con cobertura |
| `npm run release` | Bump de versión, tag y changelog |

---

## Estructura

```
src/
├── config/              # env.schema.ts (puro) + env.ts (valida al arrancar)
├── domain/battle/       # motor de batalla: función pura + tipos
├── modules/
│   ├── monsters/        # controller, service, repository, schemas
│   └── battles/
├── shared/              # errores, middlewares, db
├── lib/logger.ts        # instancia de pino
├── app.ts               # crea la app de Express (sin listen, testeable)
└── index.ts             # listen + graceful shutdown
```

---

## Roadmap

- [ ] **Fase 1 — Andamiaje:** Express, conexión a Postgres, `/health`, Docker Compose
- [ ] **Fase 2 — Motor de batalla** con TDD
- [ ] **Fase 3 — Monstruos:** migraciones y CRUD
- [ ] **Fase 4 — Batallas:** simulación, snapshots, historial y borrado
- [ ] **Fase 5 — Pulido:** paginación, errores uniformes, CORS, rate limit
- [ ] **Fase 6 — Entrega:** seeds, colección de requests, despliegue (_por definir_)

---

## Convenciones

- Commits con [Conventional Commits](https://www.conventionalcommits.org/), validados por commitlint.
- `pre-commit`: `eslint --fix` sobre los archivos staged. `pre-push`: typecheck y tests de los archivos cambiados.
- Los módulos que definen no ejecutan: los schemas y el dominio son puros y no tienen efectos secundarios al importarse.

---

## Licencia

MIT