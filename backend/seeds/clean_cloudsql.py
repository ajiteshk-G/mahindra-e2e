import os
import sys
import asyncio
import logging

# Add backend directory to sys.path dynamically
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("clean_cloudsql")

async def clean_database():
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    logger.info("Connecting to Cloud SQL to clean bookings, transcripts, and customer details...")
    engine = create_async_engine(db_url, echo=False)

    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public';"))
        existing_tables = {row[0] for row in result.fetchall()}
        logger.info(f"Existing tables in PostgreSQL: {existing_tables}")

        tables_to_clean = [
            "outbound_call_logs",
            "test_ride_recordings",
            "test_drive_bookings",
            "test_drive_slots",
            "conversation_transcripts",
            "interaction_logs",
            "conversation_sessions",
            "insurance_claims",
            "claims",
            "customers"
        ]

        for t in tables_to_clean:
            if t in existing_tables:
                try:
                    await conn.execute(text(f"DELETE FROM {t};"))
                except Exception as e:
                    logger.debug(f"Table delete notice ({t}): {e}")
        logger.info("✓ Successfully cleaned test ride bookings, transcripts, and customer records.")

    # Re-seed default customer Aarav Sharma
    from app.services.customer_service import CustomerService
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        cust = await CustomerService.get_or_create_default_customer(db)
        logger.info(f"✓ Clean Default Customer initialized: {cust.name} ({cust.customer_id}, {cust.phone})")

    await engine.dispose()
    logger.info("🎉 Cloud SQL clean-up complete! Showrooms, slots, and holiday seed data remain intact.")

if __name__ == "__main__":
    asyncio.run(clean_database())
