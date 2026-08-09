# Inside Nest API — multi-stage image (e.g. Fly.io)
FROM node:20-bookworm-slim AS base
RUN apt-get update -qq \
  && apt-get install -y -qq openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY packages/eslint-config ./packages/eslint-config

RUN pnpm --filter @inside/database exec prisma generate
RUN pnpm --filter @inside/database build
RUN node -e "const fs=require('fs');const p='packages/database/package.json';const j=JSON.parse(fs.readFileSync(p,'utf8'));j.main='./dist/index.js';j.types='./dist/index.d.ts';j.exports={'.':'./dist/index.js'};fs.writeFileSync(p,JSON.stringify(j,null,2));"
RUN pnpm --filter api build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/database ./packages/database

WORKDIR /app/apps/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
