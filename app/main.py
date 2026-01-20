from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import service, environment, role, auth, user
from app.api.v1.endpoints.auth import get_current_user
from app.api.v1.endpoints.auth import get_current_admin_user

tags_metadata = [
    {
        "name": "health",
        "description": "Service health and readiness checks."
    },
    {
        "name": "services",
        "description": "CRUD endpoints for demo services."
    }
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Starter FastAPI project with versioned routes and Swagger UI.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=tags_metadata,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.ALLOWED_ORIGINS] if isinstance(settings.ALLOWED_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}

# API Routers (versioned)
# 🔒 Protected routers (require authenticated user)
app.include_router(
    service.router,
    prefix=settings.API_V1_STR,
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    environment.router,
    prefix=settings.API_V1_STR,
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    role.router,
    prefix=settings.API_V1_STR,
    dependencies=[Depends(get_current_user)],
)
app.include_router(
    user.router,
    prefix=settings.API_V1_STR,
    dependencies=[Depends(get_current_user)],
)
app.include_router(auth.router, prefix=settings.API_V1_STR)

from app.api.v1.endpoints import releases
app.include_router(
    releases.router,
    prefix=f"{settings.API_V1_STR}/releases",
    tags=["releases"],
    dependencies=[Depends(get_current_user)],
)