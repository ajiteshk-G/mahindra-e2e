from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TestDriveBookingCreate(BaseModel):
    customer_id: str
    vehicle_id: str
    variant: str
    color: Optional[str] = "Stealth Black"
    dealership_id: Optional[str] = "bayview_bandra"
    booking_type: Optional[str] = "HOME_DOORSTEP"
    delivery_address: Optional[str] = None
    scheduled_date: str
    scheduled_time_slot: str
    notes: Optional[str] = None

class TestDriveBookingResponse(BaseModel):
    id: int
    booking_reference: str
    customer_id: int
    vehicle_id: str
    variant: str
    color: str
    dealership_id: str
    dealership_name: str
    sales_advisor_name: str
    booking_type: str
    delivery_address: Optional[str] = None
    scheduled_date: str
    scheduled_time_slot: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
