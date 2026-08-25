# Mahindra Intelligent Assistant (MIA) — Omnichannel AI Platform

Reimagining Mahindra & Mahindra's customer lifecycle from Pre-Sales Discovery to Post-Sales Claims using **Gemini Multimodal Live Voice**, **Synchronized Co-Browsing Tool Calling**, **Computer Vision Damage Diagnostics**, and **Persistent Customer State**.

---

## 🚗 Customer Lifecycle Coverage

```
       [ Lead Intent ]  ──(Voice AI)──>  [ Dynamic Allocation ]
             │                                   │
             ▼                                   ▼
[ Voice KYC & Financing ] ──(Gemini)───> [ In-Car AdrenoX Setup ]
             │                                   │
             ▼                                   ▼
[ Telematics Maintenance ] ──(Vision AI)─> [ Instant Claims & Parts ]
```

1. **Pre-Sales Discovery:**
   - Web Audio streaming over WebSockets (16kHz mono PCM).
   - Natural Hinglish/English/Hindi voice interaction with acoustic amplitude orb visualizer.
   - Intelligent recommendations across Authentic SUVs (Thar ROXX, Scorpio-N, XUV700) and Born Electric SUVs (BE 6e, XEV 9e, XUV400 EV Pro).
   - 6-step interactive Test Drive booking with dealership DMS slot reservation.

2. **Synchronized UI Co-Browsing:**
   - Gemini Live tool calling triggers real-time viewport actions (showcase spotlights, side-by-side spec comparison matrix, financing drawers).

3. **Showroom Financing & Multimodal KYC:**
   - Instant 8.15% fixed interest loan pre-approval with zero pre-closure charges.
   - Multimodal OCR scanner for PAN & Aadhaar cards.
   - Voice-biometric consent hashing for regulatory compliance.

4. **Connected IoT Telematics & Predictive Service:**
   - Real-time telemetry: Odometer (9,820 km), Engine Oil Viscosity (14%), Battery SoC (84%), TPMS (32.5 PSI).
   - Proactive predictive service alert triggering home pickup booking with Bayview Mahindra Workshop.

5. **Multimodal Computer Vision Diagnostics & Instant Claims:**
   - Live video/photo damage assessment for exterior parts.
   - Automated OEM replacement part catalog mapping (`#TH-88301` Fog Lamp Assembly).
   - Instant digital claim approval with ICICI Lombard at ₹0 out-of-pocket cost.

---

## 🧪 Verification & Automated Tests

- **Backend Pytest Suite:** 20 automated tests passing (100% pass rate).
- **Frontend Production Build:** Next.js 14 App Router compiled successfully with static optimization.

```bash
# Run backend test suite
cd backend
PYTHONPATH=. .venv/bin/pytest tests -v
```

---

## 🚀 Running Locally

```bash
# 1. Start Backend (Port 8000)
cd backend
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000

# 2. Start Frontend (Port 3000)
cd frontend
npm run dev
```
