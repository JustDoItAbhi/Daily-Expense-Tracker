"""Expense Tracker backend (FastAPI + MongoDB).

Modular monolith. In this managed environment FastAPI + MongoDB stand in for the
target Spring Boot + PostgreSQL deployment; the module boundaries (auth / users /
devices / admin / audit / security / config) map 1:1 onto Spring packages so the
server is portable later without a frontend rewrite. All routes are versioned
under /api/v1 and reachable through the /api ingress prefix.
"""
import logging
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI  # noqa: E402
from starlette.middleware.cors import CORSMiddleware  # noqa: E402

from app.db import init_db  # noqa: E402
from app.routers import admin, auth, devices, users  # noqa: E402
from app.seed import seed  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Expense Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(devices.router)
app.include_router(admin.router)


@app.get("/api/")
async def root():
    return {"service": "expense-tracker", "status": "ok"}


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def on_startup():
    await init_db()
    await seed()
    logger.info("Backend started: indexes ensured, seed applied.")
