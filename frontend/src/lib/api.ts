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
export async function fetchSalesLeads(dealershipId?: string) {
  try {
    const url = dealershipId && dealershipId !== "ALL"
      ? `${API_BASE}/sales/leads?dealership_id=${encodeURIComponent(dealershipId)}`
      : `${API_BASE}/sales/leads`;
    const res = await fetch(url);
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

export async function fetchLatestTestRideInsights(params?: { customer_id?: string; booking_reference?: string; phone?: string }) {
  try {
    const q = new URLSearchParams();
    if (params?.customer_id) q.set("customer_id", params.customer_id);
    if (params?.booking_reference) q.set("booking_reference", params.booking_reference);
    if (params?.phone) q.set("phone", params.phone);
    const res = await fetch(`${API_BASE}/sales/test-ride/latest?${q.toString()}`);
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (err) {
    return null;
  }
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



export async function saveFullSessionTranscript(payload: {
  session_id: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  vehicle_id?: string;
  channel?: string;
  messages: Array<{
    speaker: string;
    text: string;
    timestamp?: string;
    toolCall?: string;
    language?: string;
  }>;
}) {
  try {
    const res = await fetch(`${API_BASE}/customer/save-full-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.debug("Failed to flush session transcript to database:", err);
    return null;
  }
}


export async function fetchAdminBookings(params?: { city?: string; vehicle_id?: string; status?: string; search?: string }) {
  try {
    const q = new URLSearchParams();
    if (params?.city) q.set("city", params.city);
    if (params?.vehicle_id) q.set("vehicle_id", params.vehicle_id);
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const res = await fetch(`${API_BASE}/admin/bookings?${q.toString()}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function saveOutboundCallTranscript(payload: {
  call_reference: string;
  booking_reference?: string;
  customer_id?: string;
  phone_number?: string;
  customer_name?: string;
  vehicle_name?: string;
  duration_seconds?: number;
  turns: Array<{
    speaker: string;
    role?: string;
    text?: string;
    message?: string;
    time?: string;
  }>;
}) {
  try {
    const res = await fetch(`${API_BASE}/outbound/save-call-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.debug("Failed to save outbound transcript:", err);
    return null;
  }
}
