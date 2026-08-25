import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.models.booking import TestDriveBooking
from app.schemas.booking import TestDriveBookingCreate, TestDriveBookingResponse
from app.services.customer_service import CustomerService
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/bookings", tags=["Test Drive Bookings"])

@router.post("", response_model=TestDriveBookingResponse)
async def create_test_drive_booking(req: TestDriveBookingCreate, db: AsyncSession = Depends(get_db)):
    customer = await CustomerService.get_customer_by_id(db, req.customer_id)
    if not customer:
        customer = await CustomerService.get_or_create_default_customer(db)
        
    booking_ref = f"BK-MAH-{int(time.time()) % 100000}"
    
    # Resolve dealership details
    dealers = CatalogService.get_dealerships()
    d_match = next((d for d in dealers if d.id == req.dealership_id), dealers[0])
    
    booking = TestDriveBooking(
        booking_reference=booking_ref,
        customer_id=customer.id,
        vehicle_id=req.vehicle_id,
        variant=req.variant,
        color=req.color or "Stealth Black",
        dealership_id=d_match.id,
        dealership_name=d_match.name,
        sales_advisor_name=d_match.available_advisors[0],
        booking_type=req.booking_type or "HOME_DOORSTEP",
        delivery_address=req.delivery_address or "Bandra West Office, Mumbai",
        scheduled_date=req.scheduled_date,
        scheduled_time_slot=req.scheduled_time_slot,
        status="CONFIRMED",
        notes=req.notes
    )
    db.add(booking)
    
    # Update customer state
    customer.interested_vehicle_id = req.vehicle_id
    customer.interested_variant = req.variant
    
    await db.commit()
    await db.refresh(booking)
    return booking

@router.get("/my-bookings", response_model=List[TestDriveBookingResponse])
async def list_customer_bookings(customer_id: str = "CUST-AARAV-001", db: AsyncSession = Depends(get_db)):
    customer = await CustomerService.get_customer_by_id(db, customer_id)
    if not customer:
        customer = await CustomerService.get_or_create_default_customer(db)
    
    stmt = select(TestDriveBooking).where(TestDriveBooking.customer_id == customer.id).order_by(TestDriveBooking.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
