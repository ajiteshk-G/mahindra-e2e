from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.kyc import (
    KYCScanRequest,
    KYCScanResponse,
    VoiceConsentRequest,
    VoiceConsentResponse,
    FinancingCalculationRequest,
    FinancingCalculationResponse
)
from app.services.kyc_service import KYCService
from app.services.customer_service import CustomerService

router = APIRouter(prefix="/kyc", tags=["Showroom KYC & Financing"])

@router.post("/scan", response_model=KYCScanResponse)
async def scan_kyc_document(req: KYCScanRequest, db: AsyncSession = Depends(get_db)):
    customer = await CustomerService.get_customer_by_id(db, req.customer_id)
    if not customer:
        customer = await CustomerService.get_or_create_default_customer(db)
        
    result = KYCService.process_kyc_document(req)
    
    if req.document_type.upper() == "PAN":
        customer.pan_number = result.extracted_fields.get("id_number", "ABCPS1234K")
    elif req.document_type.upper() == "AADHAAR":
        customer.aadhaar_masked = result.extracted_fields.get("id_number", "XXXX-XXXX-8921")
        
    customer.kyc_status = "VERIFIED"
    customer.kyc_extracted_data = result.extracted_fields
    await db.commit()
    return result

@router.post("/voice-consent", response_model=VoiceConsentResponse)
async def voice_biometric_consent(req: VoiceConsentRequest, db: AsyncSession = Depends(get_db)):
    customer = await CustomerService.get_customer_by_id(db, req.customer_id)
    if not customer:
        customer = await CustomerService.get_or_create_default_customer(db)
        
    result = KYCService.generate_voice_consent_token(req)
    customer.voice_consent_hash = result.biometric_hash
    customer.loan_preapproval_amount = req.loan_amount
    customer.loan_status = "PROVISIONALLY_APPROVED"
    customer.current_phase = "FINANCING"
    await db.commit()
    return result

@router.post("/calculate-financing", response_model=FinancingCalculationResponse)
async def calculate_financing(req: FinancingCalculationRequest):
    return KYCService.calculate_financing(req)
