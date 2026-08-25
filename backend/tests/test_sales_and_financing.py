import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_sales_leads_flow(client: AsyncClient):
    resp = await client.get("/api/sales/leads")
    assert resp.status_code == 200
    leads = resp.json()
    assert isinstance(leads, list)
    assert len(leads) >= 1
    assert leads[0]["name"] == "Aarav Sharma"

@pytest.mark.asyncio
async def test_test_ride_recording_and_insights(client: AsyncClient):
    payload = {
        "customer_id": "CUST-AARAV-001",
        "vehicle_id": "thar_roxx",
        "variant": "AX7L Diesel AT 4x4",
        "sales_advisor_name": "Rajesh Varma (Bayview Mahindra)",
        "duration_seconds": 195,
        "audio_format": "audio/webm",
        "simulated_scenario": "bandra_sea_link_test_ride"
    }
    resp = await client.post("/api/sales/test-ride/upload-recording", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["session_id"].startswith("TR-2026-")
    assert "gs://mahindra-sales-recordings/test_rides/" in data["gcs_uri"]
    assert data["customer_sentiment_score"] >= 0.8
    assert data["purchase_intent_score"] >= 0.8
    assert len(data["loved_features"]) > 0
    assert len(data["objections_raised"]) > 0
    assert "Rajesh" in data["sales_advisor_name"]

    # Retrieve insights by session ID
    session_id = data["session_id"]
    get_resp = await client.get(f"/api/sales/test-ride/insights/{session_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["session_id"] == session_id

@pytest.mark.asyncio
async def test_outbound_call_and_dialogue_turns(client: AsyncClient):
    # 1. Trigger call
    trigger_payload = {
        "customer_id": "CUST-AARAV-001",
        "customer_name": "Aarav Sharma",
        "phone_number": "+91 98201 23456",
        "vehicle_name": "Mahindra Thar ROXX AX7L Diesel AT",
        "advisor_name": "Rajesh Varma"
    }
    resp = await client.post("/api/outbound/trigger-call", json=trigger_payload)
    assert resp.status_code == 200
    call_ref = resp.json()["call_reference"]
    assert call_ref.startswith("CALL-MIA-")

    # 2. Dialogue Turn 1
    turn_payload = {
        "call_reference": call_ref,
        "customer_speech": "The engine and suspension were amazing! But my wife is concerned on rear legroom and waiting times.",
        "turn_index": 0
    }
    turn_resp = await client.post("/api/outbound/dialogue-turn", json=turn_payload)
    assert turn_resp.status_code == 200
    assert "MIA" in turn_resp.json()["speaker"]

    # 3. Retrieve call insights
    insights_resp = await client.get(f"/api/outbound/call-insights/{call_ref}")
    assert insights_resp.status_code == 200
    insights = insights_resp.json()
    assert insights["objection_resolution_status"].startswith("100%")
    assert insights["locked_allocation_days"] == 12

@pytest.mark.asyncio
async def test_financing_emi_and_document_kyc(client: AsyncClient):
    # 1. Calculate EMI
    emi_payload = {
        "vehicle_id": "thar_roxx",
        "variant": "AX7L Diesel AT 4x4",
        "ex_showroom_price": 2249000,
        "down_payment": 795000,
        "tenure_months": 60,
        "interest_rate_annual": 8.15
    }
    emi_resp = await client.post("/api/financing/calculate-emi", json=emi_payload)
    assert emi_resp.status_code == 200
    emi_data = emi_resp.json()
    assert emi_data["monthly_emi"] > 0
    assert emi_data["loan_amount"] > 0
    assert len(emi_data["amortization_schedule"]) == 60

    # 2. Upload Aadhaar
    doc_payload = {
        "customer_id": "CUST-AARAV-001",
        "document_type": "AADHAAR",
        "file_name": "aadhaar.pdf"
    }
    doc_resp = await client.post("/api/financing/upload-document", json=doc_payload)
    assert doc_resp.status_code == 200
    assert doc_resp.json()["verification_status"] == "VERIFIED"
    assert "XXXX-XXXX-8921" in doc_resp.json()["extracted_fields"]["id_number"]

    # 3. Upload Salary Slip
    sal_payload = {
        "customer_id": "CUST-AARAV-001",
        "document_type": "SALARY_SLIP",
        "file_name": "salary_slip.pdf"
    }
    sal_resp = await client.post("/api/financing/upload-document", json=sal_payload)
    assert sal_resp.status_code == 200
    assert sal_resp.json()["income_metrics"]["foir_ratio_percentage"] == 26.5

    # 4. Voice Consent
    voice_payload = {
        "customer_id": "CUST-AARAV-001",
        "loan_amount": 1850000,
        "spoken_phrase": "I, Aarav Sharma, approve the loan application of Rs 18.5 Lakhs with Mahindra Finance."
    }
    voice_resp = await client.post("/api/financing/voice-consent", json=voice_payload)
    assert voice_resp.status_code == 200
    assert voice_resp.json()["consent_status"] == "GRANTED"
    assert voice_resp.json()["biometric_hash"].startswith("MH-VOICE-BIO-")

    # 5. Sanction Letter
    sanction_resp = await client.get("/api/financing/sanction-letter/CUST-AARAV-001")
    assert sanction_resp.status_code == 200
    assert sanction_resp.json()["sanction_id"].startswith("SAN-MF-")
    assert sanction_resp.json()["interest_rate_annual"] == 8.15
