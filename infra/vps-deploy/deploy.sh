#!/usr/bin/env bash
# Chạy trên VPS, từ thư mục gốc repo đã clone (thetaivnpt-design/fsolution).
# Yêu cầu: Docker + Docker Compose plugin đã cài, infra/.env đã tạo từ infra/.env.example
# (POSTGRES_PASSWORD/JWT_SECRET/FRONTEND_URL thật, không dùng giá trị mẫu).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "[deploy] Thiếu infra/.env — copy từ .env.example và điền giá trị thật trước khi chạy." >&2
  exit 1
fi

docker compose build
docker compose up -d
docker compose ps

echo "[deploy] Xong. prisma migrate deploy chạy tự động mỗi lần container backend khởi động (idempotent)."
echo "[deploy] Xem log: docker compose logs -f backend"
