# ==============================================================================
# PRAVAAH — Predictive Risk And Vulnerability Analysis for ATM Activity & Hotspots
# Automated Production Cloud & Docker Desktop Deployment Script (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  PRAVAAH — Production Cloud Deployment & HTTPS Provisioning Engine (Windows) " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

# 1. Dependency Checks
Write-Host "`n[1/7] Checking Docker prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

$composeCmd = "docker compose"
try {
    & docker compose version | Out-Null
} catch {
    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        $composeCmd = "docker-compose"
    } else {
        Write-Host "[ERROR] Neither 'docker compose' nor 'docker-compose' was found." -ForegroundColor Red
        exit 1
    }
}
Write-Host "[PASS] Docker engine and compose detected." -ForegroundColor Green

# 2. Environment & Cryptographic Secrets
Write-Host "`n[2/7] Checking environment and cryptographic keys..." -ForegroundColor Yellow
if (-not (Test-Path ".env.production")) {
    Write-Host "[INFO] .env.production not found. Generating production secrets..." -ForegroundColor Yellow
    python scripts/generate_secrets.py
} else {
    Write-Host "[PASS] .env.production exists." -ForegroundColor Green
}

# 3. Model Artifacts Verification
Write-Host "`n[3/7] Verifying ML model artifacts..." -ForegroundColor Yellow
python scripts/verify_ml_artifacts.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] ML model artifact verification failed." -ForegroundColor Red
    exit 1
}

# 4. Build and Launch Containers
Write-Host "`n[4/7] Deploying PRAVAAH production container stack..." -ForegroundColor Yellow
& docker compose --env-file .env.production -f docker-compose.prod.yml down --remove-orphans
& docker compose --env-file .env.production -f docker-compose.prod.yml build
& docker compose --env-file .env.production -f docker-compose.prod.yml up -d

Write-Host "`n[5/7] Checking service status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
& docker compose --env-file .env.production -f docker-compose.prod.yml ps

Write-Host "`n==============================================================================" -ForegroundColor Cyan
Write-Host "  PRAVAAH Production Stack Successfully Deployed!                            " -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Public Web & Ingress URL : https://localhost (or configured PUBLIC_DOMAIN)" -ForegroundColor Green
Write-Host "REST API Endpoints       : https://localhost/api/v1/" -ForegroundColor Green
Write-Host "WebSocket Stream         : wss://localhost/ws/alerts" -ForegroundColor Green
Write-Host "Active Ingress Port(s)   : 80 (HTTP redirect), 443 (HTTPS + HTTP/3 QUIC)`n"
