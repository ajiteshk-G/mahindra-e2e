from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.telematics import TelematicsAlert
from app.schemas.telematics import TelematicsSnapshot, ServiceBookingFromTelematicsRequest

class TelematicsService:
    @staticmethod
    def get_live_snapshot(vin: str = "MAH1THARROXX2026MUM01") -> TelematicsSnapshot:
        """Returns real-time simulated IoT telematics metrics for customer's vehicle."""
        return TelematicsSnapshot(
            vin=vin,
            vehicle_name="Mahindra Thar ROXX AX7L Diesel AT",
            odometer_km=9820,
            service_due_km=10000,
            oil_viscosity_pct=14.0, # 14% remaining life -> triggers amber warning
            battery_soc_pct=84.0,
            distance_to_empty_km=465,
            tpms_front_left_psi=32.5,
            tpms_front_right_psi=32.0,
            tpms_rear_left_psi=33.0,
            tpms_rear_right_psi=33.0,
            doors_locked=True,
            engine_status="OFF"
        )

    @staticmethod
    async def create_service_due_alert(db: AsyncSession, customer_db_id: int, vin: str = "MAH1THARROXX2026MUM01") -> TelematicsAlert:
        stmt = select(TelematicsAlert).where(TelematicsAlert.customer_id == customer_db_id, TelematicsAlert.vin == vin, TelematicsAlert.alert_type == "SERVICE_DUE")
        res = await db.execute(stmt)
        alert = res.scalars().first()
        
        if not alert:
            alert = TelematicsAlert(
                customer_id=customer_db_id,
                vin=vin,
                alert_type="SERVICE_DUE",
                severity="WARNING",
                message="Periodic Service Due in 180 km (Odometer: 9,820 km). Routine engine oil and filter replacement recommended.",
                current_odometer_km=9820,
                service_due_km=10000,
                oil_viscosity_pct=14.0,
                battery_soc_pct=84.0,
                distance_to_empty_km=465,
                tpms_front_left_psi=32.5,
                tpms_front_right_psi=32.0,
                tpms_rear_left_psi=33.0,
                tpms_rear_right_psi=33.0,
                is_actioned=False
            )
            db.add(alert)
            await db.commit()
            await db.refresh(alert)
        return alert

    @staticmethod
    async def action_service_alert(db: AsyncSession, customer_db_id: int, req: ServiceBookingFromTelematicsRequest) -> TelematicsAlert:
        stmt = select(TelematicsAlert).where(TelematicsAlert.customer_id == customer_db_id, TelematicsAlert.vin == req.vin)
        res = await db.execute(stmt)
        alert = res.scalars().first()
        if alert:
            alert.is_actioned = True
            alert.action_taken = f"Confirmed Home Pickup for {req.preferred_slot} with Bayview Mahindra Workshop. Driver assigned: Ramesh."
            await db.commit()
            await db.refresh(alert)
        return alert
