from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class TelematicsAlert(Base):
    __tablename__ = "telematics_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    vin = Column(String(64), nullable=False)
    
    alert_type = Column(String(64), nullable=False) # SERVICE_DUE, LOW_OIL_VISCOSITY, LOW_TYRE_PRESSURE, BATTERY_HEALTH_OPTIMAL
    severity = Column(String(32), default="WARNING") # INFO, WARNING, CRITICAL
    message = Column(String(256), nullable=False)
    
    current_odometer_km = Column(Integer, default=9820)
    service_due_km = Column(Integer, default=10000)
    oil_viscosity_pct = Column(Float, default=14.0)
    
    battery_soc_pct = Column(Float, default=82.0)
    distance_to_empty_km = Column(Integer, default=460)
    
    tpms_front_left_psi = Column(Float, default=32.5)
    tpms_front_right_psi = Column(Float, default=32.0)
    tpms_rear_left_psi = Column(Float, default=33.0)
    tpms_rear_right_psi = Column(Float, default=33.0)
    
    is_actioned = Column(Boolean, default=False)
    action_taken = Column(String(128), nullable=True) # "BOOKED_PICKUP_SERVICE_SATURDAY_9AM"
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="telematics_alerts")
