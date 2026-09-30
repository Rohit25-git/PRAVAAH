from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
from collections import defaultdict

from backend.app.config.settings import settings
from backend.app.database.session import Base, engine, init_db_schema
from backend.app.alerts.notification import ws_manager

# Import all API v1 routers
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.dashboard import router as dashboard_router
from backend.app.api.v1.predictions import router as predictions_router
from backend.app.api.v1.hotspots import router as hotspots_router
from backend.app.api.v1.map import router as map_router
from backend.app.api.v1.transactions import router as transactions_router
from backend.app.api.v1.alerts import router as alerts_router
from backend.app.api.v1.cases import router as cases_router
from backend.app.api.v1.investigations import router as investigations_router
from backend.app.api.v1.evidence import router as evidence_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.graph import router as graph_router
from backend.app.api.v1.ai import router as ai_router
from backend.app.api.v1.simulation import router as simulation_router
from backend.app.api.v1.system import router as system_router

# Initialize database schema tables inside isolated 'pravaah' namespace
init_db_schema()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        f"{settings.PRODUCT_TITLE}\n\n"
        f"**Official Problem Statement:**\n{settings.OFFICIAL_PROBLEM_STATEMENT}\n\n"
        "**Classification:** PROTOTYPE • SYNTHETIC DATA"
    ),
    version="1.4.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory sliding-window anti-brute-force rate limiter
auth_request_history = defaultdict(list)
AUTH_RATE_LIMIT_MAX = 15      # max auth attempts per window (strict anti-brute-force)
AUTH_RATE_LIMIT_WINDOW = 60   # seconds

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    # 1. Anti-brute-force defense for authentication endpoints
    client_ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    if path.startswith(f"{settings.API_V1_STR}/auth/login") or path.startswith(f"{settings.API_V1_STR}/auth/register"):
        now = time.time()
        auth_request_history[client_ip] = [t for t in auth_request_history[client_ip] if now - t < AUTH_RATE_LIMIT_WINDOW]
        if len(auth_request_history[client_ip]) >= AUTH_RATE_LIMIT_MAX:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many authentication requests. Rate limit exceeded to prevent brute force attacks. Please wait 60 seconds."}
            )
        auth_request_history[client_ip].append(now)

    response = await call_next(request)

    # 2. Defense-in-depth Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"

    return response

# Mount API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(dashboard_router, prefix=api_v1_prefix)
app.include_router(predictions_router, prefix=api_v1_prefix)
app.include_router(hotspots_router, prefix=api_v1_prefix)
app.include_router(map_router, prefix=api_v1_prefix)
app.include_router(transactions_router, prefix=api_v1_prefix)
app.include_router(alerts_router, prefix=api_v1_prefix)
app.include_router(cases_router, prefix=api_v1_prefix)
app.include_router(investigations_router, prefix=api_v1_prefix)
app.include_router(evidence_router, prefix=api_v1_prefix)
app.include_router(reports_router, prefix=api_v1_prefix)
app.include_router(graph_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(simulation_router, prefix=api_v1_prefix)
app.include_router(system_router, prefix=api_v1_prefix)

# Root Health Endpoint
@app.get("/health", tags=["Health"])
def root_health():
    return {
        "status": "HEALTHY",
        "system": settings.PROJECT_NAME,
        "title": settings.PRODUCT_TITLE,
        "timestamp": datetime.utcnow().isoformat(),
        "disclaimer": "Prototype / Synthetic Data Only"
    }

# Real-Time WebSocket for Alerts and Live Simulation
@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
