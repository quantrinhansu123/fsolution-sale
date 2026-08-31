# Build context is the PROJECT ROOT (projects/fsolution), not apps/backend — this Dockerfile
# needs the workspace root package.json + tsconfig.json (see /tsconfig.json, added so this project
# is self-contained now that it lives in its own dedicated repo, independent of the ai-agent-os
# monorepo). Build: `docker build -f apps/backend/Dockerfile -t fsolution-backend .` from the
# project root.

FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm install

COPY tsconfig.json ./
COPY apps/backend apps/backend
WORKDIR /repo/apps/backend
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/backend ./apps/backend

WORKDIR /repo/apps/backend
EXPOSE 3003

# prisma migrate deploy runs on every container start — safe/idempotent (no-op when there's
# nothing pending), and keeps the schema in sync without a separate manual deploy step on the VPS.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
