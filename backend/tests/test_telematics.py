import pytest

@pytest.mark.asyncio
async def test_get_live_telematics(client):
    response = await client.get("/api/telematics/live?vin=MAH1THARROXX2026MUM01")
    assert response.status_code == 200
    data = response.json()
    assert data["odometer_km"] == 9820
    assert data["service_due_km"] == 10000
    assert data["oil_viscosity_pct"] == 14.0
    assert data["doors_locked"] is True

@pytest.mark.asyncio
async def test_trigger_and_action_telematics_alert(client):
    response = await client.post("/api/telematics/trigger-alert?customer_id=CUST-AARAV-001&vin=MAH1THARROXX2026MUM01")
    assert response.status_code == 200
    alert_data = response.json()
    assert alert_data["alert_type"] == "SERVICE_DUE"
    assert alert_data["is_actioned"] is False
    
    # Book service
    book_payload = {
        "customer_id": "CUST-AARAV-001",
        "vin": "MAH1THARROXX2026MUM01",
        "preferred_slot": "Saturday 9:00 AM",
        "booking_type": "HOME_PICKUP"
    }
    action_res = await client.post("/api/telematics/book-service", json=book_payload)
    assert action_res.status_code == 200
    action_data = action_res.json()
    assert action_data["is_actioned"] is True
    assert "Saturday 9:00 AM" in action_data["action_taken"]
