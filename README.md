# Mahindra Intelligent Assistant (MIA) — Omnichannel AI Platform

An enterprise-grade omnichannel automotive platform for **Mahindra & Mahindra**, reimagining the end-to-end customer journey from **Pre-Sales Virtual Discovery** with an interactive **Kabir AI Avatar**, to **In-Vehicle Test Ride Audio Intelligence** on the Sales Mobile App, and **Post-Ride Outbound Feedback Voice Calls** via Gemini Live & Twilio.

---

## 🚗 Omnichannel Architecture & Stages

```
   ┌─────────────────────────────────────────────────────────────┐
   │          Stage 1: Pre-Sales Virtual Showroom                │
   │  • Kabir AI Multimodal Live Avatar (Video + Audio)          │
   │  • Synchronized Co-Browsing Tool Calling                    │
   │  • Dynamic Feature Checklist Extraction from Customer Chat  │
   │  • Interactive Test Drive Booking with Dealership DMS       │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │          Stage 2: Sales Consultant Mobile App               │
   │  • Real-Time Lead Ingestion with Extracted Checklists       │
   │  • In-Vehicle Test Ride Audio Capture / Simulated Script    │
   │  • Gemini Dynamic Audio Evaluation (Sentiment / Intent /    │
   │    Advisor Pitch Score & Coaching Feedback)                 │
   │  • Lead Status Updates to 'TestRide_Completed'              │
   └──────────────────────────────┬──────────────────────────────┘
                                  │
                                  ▼
   ┌─────────────────────────────────────────────────────────────┐
   │          Stage 3: Outbound Feedback Call & Admin Console    │
   │  • Admin Console Table with Outbound Voice Call Trigger     │
   │  • Dual-Mode: Browser Call (Gemini Live) & Twilio Carrier   │
   │  • Context Injection: In-Vehicle Transcript & Loved Features│
   │  • Strict Mahindra Domain Boundaries & Objection Resolution │
   │  • Priority Fast-Track Allocation Confirmation              │
   └─────────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Capabilities

### 1. Pre-Sales Virtual Showroom & Kabir Live Avatar
- **Bidirectional Live Audio/Video Stream**: Powered by Vertex AI Gemini Live API (`gemini-3.1-flash-live-preview-04-2026` / `gemini-2.5-flash`) over WebSockets (16kHz mono PCM).
- **Synchronized UI Co-Browsing**: Gemini tool calling triggers real-time UI viewport updates:
  - Vehicle spotlights across 12 authentic and Born Electric models (Thar ROXX, Scorpio-N, XUV700, BE 6e, XEV 9e, XUV400 EV Pro).
  - Side-by-side spec comparison matrix.
  - Test drive scheduling modal with real-time slot reservation.
- **Dynamic Feature Checklist**: Automatically detects customer interests (e.g., *Panoramic Sunroof*, *ADAS Level 2*, *Ventilated Seats*) and builds an advisor checklist attached to the booking lead.
- **Customer Persistence**: Stores profile data, lead history, and full past conversation transcripts.

### 2. Sales Consultant Mobile App & Test Ride Audio Intelligence
- **Mobile Sales Portal**: Designed for on-the-go dealership sales consultants (e.g., *Rajesh Varma*).
- **In-Vehicle Audio Recording & Simulation**: Captures live audio or runs a natural Hindi/Hinglish test ride conversation inside the Mahindra XUV700/Thar ROXX covering 2.0L mStallion engine power, FSD suspension, AdrenoX dual screens, and safety.
- **Gemini Dynamic Analytics**: Evaluates real-time audio transcripts to generate:
  - Customer Sentiment Score & Purchase Intent Score.
  - Advisor Pitch Score & Sales Coaching Recommendations.
  - Loved Features & Raised Objections.
- **State Progression**: Updates lead booking status to `TestRide_Completed` and persists insights.

### 3. Proactive Post-Ride Outbound Voice Call
- **Admin Console (Column 8 Trigger)**: Enables dealership managers to launch an outbound call for any lead with `TestRide_Completed` status.
- **Dual Calling Options**:
  - **Browser Call (Gemini Live AI)**: Real-time interactive voice dialogue via WebSocket.
  - **Twilio Phone Call (Live Carrier)**: Automated phone call to the customer's mobile number.
- **Context Injection**: Dynamically injects actual in-vehicle test ride transcript and loved features, asking if the customer enjoyed the ride and if Sales Consultant Rajesh answered all queries.
- **Strict Mahindra Guardrails**: Strictly declines off-topic or competitor car discussions (e.g., Tata Safari, Kia Seltos) and redirects the conversation back to Mahindra excellence.

---

## ⚙️ Configuration & Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ENABLE_SMS_DISPATCH` | Enables SMS dispatch for booking notifications and call follow-ups | `true` |
| `PROJECT_ID` / `VERTEX_PROJECT_ID` | GCP Project ID with Vertex AI APIs enabled | `mb-poc-352009` |
| `LOCATION` / `VERTEX_LOCATION` | GCP Region for Vertex AI | `us-central1` |
| `GEMINI_LIVE_MODEL` | Model for bidirectional live audio avatar session | `gemini-3.1-flash-live-preview-04-2026` |
| `REST_CHAT_MODEL` | Model for text/JSON intelligence generation | `gemini-2.5-flash` |
| `DATABASE_URL` | SQLite or PostgreSQL database connection string | `sqlite+aiosqlite:///./mahindra_omnichannel.db` |
| `PORT` | Container HTTP port | `8080` (Cloud Run) / `8000` (Local) |

