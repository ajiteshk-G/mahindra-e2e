from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class EMICalculationRequest(BaseModel):
    vehicle_id: str = Field(default="thar_roxx", description="Vehicle model ID")
    variant: str = Field(default="AX7L Diesel AT 4x4", description="Vehicle variant")
    ex_showroom_price: int = Field(default=2249000, description="Ex-showroom price in INR")
    down_payment: int = Field(default=500000, description="Down payment amount in INR")
    tenure_months: int = Field(default=60, description="Tenure in months (12, 24, 36, 48, 60, 84)")
    interest_rate_annual: float = Field(default=8.15, description="Annual interest rate percentage")

class AmortizationScheduleItem(BaseModel):
    month: int
    year: int
    emi: int
    principal_paid: int
    interest_paid: int
    outstanding_balance: int

class EMICalculationResponse(BaseModel):
    vehicle_id: str
    variant: str
    ex_showroom_price: int
    rto_registration: int
    insurance_comprehensive: int
    other_charges: int
    on_road_price: int
    down_payment: int
    loan_amount: int
    tenure_months: int
    interest_rate_annual: float
    monthly_emi: int
    total_interest: int
    total_payable: int
    amortization_schedule: List[AmortizationScheduleItem]

class DocumentUploadRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID")
    document_type: str = Field(..., description="AADHAAR, PAN, SALARY_SLIP, or BANK_STATEMENT")
    file_base64: Optional[str] = Field(None, description="Base64 encoded document image or PDF")
    file_name: Optional[str] = Field(None, description="Filename")

class DocumentExtractedResponse(BaseModel):
    document_type: str
    verification_status: str # VERIFIED, REJECTED, PENDING
    confidence_score: float
    extracted_fields: Dict[str, Any]
    income_metrics: Optional[Dict[str, Any]] = None
    created_at: datetime

class VoiceBiometricConsentRequest(BaseModel):
    customer_id: str = Field(..., description="Customer ID")
    loan_amount: int = Field(..., description="Approved Loan Amount")
    customer_name: str = Field(default="Aarav Sharma")
    audio_base64: Optional[str] = Field(None, description="Voice recording base64")
    spoken_phrase: str = Field(default="I, Aarav Sharma, approve the loan application of Rs 18.5 Lakhs with Mahindra Finance.")

class VoiceBiometricConsentResponse(BaseModel):
    customer_id: str
    consent_status: str # GRANTED
    biometric_hash: str
    loan_amount: int
    sanction_id: str
    sanction_date: datetime
    message: str

class SanctionLetterResponse(BaseModel):
    sanction_id: str
    application_id: str
    customer_id: str
    customer_name: str
    phone: str
    email: str
    vehicle_name: str
    variant: str
    on_road_price: int
    down_payment: int
    sanctioned_loan_amount: int
    tenure_months: int
    interest_rate_annual: float
    monthly_emi: int
    lender_name: str = "Mahindra & Mahindra Financial Services Limited (Mahindra Finance)"
    special_benefits: List[str]
    kyc_summary: Dict[str, Any]
    sanction_date: datetime
    status: str = "SANCTIONED_PRE_APPROVED"
