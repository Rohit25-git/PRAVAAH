#!/bin/bash
set -e

echo "=========================================================="
echo "  PRAVAAH — Predictive Risk & Vulnerability Analysis"
echo "  Production ASGI Backend Entrypoint"
echo "=========================================================="

# Check and wait for PostgreSQL if configured
if [[ "$DATABASE_URL" == *"postgres"* ]]; then
    echo "[PRAVAAH] Waiting for PostgreSQL database connection..."
    python -c '
import os, time, sys
from sqlalchemy import create_engine, text

db_url = os.getenv("DATABASE_URL")
max_tries = 30
for i in range(max_tries):
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        print(f"[PRAVAAH] PostgreSQL database verified on attempt {i+1}!")
        sys.exit(0)
    except Exception as e:
        print(f"[PRAVAAH] Waiting for database (attempt {i+1}/{max_tries})...")
        time.sleep(2)
sys.exit(1)
'
fi

# Initialize database schema and seeds
echo "[PRAVAAH] Synchronizing database schema and initial state..."
python scripts/seed_database.py || echo "[PRAVAAH] Seed check completed."

echo "[PRAVAAH] Starting production ASGI server on port 8000..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-2}
