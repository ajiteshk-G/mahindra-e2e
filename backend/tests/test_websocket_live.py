import pytest
from app.main import app
from starlette.testclient import TestClient

def test_websocket_live_chat_and_tools():
    with TestClient(app) as client:
        with client.websocket_connect("/ws/live-audio") as websocket:
            # Check initial handshake
            data = websocket.receive_json()
            assert data["type"] == "SESSION_INITIALIZED"
            assert "Aarav" in data["customer"]["name"]

            # Send test drive query
            websocket.send_json({
                "type": "USER_CHAT",
                "text": "Can I book a test drive for Thar ROXX near Bandra tomorrow at 5pm?"
            })
            
            # We may receive UI_ACTION and ASSISTANT_RESPONSE
            msg1 = websocket.receive_json()
            if msg1["type"] == "UI_ACTION":
                assert msg1["tool_name"] == "open_test_drive_booking"
                msg2 = websocket.receive_json()
                assert msg2["type"] == "ASSISTANT_RESPONSE"
                assert "MIA" in msg2["speaker"].upper() or "mia" in msg2["speaker"]
            else:
                assert msg1["type"] == "ASSISTANT_RESPONSE"
