from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.services.customer_service import CustomerService
from app.routers import (
    health_router,
    catalog_router,
    customer_router,
    bookings_router,
    diagnostics_router,
    sales_router,
    outbound_router,
    admin_router,
    ws_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Safe SQLite column additions if not present
        try:
            from sqlalchemy import text
            await conn.execute(text('ALTER TABLE test_drive_bookings ADD COLUMN advisor_checklist JSON'))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text('ALTER TABLE customers ADD COLUMN advisor_checklist JSON'))
        except Exception:
            pass
        try:
            from sqlalchemy import text
            await conn.execute(text('ALTER TABLE test_ride_recordings ADD COLUMN booking_reference VARCHAR(64)'))
        except Exception:
            pass
        
    # Seed default customer and dealerships
    async with AsyncSessionLocal() as db:
        await CustomerService.get_or_create_default_customer(db)
        try:
            from seeds.seed_dealerships import seed_dealerships
            await seed_dealerships()
        except Exception as e:
            pass
        
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.1.0",
    description="Mahindra Omnichannel AI Platform (MIA) with Pre-Sales Live Avatar, Mobile Sales Test-Ride Recording, Outbound Voice Call Insights & Instant Digital Financing",
    lifespan=lifespan
)

# CORS Configuration for local Next.js frontend & Cloud Run
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(catalog_router, prefix=settings.API_V1_STR)
app.include_router(customer_router, prefix=settings.API_V1_STR)
app.include_router(bookings_router, prefix=settings.API_V1_STR)
app.include_router(diagnostics_router, prefix=settings.API_V1_STR)
app.include_router(sales_router, prefix=settings.API_V1_STR)
app.include_router(outbound_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)

@app.get("/")
async def root():
    return {
        "app": "Mahindra Intelligent Assistant (MIA) & Omnichannel Sales AI Platform",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "stages": [
            "1. Pre-sales Live Avatar Virtual Showroom (mahindra-car-live-chat)",
            "2. Sales Mobile App & Test Ride Recording (GCS Audio + AI Insights)",
            "3. Proactive Post-Ride Outbound Voice Call & Insights"
        ],
        "live_websocket": "/ws/live-audio"
    }
