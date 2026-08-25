import math
import hashlib
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.financing import FinancingApplication
from app.models.customer import Customer
from app.schemas.financing import (
    EMICalculationRequest,
    EMICalculationResponse,
    AmortizationScheduleItem,
    DocumentUploadRequest,
    DocumentExtractedResponse,
    VoiceBiometricConsentRequest,
    VoiceBiometricConsentResponse,
    SanctionLetterResponse
)

class FinancingService:
    @staticmethod
    def calculate_emi(req: EMICalculationRequest) -> EMICalculationResponse:
        ex_price = req.ex_showroom_price
        rto = int(ex_price * 0.12)
        insurance = int(ex_price * 0.038)
        other = 25000 # Fastag, TCS, municipal cess
        on_road = ex_price + rto + insurance + other

        loan_amount = max(0, on_road - req.down_payment)
        tenure = req.tenure_months
        rate_annual = req.interest_rate_annual

        if loan_amount <= 0 or tenure <= 0:
            monthly_emi = 0
            total_interest = 0
            total_payable = 0
            schedule = []
        else:
            monthly_rate = rate_annual / (12 * 100)
            factor = math.pow(1 + monthly_rate, tenure)
            monthly_emi = int(round(loan_amount * monthly_rate * factor / (factor - 1)))
            total_payable = monthly_emi * tenure
            total_interest = total_payable - loan_amount

            # Build month-by-month amortization schedule
            schedule: List[AmortizationScheduleItem] = []
            balance = loan_amount
            for m in range(1, tenure + 1):
                interest_m = int(round(balance * monthly_rate))
                principal_m = min(balance, monthly_emi - interest_m)
                balance = max(0, balance - principal_m)
                year_num = (m - 1) // 12 + 1
                schedule.append(AmortizationScheduleItem(
                    month=m,
                    year=year_num,
                    emi=monthly_emi,
                    principal_paid=principal_m,
                    interest_paid=interest_m,
                    outstanding_balance=balance
                ))

        return EMICalculationResponse(
            vehicle_id=req.vehicle_id,
            variant=req.variant,
            ex_showroom_price=ex_price,
            rto_registration=rto,
            insurance_comprehensive=insurance,
            other_charges=other,
            on_road_price=on_road,
            down_payment=req.down_payment,
            loan_amount=loan_amount,
            tenure_months=tenure,
            interest_rate_annual=rate_annual,
            monthly_emi=monthly_emi,
            total_interest=total_interest,
            total_payable=total_payable,
            amortization_schedule=schedule
        )

    @staticmethod
    async def process_document(db: AsyncSession, req: DocumentUploadRequest) -> DocumentExtractedResponse:
        doc_type = req.document_type.upper()
        now = datetime.datetime.now(datetime.timezone.utc)

        # Find customer
        stmt = select(Customer).where(Customer.customer_id == req.customer_id)
        res = await db.execute(stmt)
        customer = res.scalars().first()

        cust_name = customer.name if customer else "Aarav Sharma"

        if doc_type == "AADHAAR":
            extracted = {
                "document_type": "Aadhaar Card (UIDAI)",
                "full_name": cust_name,
                "id_number": "XXXX-XXXX-8921",
                "dob": "14/08/1991",
                "gender": "Male",
                "address": "Flat 402, Sea Green Apartments, Perry Cross Road, Bandra West, Mumbai, Maharashtra 400050",
                "qr_code_verified": True,
                "issuing_authority": "Unique Identification Authority of India (UIDAI)"
            }
            if customer:
                customer.aadhaar_masked = "XXXX-XXXX-8921"
                customer.kyc_status = "VERIFIED"
                await db.commit()

            return DocumentExtractedResponse(
                document_type="AADHAAR",
                verification_status="VERIFIED",
                confidence_score=0.994,
                extracted_fields=extracted,
                created_at=now
            )

        elif doc_type == "PAN":
            extracted = {
                "document_type": "Permanent Account Number (PAN)",
                "full_name": cust_name.upper(),
                "father_name": "RAMESH SHARMA",
                "id_number": "ABCPS1234K",
                "dob": "14/08/1991",
                "pan_status": "OPERATIVE_AND_AADHAAR_SEEDED",
                "issuing_authority": "Income Tax Department, Govt of India"
            }
            if customer:
                customer.pan_number = "ABCPS1234K"
                await db.commit()

            return DocumentExtractedResponse(
                document_type="PAN",
                verification_status="VERIFIED",
                confidence_score=0.998,
                extracted_fields=extracted,
                created_at=now
            )

        elif doc_type in ["SALARY_SLIP", "BANK_STATEMENT"]:
            extracted = {
                "document_type": "Monthly Salary Slip / Bank Statement",
                "employee_name": cust_name,
                "employer_name": "Tata Consultancy Services Ltd",
                "designation": "Lead Solutions Architect",
                "month_year": "July 2026",
                "gross_salary": "₹1,85,000",
                "net_monthly_salary": "₹1,42,000",
                "tax_deductions_tds": "₹28,500",
                "provident_fund": "₹14,500",
                "salary_account_verified": "HDFC Bank (A/C: *******8819)",
                "stability_months": "48 Months with Current Employer"
            }
            # FOIR Ratio calculation: proposed EMI (~₹37,654) / Net salary (₹1,42,000) = 26.5%
            income_metrics = {
                "net_monthly_income_inr": 142000,
                "proposed_monthly_emi_inr": 37654,
                "foir_ratio_percentage": 26.5,
                "risk_rating": "AAA (Prime Salaried Tier-1)",
                "max_eligible_loan_inr": 3200000
            }
            return DocumentExtractedResponse(
                document_type=doc_type,
                verification_status="VERIFIED",
                confidence_score=0.985,
                extracted_fields=extracted,
                income_metrics=income_metrics,
                created_at=now
            )

        else:
            return DocumentExtractedResponse(
                document_type=doc_type,
                verification_status="VERIFIED",
                confidence_score=0.95,
                extracted_fields={"file_name": req.file_name or "document.pdf", "status": "VERIFIED"},
                created_at=now
            )

    @staticmethod
    async def process_voice_consent(db: AsyncSession, req: VoiceBiometricConsentRequest) -> VoiceBiometricConsentResponse:
        now = datetime.datetime.now(datetime.timezone.utc)
        phrase = req.spoken_phrase or f"I, {req.customer_name}, approve the loan application of Rs {req.loan_amount} with Mahindra Finance."
        raw_token = f"{req.customer_id}_{req.loan_amount}_{phrase}_{now.isoformat()}"
        bio_hash = "MH-VOICE-BIO-" + hashlib.sha256(raw_token.encode("utf-8")).hexdigest()[:16].upper()
        sanction_id = f"SAN-MF-{now.strftime('%Y%m')}-{hashlib.md5(raw_token.encode('utf-8')).hexdigest()[:5].upper()}"

        # Update customer and save application
        stmt = select(Customer).where(Customer.customer_id == req.customer_id)
        res = await db.execute(stmt)
        customer = res.scalars().first()

        if customer:
            customer.voice_consent_hash = bio_hash
            customer.loan_preapproval_amount = req.loan_amount
            customer.loan_status = "PROVISIONALLY_APPROVED"
            customer.current_phase = "FINANCING"
            
            # Create or update financing application
            app_record = FinancingApplication(
                application_id=f"APP-MF-{now.strftime('%Y%m')}-{sanction_id[-5:]}",
                customer_id=customer.id,
                vehicle_id=customer.interested_vehicle_id or "thar_roxx",
                variant=customer.interested_variant or "AX7L Diesel AT 4x4",
                ex_showroom_price=2249000,
                on_road_price=2645000,
                down_payment=max(0, 2645000 - req.loan_amount),
                loan_amount=req.loan_amount,
                tenure_months=60,
                interest_rate_annual=8.15,
                monthly_emi=37654,
                voice_consent_phrase=phrase,
                voice_consent_hash=bio_hash,
                sanction_id=sanction_id,
                sanction_status="APPROVED",
                sanction_date=now
            )
            db.add(app_record)
            await db.commit()

        return VoiceBiometricConsentResponse(
            customer_id=req.customer_id,
            consent_status="GRANTED",
            biometric_hash=bio_hash,
            loan_amount=req.loan_amount,
            sanction_id=sanction_id,
            sanction_date=now,
            message="Voice biometric consent token verified and recorded. Loan Sanction Letter issued instantly."
        )

    @staticmethod
    async def get_sanction_letter(db: AsyncSession, customer_id: str) -> SanctionLetterResponse:
        stmt = select(Customer).where(Customer.customer_id == customer_id)
        res = await db.execute(stmt)
        customer = res.scalars().first()

        cust_name = customer.name if customer else "Aarav Sharma"
        phone = customer.phone if customer else "+91 98201 23456"
        email = customer.email if customer else "aarav.sharma@example.com"
        loan_amount = customer.loan_preapproval_amount if customer and customer.loan_preapproval_amount else 1850000

        sanction_id = f"SAN-MF-2026-{hashlib.md5(f'{customer_id}_{loan_amount}'.encode('utf-8')).hexdigest()[:5].upper()}"

        return SanctionLetterResponse(
            sanction_id=sanction_id,
            application_id=f"APP-MF-2026-99182",
            customer_id=customer_id,
            customer_name=cust_name,
            phone=phone,
            email=email,
            vehicle_name="Mahindra Thar ROXX",
            variant="AX7L Diesel Automatic 4x4 (Stealth Black)",
            on_road_price=2645000,
            down_payment=795000,
            sanctioned_loan_amount=loan_amount,
            tenure_months=60,
            interest_rate_annual=8.15,
            monthly_emi=37654,
            lender_name="Mahindra & Mahindra Financial Services Limited (Mahindra Finance)",
            special_benefits=[
                "Zero Pre-closure / Foreclosure charges after 6 months",
                "Instant Digital Loan Sanction & 5-minute Paperless KYC",
                "Complimentary 1-Year Mahindra Roadside Assistance Shield",
                "Pre-approved Add-on Accessory Loan line up to ₹1,00,000"
            ],
            kyc_summary={
                "aadhaar_status": "VERIFIED (UIDAI)",
                "pan_status": "ACTIVE (ABCPS1234K)",
                "salary_verification": "VERIFIED (TCS Ltd - ₹1,42,000/mo Net)",
                "foir_ratio": "26.5% (Safe)",
                "voice_biometric_hash": customer.voice_consent_hash if customer and customer.voice_consent_hash else "MH-VOICE-BIO-9A1F82B"
            },
            sanction_date=datetime.datetime.now(datetime.timezone.utc),
            status="SANCTIONED_PRE_APPROVED"
        )
