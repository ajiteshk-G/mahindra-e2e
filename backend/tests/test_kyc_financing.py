import pytest

@pytest.mark.asyncio
async def test_kyc_pan_scan(client):
    payload = {
        "customer_id": "CUST-AARAV-001",
        "document_type": "PAN",
        "mock_preset": "aarav_pan"
    }
    response = await client.post("/api/kyc/scan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "VERIFIED"
    assert data["extracted_fields"]["id_number"] == "ABCPS1234K"
    assert data["confidence_score"] > 0.95

@pytest.mark.asyncio
async def test_voice_biometric_consent(client):
    payload = {
        "customer_id": "CUST-AARAV-001",
        "spoken_phrase": "I, Aarav Sharma, approve the loan application of Rs 18.5 Lakhs with Mahindra Finance.",
        "loan_amount": 1850000,
        "lender_name": "Mahindra Finance"
    }
    response = await client.post("/api/kyc/voice-consent", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    assert "VBC-" in data["consent_token"]
    assert data["sanctioned_amount"] == 1850000
    assert data["estimated_emi"] > 30000

@pytest.mark.asyncio
async def test_financing_calculator(client):
    payload = {
        "vehicle_price": 2249000,
        "down_payment": 399000,
        "tenure_months": 60,
        "interest_rate_pct": 8.15
    }
    response = await client.post("/api/kyc/calculate-financing", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["loan_amount"] == 1850000
    assert data["monthly_emi"] > 35000
