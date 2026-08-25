from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.financing import (
    EMICalculationRequest,
    EMICalculationResponse,
    DocumentUploadRequest,
    DocumentExtractedResponse,
    VoiceBiometricConsentRequest,
    VoiceBiometricConsentResponse,
    SanctionLetterResponse
)
from app.services.financing_service import FinancingService

router = APIRouter(prefix="/financing", tags=["Instant Car Financing & Document KYC"])

@router.post("/calculate-emi", response_model=EMICalculationResponse)
async def calculate_car_financing(req: EMICalculationRequest):
    """Calculates on-road price, loan amount, monthly EMI, total interest, and amortisation schedule."""
    return FinancingService.calculate_emi(req)

@router.post("/upload-document", response_model=DocumentExtractedResponse)
async def upload_kyc_income_document(
    req: DocumentUploadRequest,
    db: AsyncSession = Depends(get_db)
):
    """AI OCR extraction for Aadhaar, PAN, Salary Slip, and Bank Statement with FOIR ratio evaluation."""
    return await FinancingService.process_document(db, req)

@router.post("/voice-consent", response_model=VoiceBiometricConsentResponse)
async def record_voice_biometric_consent(
    req: VoiceBiometricConsentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Captures customer voice biometric consent token for instant loan sanction."""
    return await FinancingService.process_voice_consent(db, req)

@router.get("/sanction-letter/{customer_id}", response_model=SanctionLetterResponse)
async def get_digital_sanction_letter(
    customer_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve pre-approved official Mahindra Finance digital sanction letter."""
    return await FinancingService.get_sanction_letter(db, customer_id)
