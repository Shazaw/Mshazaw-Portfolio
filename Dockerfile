# syntax=docker/dockerfile:1

# HOLOGRID — Payload needs a persistent Node server, so this is a plain
# long-running container rather than a serverless bundle. SQLite lives on a
# mounted volume at /app/data; uploads at /app/public/media.

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1 \
    PAYLOAD_TELEMETRY_DISABLED=1
WORKDIR /app

# ----------------------------------------------------------------- deps ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The build renders every public page, which means it queries Payload — so it
# needs a schema. A throwaway database is enough: real content arrives at
# runtime from the mounted volume, and pages revalidate on demand after that.
# Schema push is off in production, so the migrations do the work.
ENV DATABASE_URI=file:/tmp/build.db \
    NODE_ENV=production
# Build-stage only, never baked into the runtime image. The real secret is
# supplied as an environment variable when the container runs.
ARG PAYLOAD_SECRET=build-only-secret
RUN npm run migrate && npm run build

# ----------------------------------------------------------------- run -----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs \
 && mkdir -p /app/data /app/public/media \
 && chown -R nextjs:nodejs /app

COPY --from=deps  --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=build --chown=nextjs:nodejs /app/src ./src
COPY --from=build --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json

COPY --from=build --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
VOLUME ["/app/data", "/app/public/media"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npx", "next", "start"]