---

## ☁️ Cloud Run Deployment

The platform is containerized as a single unified service (FastAPI backend + Next.js frontend) with WebSockets and session affinity enabled.

```bash
# Deploy to Google Cloud Run
gcloud run deploy mahindra-auto   --source .   --project=mb-poc-352009   --region=us-central1   --platform=managed   --allow-unauthenticated   --set-env-vars="ENABLE_SMS_DISPATCH=true,PROJECT_ID=mb-poc-352009,LOCATION=us-central1,VERTEX_PROJECT_ID=mb-poc-352009,VERTEX_LOCATION=us-central1"   --memory=2Gi   --cpu=2   --timeout=3600   --session-affinity
```

---

## 💻 Local Development

### 1. Backend (FastAPI + Python 3.11+)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run backend test suite (18 automated tests)
PYTHONPATH=. pytest tests -v

# Start backend server on port 8000
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Next.js 14 + Tailwind CSS)
```bash
cd frontend
npm install
npm run build   # Verify TypeScript and static builds
npm run dev     # Starts Next.js dev server on http://localhost:3000
```

---

## 📁 Repository Structure

```
.
├── Dockerfile                  # Unified multi-stage container build
├── entrypoint.sh               # Starts FastAPI backend (8000) & Next.js frontend (8080)
├── README.md                   # Project documentation
├── backend/
│   ├── app/
│   │   ├── config.py           # Settings and env var parsing (ENABLE_SMS_DISPATCH, etc.)
│   │   ├── database.py         # SQLAlchemy async engine and session management
│   │   ├── main.py             # FastAPI entrypoint and router registration
│   │   ├── models/             # Booking, Customer, Dealership, Sales Ride & Outbound models
│   │   ├── routers/            # Health, Catalog, Customer, Bookings, Sales, Outbound, Admin, WS
│   │   ├── schemas/            # Pydantic request & response schemas
│   │   └── services/           # Gemini Live, Sales Recording, Outbound Call, Catalog services
│   └── tests/                  # Pytest test suite (18 automated unit and integration tests)
└── frontend/
    ├── src/
    │   ├── app/                # Next.js App Router (layout.tsx, page.tsx, /admin)
    │   ├── components/         # PreSalesShowroom, SalesMobileApp, OutboundCallSimulator, AdminTable...
    │   ├── hooks/              # useLiveVoice WebSocket audio streaming hook
    │   ├── lib/                # API client, default vehicle catalog, smart compare helper
    │   └── types/              # TypeScript domain types and API contracts
    └── tailwind.config.ts      # Mahindra red & slate automotive design system
```
