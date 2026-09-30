#!/bin/bash
set -e

echo "=========================================================="
echo "  PRAVAAH — Enabling PostGIS Spatial Extensions"
echo "=========================================================="

export PGUSER="$POSTGRES_USER"

"${psql[@]}" --dbname="$POSTGRES_DB" <<- 'EOSQL'
    CREATE EXTENSION IF NOT EXISTS postgis;
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
EOSQL

echo "[PRAVAAH] PostGIS geospatial extensions successfully initialized."
