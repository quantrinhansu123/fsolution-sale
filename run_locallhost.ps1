# run_locallhost.ps1
# Cach chay:
#   powershell -ExecutionPolicy Bypass -File "C:\Users\theta\ai-agent-os\projects\fsolution\run_locallhost.ps1"
# hoac click phai file nay > "Run with PowerShell"
#
# Script tu xac dinh thu muc goc repo dua tren vi tri that cua file nay.
# Thu muc goc = thu muc chua file nay (projects/fsolution/)
# Backend chay cong 3003, Frontend chay cong 5176.
# Trinh duyet se tu dong mo http://localhost:5176/ khi ca hai san sang.

$ErrorActionPreference = "Stop"

# ─── Mau sac console ────────────────────────────────────────────────────────
function Write-Step  { param($msg) Write-Host "`n== $msg ==" -ForegroundColor Cyan }
function Write-OK    { param($msg) Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn  { param($msg) Write-Host "   [!!] $msg" -ForegroundColor Yellow }
function Write-Fail  { param($msg) Write-Host "`n!! $msg" -ForegroundColor Red }

# ─── Helpers ────────────────────────────────────────────────────────────────
function Test-PortOpen {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Stop-ProcessOnPort {
    param([int]$Port)
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $procIds = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($procId in $procIds) {
            try {
                Write-Warn "Dung process cu (PID $procId) dang giu cong $Port ..."
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            } catch {}
        }
        Start-Sleep -Seconds 1
    }
}

# ─── Duong dan co ban ───────────────────────────────────────────────────────
# $PSScriptRoot = C:\Users\theta\ai-agent-os\projects\fsolution
$projectRoot  = $PSScriptRoot                                  # .../projects/fsolution
$repoRoot     = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path  # .../ai-agent-os

$backendDir   = Join-Path $projectRoot "apps\backend"
$frontendDir  = Join-Path $projectRoot "apps\frontend"

# Workspace name dung cho npm --workspace (phai khop "name" trong package.json)
$backendWs    = "@fsolution/backend"
$frontendWs   = "@fsolution/frontend"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  F-Solution Local Dev Launcher" -ForegroundColor White
Write-Host "  Repo   : $repoRoot" -ForegroundColor DarkGray
Write-Host "  Project: $projectRoot" -ForegroundColor DarkGray
Write-Host "======================================================" -ForegroundColor Cyan

# ─── Thu muc log ────────────────────────────────────────────────────────────
$logDir      = Join-Path $projectRoot ".run-logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$dbLog       = Join-Path $logDir "db-start.log"
$backendLog  = Join-Path $logDir "backend.log"
$frontendLog = Join-Path $logDir "frontend.log"
Remove-Item $dbLog, $backendLog, $frontendLog -ErrorAction SilentlyContinue

# ─── BUOC 1: npm install (bo qua neu node_modules da co) ────────────────────
if (-not (Test-Path (Join-Path $repoRoot "node_modules"))) {
    Write-Step "npm install (lan dau)"
    Set-Location $repoRoot
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "npm install that bai."
        exit 1
    }
    Write-OK "Cai dat dependencies thanh cong."
} else {
    Write-Step "node_modules da co, bo qua npm install"
}

# ─── BUOC 2: Tao .env neu chua co ───────────────────────────────────────────
Write-Step "Kiem tra file .env"
$backendEnvSrc  = Join-Path $backendDir  ".env.example"
$backendEnvDst  = Join-Path $backendDir  ".env"
$frontendEnvSrc = Join-Path $frontendDir ".env.example"
$frontendEnvDst = Join-Path $frontendDir ".env"

if (-not (Test-Path $backendEnvDst)) {
    Copy-Item $backendEnvSrc $backendEnvDst
    Write-Warn "Da tao $backendEnvDst tu .env.example"
} else { Write-OK "Backend .env da co." }

if (-not (Test-Path $frontendEnvDst)) {
    Copy-Item $frontendEnvSrc $frontendEnvDst
    Write-Warn "Da tao $frontendEnvDst tu .env.example"
} else { Write-OK "Frontend .env da co." }

# ─── BUOC 3: Khoi dong Postgres portable (cong 5436) ────────────────────────
Write-Step "Khoi dong Postgres (cong 5436)"
if (Test-PortOpen -Port 5436) {
    Write-OK "Postgres da chay tren cong 5436, bo qua."
} else {
    $dbScript = Join-Path $backendDir "scripts\db-start.js"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", `
        "Set-Location '$backendDir'; node '$dbScript' 2>&1 | Tee-Object -FilePath '$dbLog'"

    Write-Host "   Dang cho Postgres khoi dong (toi da 45 giay)..." -ForegroundColor DarkGray
    $dbWait = 0
    while ($dbWait -lt 45 -and -not (Test-PortOpen -Port 5436)) {
        Start-Sleep -Milliseconds 500
        $dbWait += 0.5
        Write-Host "." -NoNewline -ForegroundColor DarkGray
    }
    Write-Host ""

    if (-not (Test-PortOpen -Port 5436)) {
        Write-Fail "Postgres khong khoi dong duoc tren cong 5436."
        if (Test-Path $dbLog) {
            Write-Host "--- Log db-start ---" -ForegroundColor DarkGray
            Get-Content $dbLog -Tail 20
        }
        exit 1
    }
    Write-OK "Postgres da len cong 5436."
}

