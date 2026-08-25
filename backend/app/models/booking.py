from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class TestDriveBooking(Base):
    __tablename__ = "test_drive_bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_reference = Column(String(64), unique=True, index=True, nullable=False) # e.g. "BK-MAH-2026-8821"
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    vehicle_id = Column(String(64), nullable=False) # "thar_roxx", "be_6e", "xuv700"
    variant = Column(String(128), nullable=False) # "AX7L Diesel AT 4x4"
    color = Column(String(64), default="Stealth Black")
    
    dealership_id = Column(String(64), default="bayview_bandra")
    dealership_name = Column(String(128), default="Bayview Mahindra, Bandra West")
    sales_advisor_name = Column(String(128), default="Rajesh Varma")
    
    booking_type = Column(String(32), default="HOME_DOORSTEP") # HOME_DOORSTEP, SHOWROOM_VISIT
    delivery_address = Column(Text, nullable=True)
    scheduled_date = Column(String(32), nullable=False) # "Tomorrow" or YYYY-MM-DD
    scheduled_time_slot = Column(String(32), nullable=False) # "5:00 PM"
    
    status = Column(String(32), default="CONFIRMED") # CONFIRMED, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="bookings")
