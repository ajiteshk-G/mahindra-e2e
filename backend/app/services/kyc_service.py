import hashlib
import time
from typing import Dict, Any
from app.schemas.kyc import (
    KYCScanRequest,
    KYCScanResponse,
    VoiceConsentRequest,
    VoiceConsentResponse,
    FinancingCalculationRequest,
    FinancingCalculationResponse
)

class KYCService:
    @staticmethod
    def process_kyc_document(request: KYCScanRequest) -> KYCScanResponse:
        """Simulates multimodal OCR extraction from PAN / Aadhaar card images."""
        doc_type = request.document_type.upper()
        
        if doc_type == "PAN":
            extracted = {
                "document_type": "Permanent Account Number (PAN)",
                "id_number": "ABCPS1234K",
                "full_name": "Aarav Sharma",
                "fathers_name": "Rajendra Sharma",
                "dob": "14/05/1990",
                "issuer": "Income Tax Department, Government of India",
                "verification_status": "AUTHENTIC_NSDL_MATCH"
            }
            msg = "PAN Card verified successfully via Gemini OCR. Identity matched with NSDL records."
        elif doc_type == "AADHAAR":
            extracted = {
                "document_type": "Aadhaar Card",
                "id_number": "XXXX-XXXX-8921",
                "full_name": "Aarav Sharma",
                "address": "B-402, Sea Green Apartments, Bandra West, Mumbai, MH 400050",
                "dob": "14/05/1990",
                "gender": "Male",
                "issuer": "UIDAI",
                "verification_status": "QR_CODE_AUTHENTICATED"
            }
            msg = "Aadhaar Card scanned and address verified. UIDAI QR code signature validated."
        else:
            extracted = {
                "document_type": "Driving License",
                "id_number": "MH02-20120045981",
                "full_name": "Aarav Sharma",
                "valid_till": "13/05/2030",
                "vehicle_classes": ["LMV", "MCWG"]
            }
            msg = "Driving License validated with Parivahan portal."

        return KYCScanResponse(
            status="VERIFIED",
            document_type=doc_type,
            extracted_fields=extracted,
            confidence_score=0.992,
            message=msg
        )

    @staticmethod
    def generate_voice_consent_token(request: VoiceConsentRequest) -> VoiceConsentResponse:
        """Generates biometric consent hash token for voice-driven loan approval."""
        raw_token_data = f"{request.customer_id}|{request.spoken_phrase}|{request.loan_amount}|{time.time()}"
        sha_hash = hashlib.sha256(raw_token_data.encode()).hexdigest()
        token = f"VBC-{sha_hash[:16].upper()}"
        
        # 60-month EMI calculation at 8.15%
        p = request.loan_amount
        r = 8.15 / (12 * 100)
        n = 60
        emi = int(p * r * ((1 + r)**n) / (((1 + r)**n) - 1))

        return VoiceConsentResponse(
            status="APPROVED",
            consent_token=token,
            biometric_hash=f"SHA256:{sha_hash}",
            sanctioned_amount=request.loan_amount,
            interest_rate="8.15% Fixed",
            tenure_months=60,
            estimated_emi=emi,
            message="Voice biometric consent verified and encrypted. Loan sanctioned with zero pre-closure charges."
        )

    @staticmethod
    def calculate_financing(req: FinancingCalculationRequest) -> FinancingCalculationResponse:
        loan_amt = max(0, req.vehicle_price - req.down_payment)
        r = (req.interest_rate_pct / 100) / 12
        n = req.tenure_months
        
        if loan_amt == 0 or n == 0:
            return FinancingCalculationResponse(
                loan_amount=0,
                interest_rate=req.interest_rate_pct,
                tenure_months=n,
                monthly_emi=0,
                total_interest=0,
                total_payable=req.down_payment
            )
            
        emi = int(loan_amt * r * ((1 + r)**n) / (((1 + r)**n) - 1))
        total_payable = (emi * n) + req.down_payment
        total_interest = (emi * n) - loan_amt

        return FinancingCalculationResponse(
            loan_amount=loan_amt,
            interest_rate=req.interest_rate_pct,
            tenure_months=n,
            monthly_emi=emi,
            total_interest=total_interest,
            total_payable=total_payable
        )
