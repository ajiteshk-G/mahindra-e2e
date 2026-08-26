from app.schemas.customer import (
    CustomerProfileBase,
    CustomerProfileCreate,
    CustomerProfileUpdate,
    CustomerProfileResponse,
    InteractionLogSchema
)
from app.schemas.catalog import (
    VehicleItem,
    VehicleVariant,
    VehicleComparisonRequest,
    DealershipItem
)
from app.schemas.booking import (
    TestDriveBookingCreate,
    TestDriveBookingResponse
)
from app.schemas.kyc import (
    KYCScanRequest,
    KYCScanResponse,
    VoiceConsentRequest,
    VoiceConsentResponse,
    FinancingCalculationRequest,
    FinancingCalculationResponse
)
from app.schemas.diagnostics import (
    DamageAssessmentRequest,
    DamageAssessmentResponse,
    WarningLightScanRequest,
    WarningLightScanResponse,
    ClaimSubmissionRequest,
    ClaimSubmissionResponse
)

