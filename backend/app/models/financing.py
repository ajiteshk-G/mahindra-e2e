from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base

class FinancingApplication(Base):
    __tablename__ = "financing_applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    application_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. "APP-MF-2026-99182"
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    # Vehicle and Pricing
    vehicle_id = Column(String(64), nullable=False, default="thar_roxx")
    variant = Column(String(128), default="AX7L Diesel AT 4x4")
    ex_showroom_price = Column(Integer, default=2249000)
    on_road_price = Column(Integer, default=2645000)
    
    # Loan parameters
    down_payment = Column(Integer, default=500000)
    loan_amount = Column(Integer, default=1850000)
    tenure_months = Column(Integer, default=60)
    interest_rate_annual = Column(Float, default=8.15)
    monthly_emi = Column(Integer, default=37654)
    total_interest = Column(Integer, default=409240)
    total_payable = Column(Integer, default=2259240)
    
    # Uploaded & Extracted Documents KYC
    aadhaar_extracted = Column(JSON, nullable=True) # {name, uid, address, dob}
    pan_extracted = Column(JSON, nullable=True) # {pan_number, full_name, tax_status}
    salary_slip_extracted = Column(JSON, nullable=True) # {employer, gross_salary, net_monthly_salary, foir_ratio}
    monthly_income = Column(Integer, default=142000)
    foir_ratio = Column(Float, default=26.5) # Debt to income ratio (26.5% - Safe)
    
    # Voice Biometric Token & Approval
    voice_consent_phrase = Column(Text, default="I, Aarav Sharma, approve the loan application of Rs 18.5 Lakhs with Mahindra Finance.")
    voice_consent_hash = Column(String(128), nullable=True)
    sanction_id = Column(String(64), default="SAN-MF-2026-99182")
    sanction_status = Column(String(32), default="APPROVED") # PENDING, APPROVED, REJECTED, DISBURSED
    sanction_date = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="financing_applications")
