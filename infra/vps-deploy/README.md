# VPS deployment

Triển khai qua Docker Compose (`infra/docker-compose.yml`) — 3 service: `postgres`, `backend`
(NestJS, build từ `apps/backend/Dockerfile`), `frontend` (nginx phục vụ static build + reverse-proxy
`/api/` sang `backend:3003`, build từ `apps/frontend/Dockerfile`). Chỉ `frontend` expose port ra host
(80) — `postgres`/`backend` chỉ nội bộ trong docker network, không mở port ra ngoài.

## Chạy lần đầu trên VPS

```bash
git clone https://github.com/thetaivnpt-design/fsolution.git
cd fsolution/infra
cp .env.example .env
# Sửa .env: POSTGRES_PASSWORD, JWT_SECRET (giá trị thật, không dùng mẫu), FRONTEND_URL (domain thật)
./vps-deploy/deploy.sh
```

`backend` container tự chạy `npx prisma migrate deploy` mỗi lần khởi động trước khi start server —
idempotent (không có gì để áp dụng thì bỏ qua), không cần bước deploy migration thủ công riêng.

## Cập nhật lên phiên bản mới

```bash
cd fsolution
git pull
cd infra && docker compose build && docker compose up -d
```

## Rollback

```bash
git checkout <commit-truoc-do>
cd infra && docker compose build && docker compose up -d
```

Không có bước rollback migration tự động — nếu migration mới không tương thích ngược, cần tự viết
migration "down" thủ công (Prisma không sinh file rollback tự động) trước khi checkout code cũ.

## Trạng thái

Dockerfile/compose đã viết và đã verify tương đương (npm install + build + test standalone ngoài
monorepo `ai-agent-os`, xem `docs/releases/`) — môi trường phát triển hiện tại **không có `docker`
binary** nên chưa tự chạy được `docker build`/`docker compose up` thật trên máy này. Cần verify lại
bằng `docker build` thật trên VPS hoặc máy có Docker trước lần deploy đầu tiên.
