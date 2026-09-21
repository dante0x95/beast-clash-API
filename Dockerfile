# syntax=docker/dockerfile:1

# ── base ──────────────────────────────────────────────────────
# openssl is required by Prisma's schema engine (prisma migrate deploy) on Alpine
FROM node:24-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
ENV HUSKY=0

# ── deps: every dependency, to build ─────────────────────────
FROM base AS deps
# prisma.config.ts reads DATABASE_URL even for `prisma generate` (postinstall).
# ARG, not ENV: the placeholder never reaches the final image
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ── build: generate the Prisma client and compile ─────────────
FROM deps AS build
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx prisma generate && npm run build

# ── prod-deps: runtime dependencies only ─────────────────────
FROM base AS prod-deps
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# husky is a dev dependency, so its prepare hook would fail here
RUN npm pkg delete scripts.prepare \
  && npm ci --omit=dev \
  && npm cache clean --force

# ── runtime ───────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000
COPY --from=prod-deps /app/node_modules ./node_modules
# package.json: read by the OpenAPI document for its version.
# prisma/ + prisma.config.ts: needed by `npx prisma migrate deploy` (release command)
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/health/live').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/index.js"]