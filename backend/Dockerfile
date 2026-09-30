# PRAVAAH Backend Production Container
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (build-essential, libpq for PostgreSQL, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code, data, models, and scripts
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY data/ ./data/
COPY scripts/ ./scripts/

# Ensure entrypoint script is executable
RUN chmod +x /app/scripts/entrypoint.sh

ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=10s --retries=3 --start-period=15s \
    CMD curl -f http://localhost:8000/api/v1/system/health || exit 1

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
