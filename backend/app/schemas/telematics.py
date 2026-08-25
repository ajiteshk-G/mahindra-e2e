from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TelematicsSnapshot(BaseModel):
    vin: str
    vehicle_name: str
    odometer_km: int
    service_due_km: int
    oil_viscosity_pct: float
    battery_soc_pct: float
    distance_to_empty_km: int
    tpms_front_left_psi: float
    tpms_front_right_psi: float
    tpms_rear_left_psi: float
    tpms_rear_right_psi: float
    doors_locked: bool
    engine_status: str # "OFF", "IDLE", "RUNNING"

class TelematicsAlertSchema(BaseModel):
    id: int
    vin: str
    alert_type: str
    severity: str
    message: str
    current_odometer_km: int
    is_actioned: bool
    action_taken: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ServiceBookingFromTelematicsRequest(BaseModel):
    customer_id: str
    vin: str
    preferred_slot: str # "Saturday 9:00 AM"
    booking_type: str = "HOME_PICKUP"
