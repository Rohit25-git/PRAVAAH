#!/usr/bin/env bash
# ==============================================================================
# PRAVAAH — Predictive Risk And Vulnerability Analysis for ATM Activity & Hotspots
# Automated Production Cloud Deployment Script
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}  PRAVAAH — Production Cloud Deployment & HTTPS Provisioning Engine          ${NC}"
echo -e "${CYAN}==============================================================================${NC}"

# 1. Dependency Checks
echo -e "\n${YELLOW}[1/7] Checking deployment host prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker is not installed. Please install Docker first: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Neither 'docker compose' nor 'docker-compose' was found.${NC}"
    exit 1
fi
echo -e "${GREEN}[PASS] Docker and ${DOCKER_COMPOSE_CMD} detected.${NC}"

# 2. Environment & Cryptographic Secrets
echo -e "\n${YELLOW}[2/7] Configuring production environment and cryptographic keys...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}[INFO] .env.production not found. Generating high-entropy production secrets...${NC}"
    if command -v python3 &> /dev/null; then
        python3 scripts/generate_secrets.py
    elif command -v python &> /dev/null; then
        python scripts/generate_secrets.py
    else
        echo -e "${YELLOW}[WARNING] Python not found on host. Copying .env.example to .env.production...${NC}"
        cp .env.example .env.production
    fi
else
    echo -e "${GREEN}[PASS] .env.production exists.${NC}"
fi

# Load environment variables
set -a
# shellcheck disable=SC1091
source .env.production
set +a

# 3. Model Artifacts Verification
echo -e "\n${YELLOW}[3/7] Verifying ML model artifacts...${NC}"
if [ -f ml/models/future_hotspot_rf.pkl ] && [ -f ml/models/isolation_forest.pkl ] && [ -f ml/artifacts/model_metadata.json ]; then
    echo -e "${GREEN}[PASS] ML artifacts verified (Random Forest + Isolation Forest + Metadata).${NC}"
else
    echo -e "${RED}[ERROR] ML artifacts missing in ml/models/ or ml/artifacts/.${NC}"
    exit 1
fi

# 4. Ingress Domain Configuration
echo -e "\n${YELLOW}[4/7] Ingress Domain & TLS Configuration...${NC}"
echo -e "Target Domain : ${CYAN}${PUBLIC_DOMAIN:-localhost}${NC}"
echo -e "ACME Contact  : ${CYAN}${ACME_EMAIL:-admin@pravaah.gov.in}${NC}"
if [ "${PUBLIC_DOMAIN:-localhost}" = "localhost" ]; then
    echo -e "${YELLOW}[NOTE] Using 'localhost' - Caddy will use automatic local self-signed TLS.${NC}"
    echo -e "${YELLOW}       For production public domain, edit PUBLIC_DOMAIN in .env.production${NC}"
fi

# 5. Build and Launch Containers
echo -e "\n${YELLOW}[5/7] Building and deploying PRAVAAH container stack...${NC}"
$DOCKER_COMPOSE_CMD --env-file .env.production -f docker-compose.prod.yml down --remove-orphans || true
$DOCKER_COMPOSE_CMD --env-file .env.production -f docker-compose.prod.yml build
$DOCKER_COMPOSE_CMD --env-file .env.production -f docker-compose.prod.yml up -d

# 6. Service Health Check Wait Loop
echo -e "\n${YELLOW}[6/7] Waiting for services to become healthy...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=30
BACKEND_HEALTHY=false

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    ATTEMPTS=$((ATTEMPTS + 1))
    echo -n "."
    sleep 3
    
    # Check if backend container is running
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "pravaah-backend.*Up"; then
        BACKEND_HEALTHY=true
        break
    fi
done
echo ""

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "${GREEN}[PASS] PRAVAAH production stack is running!${NC}"
else
    echo -e "${YELLOW}[WARNING] Services are starting. Check logs with: ${DOCKER_COMPOSE_CMD} -f docker-compose.prod.yml logs -f${NC}"
fi

# 7. Deployment Summary
echo -e "\n${CYAN}==============================================================================${NC}"
echo -e "${GREEN}  PRAVAAH Production Stack Successfully Deployed!                            ${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo -e "Public Web & Ingress URL : ${GREEN}https://${PUBLIC_DOMAIN:-localhost}${NC}"
echo -e "REST API Endpoints       : ${GREEN}https://${PUBLIC_DOMAIN:-localhost}/api/v1/${NC}"
echo -e "WebSocket Stream         : ${GREEN}wss://${PUBLIC_DOMAIN:-localhost}/ws/alerts${NC}"
echo -e "Active Ingress Port(s)   : 80 (HTTP redirect), 443 (HTTPS + HTTP/3 QUIC)"
echo -e "\nContainer Status:"
$DOCKER_COMPOSE_CMD --env-file .env.production -f docker-compose.prod.yml ps

echo -e "\nUseful Operations Commands:"
echo -e "  - View live logs:     ${CYAN}${DOCKER_COMPOSE_CMD} -f docker-compose.prod.yml logs -f${NC}"
echo -e "  - Backend logs:       ${CYAN}${DOCKER_COMPOSE_CMD} -f docker-compose.prod.yml logs -f backend${NC}"
echo -e "  - Restart services:   ${CYAN}${DOCKER_COMPOSE_CMD} -f docker-compose.prod.yml restart${NC}"
echo -e "  - Stop deployment:    ${CYAN}${DOCKER_COMPOSE_CMD} -f docker-compose.prod.yml down${NC}"
echo -e "${CYAN}==============================================================================${NC}\n"
