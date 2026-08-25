from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class OutboundCallTriggerRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID, e.g. CUST-AARAV-001")
    test_ride_session_id: Optional[str] = Field(None, description="Associated Test Ride Session ID")
    phone_number: str = Field(default="+91 98201 23456")
    customer_name: str = Field(default="Aarav Sharma")
    vehicle_name: str = Field(default="Mahindra Thar ROXX AX7L Diesel AT")
    advisor_name: str = Field(default="Rajesh Varma")

class OutboundDialogueTurnRequest(BaseModel):
    call_reference: str = Field(..., description="Call Reference ID")
    customer_speech: str = Field(..., description="Customer spoken message or response")
    turn_index: int = Field(default=0)

class OutboundDialogueTurnResponse(BaseModel):
    call_reference: str
    speaker: str = "MIA"
    agent_message: str
    audio_tts_url: Optional[str] = None
    is_call_finished: bool = False
    action_item: Optional[str] = None
    turn_index: int

class OutboundCallInsightsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    call_reference: str
    customer_id: Any
    customer_name: str
    agent_name: str
    phone_number: str
    call_status: str
    call_duration_seconds: int
    transcript: str
    objections_handled: List[str]
    objection_resolution_status: str
    customer_sentiment: str
    customer_decision: str
    locked_vehicle_variant: str
    locked_allocation_days: int
    next_step: str
    created_at: datetime
