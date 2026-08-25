from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.telematics import TelematicsSnapshot, TelematicsAlertSchema, ServiceBookingFromTelematicsRequest
from app.services.telematics_service import TelematicsService
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/telematics", tags=["IoT Telematics & Predictive Maintenance"])

@router.get("/live", response_model=TelematicsSnapshot)
async def get_live_telematics(vin: str = "MAH1THARROXX2026MUM01"):
    return TelematicsService.get_live_snapshot(vin)

@router.post("/trigger-alert", response_model=TelematicsAlertSchema)
async def trigger_telematics_service_alert(customer_id: str = "CUST-AARAV-001", vin: str = "MAH1THARROXX2026MUM01", db: AsyncSession = Depends(get_db)):
    customer = await CustomerService.get_customer_by_id(db, customer_id)
    if not customer:
        customer = await CustomerService.get_or_create_default_customer(db)
        
    alert = await TelematicsService.create_service_due_alert(db, customer.id, vin)
    return alert

@router.post("/book-service", response_model=TelematicsAlertSchema)
async def book_service_from_telematics(req: ServiceBookingFromTelematicsRequest, db: AsyncSession = Depends(get_db)):
    customer = await CustomerService.get_customer_by_id(db, req.customer_id)
    if not customer:
        customer = await CustomerService.get_or_create_default_customer(db)
        
    alert = await TelematicsService.action_service_alert(db, customer.id, req)
    return alert
