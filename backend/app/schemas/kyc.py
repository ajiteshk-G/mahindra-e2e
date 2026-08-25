from typing import Optional, Dict, Any
from pydantic import BaseModel

class KYCScanRequest(BaseModel):
    customer_id: str
    document_type: str # "PAN", "AADHAAR", "DRIVING_LICENSE"
    image_base64: Optional[str] = None
    mock_preset: Optional[str] = None # "aarav_pan", "aarav_aadhaar"

class KYCScanResponse(BaseModel):
    status: str # "VERIFIED", "FLAGGED"
    document_type: str
    extracted_fields: Dict[str, Any]
    confidence_score: float
    message: str

class VoiceConsentRequest(BaseModel):
    customer_id: str
    spoken_phrase: str
    loan_amount: int
    lender_name: str = "Mahindra Finance"

class VoiceConsentResponse(BaseModel):
    status: str # "APPROVED"
    consent_token: str
    biometric_hash: str
    sanctioned_amount: int
    interest_rate: str
    tenure_months: int
    estimated_emi: int
    message: str

class FinancingCalculationRequest(BaseModel):
    vehicle_price: int
    down_payment: int
    tenure_months: int = 60
    interest_rate_pct: float = 8.15

class FinancingCalculationResponse(BaseModel):
    loan_amount: int
    interest_rate: float
    tenure_months: int
    monthly_emi: int
    total_interest: int
    total_payable: int
