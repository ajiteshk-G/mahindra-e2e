export interface VehicleVariant {
  name: string;
  price_ex_showroom: string;
  engine_or_battery: string;
  transmission: string;
  key_features: string[];
}

export interface VehicleItem {
  id: string;
  name: string;
  tagline: string;
  category: "Authentic SUV" | "Tech SUV" | "Born Electric SUV" | "Commercial";
  price_range: string;
  hero_image: string;
  image_url?: string;
  engine_specs: string;
  seating_capacity: string;
  fuel_or_battery: string;
  range_or_mileage: string;
  key_highlights: string[];
  usp: string;
  variants: VehicleVariant[];
}

export interface DealershipItem {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  rating: number;
  available_advisors: string[];
  has_test_drive_home_pickup: boolean;
}

export interface CustomerProfile {
  id: number;
  customer_id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  preferred_language: string;
  current_phase: string;
  interested_vehicle_id: string;
  interested_variant: string;
  budget_range: string;
  pan_number?: string;
  aadhaar_masked?: string;
  kyc_status: "PENDING" | "VERIFIED" | "REJECTED";
  kyc_extracted_data?: Record<string, any>;
  loan_preapproval_amount: number;
  loan_interest_rate: string;
  voice_consent_hash?: string;
  loan_status: string;
  owned_vin?: string;
  owned_vehicle_name?: string;
  registration_number?: string;
  odometer_km: number;
  insurance_policy_number?: string;
  insurance_type?: string;
}

export interface TelematicsData {
  vin: string;
  vehicle_name: string;
  odometer_km: number;
  service_due_km: number;
  oil_viscosity_pct: number;
  battery_soc_pct: number;
  distance_to_empty_km: number;
  tpms_front_left_psi: number;
  tpms_front_right_psi: number;
  tpms_rear_left_psi: number;
  tpms_rear_right_psi: number;
  doors_locked: boolean;
  engine_status: string;
}

// Stage 2: Sales Mobile App & Test Ride Insights
export interface TestRideLeadItem {
  customer_id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  preferred_vehicle: string;
  vehicle_id?: string;
  variant?: string;
  booking_reference?: string;
  dealership_id?: string;
  dealership_name?: string;
  booking_type?: string;
  delivery_address?: string;
  booking_status: string;
  scheduled_slot?: string;
  presales_notes?: string;
  advisor_checklist?: string[];
  is_custom_checklist?: boolean;
}

export interface TestRideInsightResponse {
  session_id: string;
  customer_id: string;
  vehicle_id: string;
  vehicle_name: string;
  sales_advisor_name: string;
  gcs_uri: string;
  gcs_bucket: string;
  duration_seconds: number;
  transcript: string;
  customer_sentiment_score: number;
  purchase_intent_score: number;
  loved_features: string[];
  objections_raised: string[];
  advisor_pitch_score: number;
  advisor_coaching_feedback: string;
  recommended_action: string;
  status: string;
  created_at: string;
}

// Stage 3: Outbound Call & Insights
export interface OutboundDialogueTurnResponse {
  call_reference: string;
  speaker: string;
  agent_message: string;
  audio_tts_url?: string;
  is_call_finished: boolean;
  action_item?: string;
  turn_index: number;
}

export interface OutboundCallInsightsResponse {
  call_reference: string;
  customer_id: string;
  customer_name: string;
  agent_name: string;
  phone_number: string;
  call_status: string;
  call_duration_seconds: number;
  transcript: string;
  objections_handled: string[];
  objection_resolution_status: string;
  customer_sentiment: string;
  customer_decision: string;
  locked_vehicle_variant: string;
  locked_allocation_days: number;
  next_step: string;
  created_at: string;
}

// Stage 4: Financing & Document KYC
export interface AmortizationScheduleItem {
  month: number;
  year: number;
  emi: number;
  principal_paid: number;
  interest_paid: number;
  outstanding_balance: number;
}

export interface EMICalculationResponse {
  vehicle_id: string;
  variant: string;
  ex_showroom_price: number;
  rto_registration: number;
  insurance_comprehensive: number;
  other_charges: number;
  on_road_price: number;
  down_payment: number;
  loan_amount: number;
  tenure_months: number;
  interest_rate_annual: number;
  monthly_emi: number;
  total_interest: number;
  total_payable: number;
  amortization_schedule: AmortizationScheduleItem[];
}

export interface DocumentExtractedResponse {
  document_type: string;
  verification_status: string;
  confidence_score: number;
  extracted_fields: Record<string, any>;
  income_metrics?: Record<string, any>;
  created_at: string;
}

export interface VoiceBiometricConsentResponse {
  customer_id: string;
  consent_status: string;
  biometric_hash: string;
  loan_amount: number;
  sanction_id: string;
  sanction_date: string;
  message: string;
}

export interface SanctionLetterResponse {
  sanction_id: string;
  application_id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  email: string;
  vehicle_name: string;
  variant: string;
  on_road_price: number;
  down_payment: number;
  sanctioned_loan_amount: number;
  tenure_months: number;
  interest_rate_annual: number;
  monthly_emi: number;
  lender_name: string;
  special_benefits: string[];
  kyc_summary: Record<string, any>;
  sanction_date: string;
  status: string;
}
