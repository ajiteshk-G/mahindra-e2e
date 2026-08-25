import uuid
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sales_ride import OutboundCallLog, TestRideRecording
from app.models.customer import Customer
from app.schemas.outbound_call import (
    OutboundCallTriggerRequest,
    OutboundDialogueTurnRequest,
    OutboundDialogueTurnResponse,
    OutboundCallInsightsResponse
)

CALL_SCRIPT_TURNS = [
    {
        "agent": "Hi Aarav! Hope you enjoyed driving the Thar ROXX with Advisor Rajesh. How did the suspension feel on the Bandra-Worli Sea Link?",
        "expected_customer": "The engine and suspension were amazing! But honestly, my wife is slightly concerned about rear seat legroom and the delivery wait period."
    },
    {
        "agent": "I completely understand! For rear comfort, the AX7L variant includes 60:40 split reclining seats which add significant legroom and under-thigh angle adjustment. Regarding wait times, I’ve scanned our real-time regional allocation pipeline: we have a Stealth Black AX7L Diesel Automatic scheduled for delivery in 12 days at Bayview Mahindra. If you'd like, we can lock this allocation right now with a refundable deposit.",
        "expected_customer": "That is fantastic news! Let's lock this allocation right away. Can you send me the financing options?"
    },
    {
        "agent": "Done! I have provisionally locked your Stealth Black AX7L allocation (#MAH-AL-99218) at Bayview Mahindra for delivery in 12 days. Let's move directly to instant 8.15% financing and document verification.",
        "expected_customer": "Perfect, let's do the financing and document upload."
    }
]

class OutboundCallService:
    @staticmethod
    async def trigger_outbound_call(db: AsyncSession, req: OutboundCallTriggerRequest) -> OutboundCallLog:
        # Find customer
        stmt = select(Customer).where(Customer.customer_id == req.customer_id)
        res = await db.execute(stmt)
        customer = res.scalars().first()
        if not customer:
            stmt_all = select(Customer).limit(1)
            res_all = await db.execute(stmt_all)
            customer = res_all.scalars().first()
            if not customer:
                customer = Customer(
                    customer_id=req.customer_id,
                    name=req.customer_name,
                    phone=req.phone_number,
                    city="Mumbai",
                    current_phase="POST_TEST_RIDE_CALL"
                )
                db.add(customer)
                await db.flush()

        call_ref = f"CALL-MIA-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        full_transcript = f"""[00:02] MIA: "Hi Aarav! Hope you enjoyed driving the Thar ROXX with Advisor Rajesh. How did the suspension feel on the Bandra-Worli Sea Link?"
[00:15] Aarav: "The engine and suspension were amazing! But honestly, my wife is slightly concerned about rear seat legroom and the delivery wait period."
[00:32] MIA: "I completely understand! For rear comfort, the AX7L variant includes 60:40 split reclining seats which add significant legroom and under-thigh comfort. Regarding wait times, I’ve scanned our real-time regional allocation pipeline: we have a Stealth Black AX7L Diesel Automatic scheduled for delivery in 12 days at Bayview Mahindra. If you'd like, we can lock this allocation right now with a refundable deposit."
[00:58] Aarav: "That is fantastic news! Let's lock this allocation right away. Can you send me the financing options?"
[01:12] MIA: "Allocation #MAH-AL-99218 locked! Moving to our 8.15% instant loan pre-approval and digital document upload." """

        call_log = OutboundCallLog(
            call_reference=call_ref,
            customer_id=customer.id,
            agent_name="MIA (Mahindra Intelligent Assistant)",
            phone_number=req.phone_number,
            call_status="COMPLETED",
            call_duration_seconds=82,
            transcript=full_transcript,
            objection_resolution_status="100% RESOLVED (Reclining Seats & 12-Day Stock Lock)",
            customer_sentiment="VERY_POSITIVE (Enthusiastic)",
            customer_decision="LOCKED_FAST_ALLOCATION_PROCEED_TO_FINANCING",
            locked_vehicle_variant=f"{req.vehicle_name} (Stealth Black)",
            locked_allocation_days=12,
            next_step="DIGITAL_FINANCING_KYC"
        )

        db.add(call_log)
        customer.current_phase = "FINANCING_READY"
        await db.commit()
        await db.refresh(call_log)
        return call_log

    @staticmethod
    async def process_dialogue_turn(db: AsyncSession, req: OutboundDialogueTurnRequest) -> OutboundDialogueTurnResponse:
        turn_idx = req.turn_index
        customer_msg = req.customer_speech.lower()

        if turn_idx >= len(CALL_SCRIPT_TURNS):
            agent_reply = "Wonderful Aarav ji! Your vehicle allocation is locked, and your loan is ready for instant sanction. Let's proceed to document verification."
            is_finished = True
            action = "PROCEED_TO_FINANCING"
        else:
            turn_data = CALL_SCRIPT_TURNS[turn_idx]
            agent_reply = turn_data["agent"]
            is_finished = (turn_idx == len(CALL_SCRIPT_TURNS) - 1)
            action = "LOCK_ALLOCATION_AND_FINANCE" if is_finished else "AWAIT_CUSTOMER_REPLY"

        return OutboundDialogueTurnResponse(
            call_reference=req.call_reference,
            speaker="MIA",
            agent_message=agent_reply,
            is_call_finished=is_finished,
            action_item=action,
            turn_index=turn_idx + 1
        )

    @staticmethod
    async def get_call_insights(db: AsyncSession, call_reference: str) -> Optional[OutboundCallInsightsResponse]:
        stmt = select(OutboundCallLog).where(OutboundCallLog.call_reference == call_reference)
        res = await db.execute(stmt)
        call = res.scalars().first()
        if not call:
            return None

        # Fetch customer
        cust_stmt = select(Customer).where(Customer.id == call.customer_id)
        cust_res = await db.execute(cust_stmt)
        cust = cust_res.scalars().first()

        return OutboundCallInsightsResponse(
            call_reference=call.call_reference,
            customer_id=cust.customer_id if cust else "CUST-AARAV-001",
            customer_name=cust.name if cust else "Aarav Sharma",
            agent_name=call.agent_name,
            phone_number=call.phone_number,
            call_status=call.call_status,
            call_duration_seconds=call.call_duration_seconds,
            transcript=call.transcript or "",
            objections_handled=[
                "Rear Seat Legroom (Resolved: 60:40 Split Reclining Seats demonstrated)",
                "Waiting Period Anxiety (Resolved: Stealth Black AX7L allocated in 12 days)"
            ],
            objection_resolution_status=call.objection_resolution_status or "100% RESOLVED",
            customer_sentiment=call.customer_sentiment or "VERY_POSITIVE",
            customer_decision=call.customer_decision or "LOCKED_FAST_ALLOCATION",
            locked_vehicle_variant=call.locked_vehicle_variant or "Thar ROXX AX7L Diesel AT (Stealth Black)",
            locked_allocation_days=call.locked_allocation_days or 12,
            next_step=call.next_step or "DIGITAL_FINANCING_KYC",
            created_at=call.created_at
        )
