import pytest

@pytest.mark.asyncio
async def test_damage_assessment(client):
    payload = {
        "customer_id": "CUST-AARAV-001",
        "mock_damage_type": "bumper_foglamp"
    }
    response = await client.post("/api/diagnostics/assess-damage", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["damage_detected"] is True
    assert data["oem_part_number"] == "#TH-88301"
    assert data["estimated_out_of_pocket"] == 0.0 # Zero depreciation

@pytest.mark.asyncio
async def test_warning_light_scan(client):
    payload = {
        "light_symbol": "engine_oil_pressure"
    }
    response = await client.post("/api/diagnostics/warning-lights", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Engine Oil" in data["symbol_name"]
    assert data["severity"] == "WARNING"

@pytest.mark.asyncio
async def test_file_and_list_insurance_claim(client):
    payload = {
        "customer_id": "CUST-AARAV-001",
        "vin": "MAH1THARROXX2026MUM01",
        "vehicle_model": "Mahindra Thar ROXX AX7L Diesel AT",
        "incident_description": "Loose gravel stone chipped fog lamp on Western Ghats highway",
        "detected_damages": ["front lower bumper scuff", "cracked fog lamp lens"],
        "oem_part_number": "#TH-88301",
        "workshop_name": "Bayview Mahindra Workshop"
    }
    response = await client.post("/api/diagnostics/claims", json=payload)
    assert response.status_code == 200
    claim_data = response.json()
    assert "MH-INS-" in claim_data["claim_id"]
    assert claim_data["claim_status"] == "DIGITALLY_APPROVED"
    assert claim_data["customer_out_of_pocket"] == 0.0

    # List claims
    list_res = await client.get("/api/diagnostics/claims/my-claims?customer_id=CUST-AARAV-001")
    assert list_res.status_code == 200
    claims = list_res.json()
    assert len(claims) >= 1
