from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.outbound_call import (
    OutboundCallTriggerRequest,
    OutboundDialogueTurnRequest,
    OutboundDialogueTurnResponse,
    OutboundCallInsightsResponse
)
from app.services.outbound_call_service import OutboundCallService

router = APIRouter(prefix="/outbound", tags=["Outbound Post-Ride Proactive Voice Call"])

@router.post("/trigger-call", response_model=dict)
async def trigger_outbound_call(
    req: OutboundCallTriggerRequest,
    db: AsyncSession = Depends(get_db)
):
    """Triggers proactive outbound voice call from MIA to customer following test ride completion."""
    call = await OutboundCallService.trigger_outbound_call(db, req)
    return {
        "status": "CALL_INITIATED",
        "call_reference": call.call_reference,
        "customer_id": req.customer_id,
        "phone_number": req.phone_number,
        "caller_id": "MIA (+91 22 6900 1000)",
        "message": f"Calling {req.customer_name} regarding their {req.vehicle_name} test drive experience."
    }

@router.post("/dialogue-turn", response_model=OutboundDialogueTurnResponse)
async def process_outbound_dialogue_turn(
    req: OutboundDialogueTurnRequest,
    db: AsyncSession = Depends(get_db)
):
    """Processes interactive multi-turn voice dialogue addressing test ride objections and locking allocation."""
    return await OutboundCallService.process_dialogue_turn(db, req)

@router.get("/call-insights/{call_reference}", response_model=OutboundCallInsightsResponse)
async def get_outbound_call_insights(
    call_reference: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve post-call insights, objection resolution metrics, and fast-track allocation lock status."""
    insights = await OutboundCallService.get_call_insights(db, call_reference)
    if not insights:
        raise HTTPException(status_code=404, detail="Call record not found")
    return insights
