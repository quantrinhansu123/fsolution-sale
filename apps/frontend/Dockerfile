# Build context is the PROJECT ROOT (projects/fsolution), same reason as apps/backend/Dockerfile.
# Build: `docker build -f apps/frontend/Dockerfile -t fsolution-frontend .` from the project root.

FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm install

COPY tsconfig.json ./
COPY apps/frontend apps/frontend
COPY packages/shared-types packages/shared-types
WORKDIR /repo/apps/frontend

# Baked into the static bundle at build time (Vite) — default matches the nginx reverse-proxy
# path below, override via --build-arg for a different deploy topology.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=builder /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
