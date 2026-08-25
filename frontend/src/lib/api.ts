import { DEFAULT_VEHICLES } from "./defaultCatalog";

function getApiBase() {
  if (typeof window !== "undefined") {
    // In browser, relative /api is proxied by Next.js rewrites to local backend
    return "/api";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
}

const API_BASE = getApiBase();

// Catalog & Dealerships
export async function fetchCatalog() {
  try {
    const res = await fetch(`${API_BASE}/catalog`);
    if (!res.ok) throw new Error("Catalog fetch failed");
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_VEHICLES;
  } catch (err) {
    console.warn("fetchCatalog fallback to default catalog:", err);
    return DEFAULT_VEHICLES;
  }
}

export async function fetchDealerships() {
  try {
    const res = await fetch(`${API_BASE}/catalog/dealerships`);
    return await res.json();
  } catch (err) {
    return [
      {
        id: "bayview_bandra",
        name: "Bayview Mahindra, Bandra West",
        address: "Plot 14, Linking Road, Mumbai",
        city: "Mumbai",
        phone: "+91 22 2640 8899",
        rating: 4.9,
        available_advisors: ["Rajesh Varma (Senior Specialist)", "Pooja Mehta"],
        has_test_drive_home_pickup: true
      }
    ];
  }
}

// Customer Profile & PreSales Identification Gate
export async function identifyCustomer(payload: {
  name: string;
  phone: string;
  session_type?: string;
  vehicle_id?: string;
}) {
  const res = await fetch(`${API_BASE}/customer/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail?.[0]?.msg || errorData.detail || "Validation failed");
  }
  return res.json();
}

export async function saveTranscriptTurn(payload: {
  session_id: string;
  customer_id: string;
  channel?: string;
  speaker: string;
  message: string;
  extracted_intent?: string;
  tool_triggered?: string;
}) {
  const res = await fetch(`${API_BASE}/customer/transcript-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchCustomerSessions(customerIdOrPhone: string) {
  const res = await fetch(`${API_BASE}/customer/sessions?customer_id=${encodeURIComponent(customerIdOrPhone)}`);
  return res.json();
}

export async function fetchCustomerProfile(customerId = "CUST-9820155432") {
  try {
    const res = await fetch(`${API_BASE}/customer/profile?customer_id=${customerId}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function updateCustomerPhase(phase: string, customerId = "CUST-9820155432") {
  const res = await fetch(`${API_BASE}/customer/update-phase?customer_id=${customerId}&phase=${phase}`, {
    method: "POST"
  });
  return res.json();
}

export async function bookTestDrive(payload: any) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// Stage 2: Sales Mobile App & Test Ride Recording
export async function fetchSalesLeads() {
  try {
    const res = await fetch(`${API_BASE}/sales/leads`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function uploadTestRideRecording(payload: any) {
  const res = await fetch(`${API_BASE}/sales/test-ride/upload-recording`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchTestRideInsights(sessionId: string) {
  const res = await fetch(`${API_BASE}/sales/test-ride/insights/${sessionId}`);
  return res.json();
}

export async function fetchAllTestRides() {
  const res = await fetch(`${API_BASE}/sales/test-ride/all`);
  return res.json();
}

// Stage 3: Outbound Proactive Post-Ride Voice Call
export async function triggerOutboundCall(payload: any) {
  const res = await fetch(`${API_BASE}/outbound/trigger-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function sendOutboundDialogueTurn(payload: any) {
  const res = await fetch(`${API_BASE}/outbound/dialogue-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchOutboundCallInsights(callReference: string) {
  const res = await fetch(`${API_BASE}/outbound/call-insights/${callReference}`);
  return res.json();
}

// Stage 4: Financing & Document KYC
export async function calculateEMI(payload: any) {
  const res = await fetch(`${API_BASE}/financing/calculate-emi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function uploadKYCDocument(payload: any) {
  const res = await fetch(`${API_BASE}/financing/upload-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function recordVoiceConsent(payload: any) {
  const res = await fetch(`${API_BASE}/financing/voice-consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchSanctionLetter(customerId = "CUST-9820155432") {
  const res = await fetch(`${API_BASE}/financing/sanction-letter/${customerId}`);
  return res.json();
}

// Aliases for modals
export async function scanKYCDocument(payload: any) {
  return uploadKYCDocument(payload);
}

export async function submitVoiceConsent(payload: any) {
  return recordVoiceConsent(payload);
}

// Diagnostics & Claims
export async function assessDamage(payload: any) {
  const res = await fetch(`${API_BASE}/diagnostics/assess-damage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fileInsuranceClaim(payload: any) {
  const res = await fetch(`${API_BASE}/diagnostics/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

// Telematics
export async function fetchLiveTelematics(vin = "MAH1THARROXX2026MUM01") {
  try {
    const res = await fetch(`${API_BASE}/telematics/live?vin=${vin}`);
    return await res.json();
  } catch (err) {
    return {
      vin,
      vehicle_name: "Mahindra Thar ROXX AX7L Diesel AT",
      odometer_km: 9820,
      service_due_km: 10000,
      oil_viscosity_pct: 14.0,
      battery_soc_pct: 84.0,
      distance_to_empty_km: 465,
      tpms_front_left_psi: 32.5,
      tpms_front_right_psi: 32.5,
      tpms_rear_left_psi: 32.5,
      tpms_rear_right_psi: 32.5,
      doors_locked: true,
      engine_status: "STANDBY"
    };
  }
}

export async function triggerTelematicsAlert(customerId = "CUST-9820155432") {
  const res = await fetch(`${API_BASE}/telematics/trigger-alert?customer_id=${customerId}`, {
    method: "POST"
  });
  return res.json();
}
