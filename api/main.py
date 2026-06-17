"""
api/main.py
===========
FastAPI bridge — thin HTTP wrapper over the existing Python services.
Run with: uvicorn api.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import deps
from api.routers import (
    auth,
    customers,
    dashboard,
    expenses,
    failures,
    filament,
    orders,
    printers,
    settings,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    deps.init()
    yield


app = FastAPI(
    title="Abaad ERP API",
    version="1.0.0",
    description="REST bridge over the Abaad ERP Python services.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    orders.router,
    customers.router,
    filament.router,
    printers.router,
    expenses.router,
    failures.router,
    settings.router,
    dashboard.router,
):
    app.include_router(router, prefix="/api")