# ─── BUOC 4: Prisma generate ─────────────────────────────────────────────────
Write-Step "Prisma generate (tao Prisma Client)"
Set-Location $backendDir
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Prisma generate that bai. Xem loi phia tren."
    exit 1
}
Write-OK "Prisma Client da tao thanh cong."
Set-Location $repoRoot

# ─── BUOC 5: Prisma migrate deploy ───────────────────────────────────────────
Write-Step "Prisma migrate deploy (ap dung schema moi nhat)"
Set-Location $backendDir
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Prisma migrate that bai. Xem loi phia tren."
    exit 1
}
Write-OK "Migration ap dung thanh cong."
Set-Location $repoRoot

# ─── BUOC 6: Seed tai khoan he thong (idempotent - upsert, luon an toan) ─────
Write-Step "Seed tai khoan he thong (admin + cac role mac dinh)"
Set-Location $backendDir
npx ts-node -r tsconfig-paths/register prisma/seed-accounts.ts
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Seed tai khoan that bai. Xem loi phia tren."
    exit 1
}
Write-OK "Tai khoan he thong da duoc dam bao."
Set-Location $repoRoot

# ─── BUOC 7: Don dep cong cu truoc khi mo process moi ───────────────────────
Write-Step "Don dep cong 3003 va 5176 (neu co process cu)"
if (Test-PortOpen -Port 3003) { Stop-ProcessOnPort -Port 3003 }
if (Test-PortOpen -Port 5176) { Stop-ProcessOnPort -Port 5176 }
Write-OK "Cong da trong san."

# ─── BUOC 8: Khoi dong BACKEND (cong 3003) ───────────────────────────────────
Write-Step "Khoi dong BACKEND tai cong 3003"
$beCmd = "Set-Location '$backendDir'; node -r ts-node/register -r tsconfig-paths/register src/main.ts 2>&1 | Tee-Object -FilePath '$backendLog'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $beCmd

# ─── BUOC 9: Khoi dong FRONTEND (cong 5176) ──────────────────────────────────
Write-Step "Khoi dong FRONTEND tai cong 5176"
$feCmd = "Set-Location '$frontendDir'; npx vite --port 5176 2>&1 | Tee-Object -FilePath '$frontendLog'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $feCmd

# ─── BUOC 10: Cho ca hai san sang (toi da 90 giay) ───────────────────────────
Write-Step "Dang cho backend + frontend khoi dong..."
$maxWait      = 90
$elapsed      = 0
$backendReady = $false
$frontendReady= $false

while ($elapsed -lt $maxWait -and (-not $backendReady -or -not $frontendReady)) {
    Start-Sleep -Seconds 1
    $elapsed += 1
    if (-not $backendReady)  { $backendReady  = Test-PortOpen -Port 3003 }
    if (-not $frontendReady) { $frontendReady = Test-PortOpen -Port 5176 }

    $be = if ($backendReady)  { "[BE OK]" } else { "[BE...]" }
    $fe = if ($frontendReady) { "[FE OK]" } else { "[FE...]" }
    Write-Host "`r   $be  $fe  ($elapsed/$maxWait giay)" -NoNewline -ForegroundColor DarkGray
}
Write-Host ""

# ─── BUOC 11: Ket qua va mo trinh duyet ──────────────────────────────────────
if ($backendReady -and $frontendReady) {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host "  CHAY THANH CONG!" -ForegroundColor Green
    Write-Host "  Backend  : http://localhost:3003/api/v1" -ForegroundColor White
    Write-Host "  Frontend : http://localhost:5176" -ForegroundColor White
    Write-Host "  Log BE   : $backendLog" -ForegroundColor DarkGray
    Write-Host "  Log FE   : $frontendLog" -ForegroundColor DarkGray
    Write-Host "======================================================" -ForegroundColor Green
    Write-Host ""
    # Mo trinh duyet
    Start-Process "http://localhost:5176/"
} else {
    Write-Host ""
    Write-Fail "Chua san sang sau $maxWait giay:"
    if (-not $backendReady) {
        Write-Host "   - BACKEND (cong 3003) chua len. Log: $backendLog" -ForegroundColor Red
        if (Test-Path $backendLog) {
            Write-Host "--- Cuoi log backend ---" -ForegroundColor DarkGray
            Get-Content $backendLog -Tail 25
        }
    }
    if (-not $frontendReady) {
        Write-Host "   - FRONTEND (cong 5176) chua len. Log: $frontendLog" -ForegroundColor Red
        if (Test-Path $frontendLog) {
            Write-Host "--- Cuoi log frontend ---" -ForegroundColor DarkGray
            Get-Content $frontendLog -Tail 15
        }
    }
    exit 1
}
