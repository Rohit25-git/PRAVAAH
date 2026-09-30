#!/usr/bin/env python3
"""
PRAVAAH Cryptographic Secrets Generator
Generates high-entropy production secrets for JWT authentication and PostgreSQL credentials.
"""

import secrets
import string
import sys
import os

def generate_key(length=64) -> str:
    alphabet = string.ascii_letters + string.digits + "-_.~"
    return "".join(secrets.choice(alphabet) for _ in range(length))

def generate_db_pass(length=32) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return "".join(secrets.choice(alphabet) for _ in range(length))

def main():
    jwt_secret = generate_key(64)
    db_password = generate_db_pass(28)
    
    print("==========================================================")
    print("  PRAVAAH Production Cryptographic Credentials")
    print("==========================================================")
    print(f"\n[+] Generated JWT_SECRET (256-bit entropy):\n    {jwt_secret}")
    print(f"\n[+] Generated POSTGRES_PASSWORD:\n    {db_password}")
    print("\n----------------------------------------------------------")

    env_prod_path = os.path.join(os.path.dirname(__file__), "..", ".env.production")
    if not os.path.exists(env_prod_path):
        print(f"[+] Creating .env.production with generated secrets...")
        content = f"""# PRAVAAH Production Environment
APP_NAME=PRAVAAH
APP_VERSION=2.0.0
ENVIRONMENT=production
DEBUG=False

# Ingress & HTTPS
PUBLIC_DOMAIN=localhost
ACME_EMAIL=admin@pravaah.gov.in

# Cryptographic Keys
JWT_SECRET={jwt_secret}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Database Credentials
POSTGRES_DB=pravaah
POSTGRES_USER=pravaah_admin
POSTGRES_PASSWORD={db_password}
DATABASE_URL=postgresql://pravaah_admin:{db_password}@db:5432/pravaah

# Groq Cloud AI Copilot
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b

# ML Weights
RISK_WEIGHT_COMPLAINTS=0.25
RISK_WEIGHT_ANOMALY=0.25
RISK_WEIGHT_GEO=0.20
RISK_WEIGHT_TEMPORAL=0.15
RISK_WEIGHT_NETWORK=0.15

UVICORN_WORKERS=4
"""
        with open(env_prod_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[+] Successfully generated: {os.path.abspath(env_prod_path)}")
    else:
        print(f"[*] .env.production already exists at: {os.path.abspath(env_prod_path)}")

if __name__ == "__main__":
    main()
