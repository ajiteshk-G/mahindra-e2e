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


class SlotItem(BaseModel):
    id: Optional[int] = None
    slot_date: str
    slot_time: str
    status: str # "AVAILABLE", "RESERVED", "BLOCKED"
    is_available: bool
    display_time: str
    customer_name: Optional[str] = None


class DateSlotsResponse(BaseModel):
    date: str
    is_blocked: bool
    blocked_reason: Optional[str] = None
    is_sunday: bool = False
    is_holiday: bool = False
    holiday_name: Optional[str] = None
    dealership_id: str
    dealership_name: str
    slots: list[SlotItem]


class SlotReserveRequest(BaseModel):
    slot_date: str # "YYYY-MM-DD"
    slot_time: str # "11:00 AM"
    customer_id: Optional[str] = None
    customer_name: str
    customer_phone: str
    vehicle_id: str = "thar_roxx"
    variant: Optional[str] = "AX7L Diesel AT 4x4"
    color: Optional[str] = "Stealth Black"
    dealership_id: Optional[str] = None
    booking_type: Optional[str] = "HOME_DOORSTEP" # HOME_DOORSTEP or SHOWROOM_VISIT
    delivery_address: Optional[str] = None
    pin_code: Optional[str] = None
    notes: Optional[str] = None


class SlotReserveResponse(BaseModel):
    success: bool
    message: str
    booking_reference: str
    slot_date: str
    slot_time: str
    booking_type: str
    vehicle_name: str
    dealership_name: str
    sales_advisor_name: str
    customer_name: str
    customer_phone: str
    delivery_address: Optional[str] = None
    pin_code: Optional[str] = None
    whatsapp_dispatched: bool = True
    status: str = "RESERVED"

