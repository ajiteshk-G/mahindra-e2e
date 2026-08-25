import json
import logging
import uuid
import ssl
import certifi
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import google.auth
import google.auth.transport.requests
import websockets

from app.config import settings
from app.database import AsyncSessionLocal
from app.services.gemini_live_session import AudioSessionManager, KABIR_SYSTEM_PROMPT
from app.services.customer_service import CustomerService

logger = logging.getLogger("ws_live")
router = APIRouter(tags=["Live Audio & Multimodal Chat"])

SERVICE_URL = "wss://{host}/ws/google.cloud.aiplatform.internal.LlmBidiService/BidiGenerateContent"

SESSION_CACHE: Dict[str, AudioSessionManager] = {}

def get_or_create_session(session_id: str, customer_id: str) -> AudioSessionManager:
    if session_id not in SESSION_CACHE:
        SESSION_CACHE[session_id] = AudioSessionManager(session_id=session_id, customer_id=customer_id)
    return SESSION_CACHE[session_id]

class LiveChatRequest(BaseModel):
    message: str
    customer_id: Optional[str] = "CUST-9820155432"
    session_id: Optional[str] = None
    vehicle_id: Optional[str] = "thar_roxx"
    language: Optional[str] = "Hinglish"

class LiveChatResponse(BaseModel):
    session_id: str
    speaker: str = "mia"
    message: str
    tool_call: Optional[str] = None
    tool_args: Optional[Dict[str, Any]] = None
    language: str

@router.post("/api/live/chat", response_model=LiveChatResponse)
async def post_live_chat(req: LiveChatRequest):
    """HTTP REST fallback for web proxy environments where direct WebSocket ports are blocked."""
    session_id = req.session_id or f"SESS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    customer_id = req.customer_id or "CUST-9820155432"

    async with AsyncSessionLocal() as db:
        customer = await CustomerService.get_customer_by_id(db, customer_id)
        if not customer:
            customer = await CustomerService.get_customer_by_phone(db, customer_id)
        if not customer:
            customer = await CustomerService.get_or_create_default_customer(db)

        await CustomerService.log_interaction(
            db,
            customer_id_str=customer.customer_id,
            speaker="customer",
            message=req.message,
            channel="VOICE_LIVE",
            session_id_str=session_id
        )

    session_mgr = get_or_create_session(session_id=session_id, customer_id=customer.customer_id)
    if req.language and session_mgr.language == "Hinglish":
        session_mgr.language = req.language
    if req.vehicle_id and not session_mgr.active_vehicle_id:
        session_mgr.active_vehicle_id = req.vehicle_id

    ui_events = []
    async def capture_ui_event(ev: dict):
        ui_events.append(ev)

    result = await session_mgr.process_user_text_or_intent(req.message, capture_ui_event)

    async with AsyncSessionLocal() as db:
        await CustomerService.log_interaction(
            db,
            customer_id_str=customer.customer_id,
            speaker="mia",
            message=result["message"],
            channel="VOICE_LIVE",
            session_id_str=session_id,
            intent=result.get("tool_call"),
            tool=result.get("tool_call")
        )

    return LiveChatResponse(
        session_id=session_id,
        speaker="mia",
        message=result["message"],
        tool_call=result.get("tool_call"),
        tool_args=result.get("tool_args"),
        language=result.get("language", "Hinglish")
    )

_CACHED_TOKEN: Optional[str] = None
_TOKEN_EXPIRY: float = 0.0

async def get_bearer_token():
    global _CACHED_TOKEN, _TOKEN_EXPIRY
    import time
    now = time.time()
    if _CACHED_TOKEN and now < _TOKEN_EXPIRY:
        return _CACHED_TOKEN, settings.VERTEX_PROJECT_ID

    def _fetch_token():
        try:
            creds, project_id = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
            auth_req = google.auth.transport.requests.Request()
            creds.refresh(auth_req)
            return creds.token, settings.VERTEX_PROJECT_ID or project_id or "mb-poc-352009"
        except Exception as e:
            logger.warning(f"Could not refresh GCP OAuth token: {e}")
            return None, settings.VERTEX_PROJECT_ID

    token, proj = await asyncio.to_thread(_fetch_token)
    if token:
        _CACHED_TOKEN = token
        _TOKEN_EXPIRY = now + 1800
    return token, proj

@router.websocket("/ws/live-audio")
async def live_audio_websocket(websocket: WebSocket):
    """
    Bi-directional Gemini Live Bidi proxy implementing the exact pattern from mahindra-car-live-chat.
    Connects to wss://us-central1-aiplatform.googleapis.com/ws/google.cloud.aiplatform.internal.LlmBidiService/BidiGenerateContent
    """
    await websocket.accept()

    query_params = dict(websocket.query_params)
    session_id = query_params.get("session_id") or f"SESS-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    customer_id = query_params.get("customer_id") or "CUST-9820155432"

    async with AsyncSessionLocal() as db:
        customer = await CustomerService.get_customer_by_id(db, customer_id)
        if not customer:
            customer = await CustomerService.get_or_create_default_customer(db)

    session_mgr = get_or_create_session(session_id=session_id, customer_id=customer.customer_id)

    # 1. Immediate handshake to client
    await websocket.send_text(json.dumps({
        "type": "SESSION_INITIALIZED",
        "session_id": session_id,
        "model": settings.GEMINI_LIVE_MODEL,
        "voice": settings.AVATAR_VOICE,
        "greeting": f"Namaste {customer.name}! Main Kabir, Mahindra Auto se. Main aapki {customer.interested_vehicle_id.replace('_', ' ').title()} me madad kar sakta hoon."
    }))

    # 2. Obtain token asynchronously without blocking event loop
    bearer_token, used_project = await get_bearer_token()

    host = f"{settings.VERTEX_LOCATION}-aiplatform.googleapis.com"
    service_url = SERVICE_URL.format(host=host)

    # 3. If token is available, establish live Bidi WebSocket to Vertex AI
    if bearer_token:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {bearer_token}",
        }
        ssl_context = ssl.create_default_context(cafile=certifi.where())

        try:
            async with websockets.connect(
                service_url,
                additional_headers=headers,
                ssl=ssl_context,
                ping_interval=None,
                open_timeout=4.0
            ) as bidi_ws:
                logger.info(f"Connected to Vertex Bidi service for session {session_id}")

                setup_msg = {
                    "setup": {
                        "model": f"projects/{used_project}/locations/{settings.VERTEX_LOCATION}/publishers/google/models/{settings.GEMINI_LIVE_MODEL}",
                        "generationConfig": {
                            "responseModalities": ["VIDEO"],
                            "speechConfig": {
                                "voiceConfig": {
                                    "prebuiltVoiceConfig": {
                                        "voiceName": settings.AVATAR_VOICE or "orus"
                                    }
                                },
                                "languageCode": "hi-IN"
                            }
                        },
                        "inputAudioTranscription": {},
                        "outputAudioTranscription": {},
                        "avatarConfig": {
                            "avatarName": "Jay"
                        },
                        "tools": [
                            {
                                "functionDeclarations": [
                                    {
                                        "name": "switch_vehicle_showroom",
                                        "description": "Call this tool to switch the showroom backdrop, hero stage, and vehicle carousel whenever the customer asks about, compares, or mentions any Mahindra SUV or vehicle model (e.g. thar_roxx, scorpio_n, xuv700, be_6e, xev_9e, xuv_3xo, thar_3door, scorpio_classic, bolero_neo, bolero_neo_plus, bolero, xuv400_ev, marazzo).",
                                        "parameters": {
                                            "type": "object",
                                            "properties": {
                                                "car_name": {
                                                    "type": "string",
                                                    "description": "The normalized ID: thar_roxx, scorpio_n, xuv700, be_6e, xev_9e, xuv_3xo, thar_3door, scorpio_classic, bolero_neo, bolero_neo_plus, bolero, xuv400_ev, marazzo"
                                                }
                                            },
                                            "required": ["car_name"]
                                        }
                                    },
                                    {
                                        "name": "compare_vehicles",
                                        "description": "Call this tool when customer wants to compare vehicles.",
                                        "parameters": {
                                            "type": "object",
                                            "properties": {
                                                "vehicle_id_1": {"type": "string"},
                                                "vehicle_id_2": {"type": "string"}
                                            },
                                            "required": ["vehicle_id_1", "vehicle_id_2"]
                                        }
                                    },
                                    {
                                        "name": "book_test_drive",
                                        "description": "Call this tool when customer wants to schedule or book a test drive for a specific vehicle model and variant.",
                                        "parameters": {
                                            "type": "object",
                                            "properties": {
                                                "model_name": {
                                                    "type": "string",
                                                    "description": "The normalized vehicle ID: thar_roxx, scorpio_n, xuv700, be_6e, xev_9e, xuv_3xo, thar_3door, scorpio_classic"
                                                },
                                                "variant": {
                                                    "type": "string",
                                                    "description": "Specific variant name e.g. AX7L Diesel AT 4x4, Z8L 4WD AT, Pack Two (79 kWh)"
                                                },
                                                "transmission": {
                                                    "type": "string",
                                                    "description": "Automatic or Manual"
                                                },
                                                "booking_type": {
                                                    "type": "string",
                                                    "description": "HOME_DOORSTEP or SHOWROOM_VISIT"
                                                },
                                                "pin_code": {
                                                    "type": "string",
                                                    "description": "Area 6-digit PIN code"
                                                }
                                            },
                                            "required": ["model_name"]
                                        }
                                    }
                                ]
                            }
                        ],
                        "systemInstruction": {
                            "parts": [{"text": KABIR_SYSTEM_PROMPT}]
                        }
                    }
                }
                await bidi_ws.send(json.dumps(setup_msg))

                # Wait for Vertex setup confirmation
                try:
                    init_resp = await asyncio.wait_for(bidi_ws.recv(), timeout=4.0)
                    init_data = json.loads(init_resp) if isinstance(init_resp, str) else {}
                    logger.info(f"Vertex Bidi setup complete: {init_data.get('setupComplete', True)}")
                except Exception as e:
                    logger.debug(f"Vertex setup response notice: {e}")

                # Task: Client -> Vertex Bidi
                async def client_to_bidi():
                    try:
                        while True:
                            data = await websocket.receive()
                            if data.get("type") == "websocket.disconnect":
                                break
                            if "text" in data and data["text"]:
                                payload = json.loads(data["text"])
                                msg_type = payload.get("type", "USER_CHAT")
                                if msg_type == "END_CALL" or msg_type == "STOP_SESSION":
                                    logger.info(f"Client requested end of call for session {session_id}")
                                    break
                                elif msg_type == "START_SESSION":
                                    cust_name = payload.get("customer_name") or customer.name or "there"
                                    greeting_turn = {
                                        "clientContent": {
                                            "turns": [
                                                {
                                                    "role": "user",
                                                    "parts": [{"text": f"Please give a warm, dynamic, non-static spoken greeting to {cust_name} as Kabir, introducing yourself as Mahindra's AI Showroom Specialist, welcoming them to the virtual showroom in {session_mgr.language}, and asking which SUV or electric vehicle they'd like to check out today."}]
                                                }
                                            ],
                                            "turnComplete": True
                                        }
                                    }
                                    await bidi_ws.send(json.dumps(greeting_turn))
                                elif msg_type == "USER_CHAT":
                                    user_text = payload.get("text", "")
                                    bidi_turn = {
                                        "clientContent": {
                                            "turns": [
                                                {
                                                    "role": "user",
                                                    "parts": [{"text": user_text}]
                                                }
                                            ],
                                            "turnComplete": True
                                        }
                                    }
                                    await bidi_ws.send(json.dumps(bidi_turn))
                            elif "bytes" in data and data["bytes"]:
                                import base64
                                pcm_b64 = base64.b64encode(data["bytes"]).decode("utf-8")
                                realtime_input = {
                                    "realtimeInput": {
                                        "mediaChunks": [
                                            {
                                                "mimeType": "audio/pcm;rate=16000",
                                                "data": pcm_b64
                                            }
                                        ]
                                    }
                                }
                                await bidi_ws.send(json.dumps(realtime_input))
                    except Exception as e:
                        logger.debug(f"Client to Bidi finished: {e}")

                # Task: Vertex Bidi -> Client
                async def bidi_to_client():
                    try:
                        while True:
                            msg = await bidi_ws.recv()
                            try:
                                bidi_data = json.loads(msg)
                                server_content = bidi_data.get("serverContent") or {}
                                model_turn = server_content.get("modelTurn") or {}
                                parts = model_turn.get("parts") or []

                                # 1. Check for Gemini Live Tool Calls (e.g. switch_vehicle_showroom)
                                tool_call_obj = bidi_data.get("toolCall") or server_content.get("toolCall")
                                if tool_call_obj:
                                    function_calls = tool_call_obj.get("functionCalls", [])
                                    for fc in function_calls:
                                        fc_name = fc.get("name")
                                        call_id = fc.get("id")
                                        fc_args = fc.get("args", {})
                                        logger.info(f"Gemini Live Tool Call: {fc_name} {fc_args}")

                                        # Respond back to Gemini Live
                                        tool_resp = {
                                            "toolResponse": {
                                                "functionResponses": [
                                                    {
                                                        "response": {"output": {"status": "success", "executed": fc_name}},
                                                        "id": call_id
                                                    }
                                                ]
                                            }
                                        }
                                        await bidi_ws.send(json.dumps(tool_resp))

                                        # Emit UI action to client
                                        await websocket.send_text(json.dumps({
                                            "type": "UI_ACTION",
                                            "tool_name": fc_name,
                                            "tool_args": fc_args
                                        }))

                                # 2. Check for speech transcriptions from Gemini Live
                                out_trans = server_content.get("outputTranscription")
                                if out_trans and out_trans.get("text"):
                                    await websocket.send_text(json.dumps({
                                        "type": "ASSISTANT_RESPONSE",
                                        "speaker": "mia",
                                        "message": out_trans["text"],
                                        "language": session_mgr.language
                                    }))

                                in_trans = server_content.get("inputTranscription")
                                if in_trans and in_trans.get("text"):
                                    await websocket.send_text(json.dumps({
                                        "type": "USER_TRANSCRIPTION",
                                        "speaker": "customer",
                                        "message": in_trans["text"]
                                    }))

                                # 3. Process Video, Audio, and Text parts
                                for part in parts:
                                    # Function calls inside model_turn parts
                                    if "functionCall" in part:
                                        fc = part["functionCall"]
                                        fc_name = fc.get("name")
                                        fc_args = fc.get("args", {})
                                        await websocket.send_text(json.dumps({
                                            "type": "UI_ACTION",
                                            "tool_name": fc_name,
                                            "tool_args": fc_args
                                        }))

                                    if "inlineData" in part:
                                        mime_type = part["inlineData"].get("mimeType", "")
                                        data_b64 = part["inlineData"].get("data")
                                        if mime_type.startswith("video/") or mime_type.startswith("image/"):
                                            await websocket.send_text(json.dumps({
                                                "type": "VIDEO_CHUNK",
                                                "video_b64": data_b64,
                                                "mime_type": mime_type
                                            }))
                                        else:
                                            await websocket.send_text(json.dumps({
                                                "type": "AUDIO_CHUNK",
                                                "audio_b64": data_b64,
                                                "mime_type": mime_type or "audio/pcm;rate=24000"
                                            }))
                                    if "text" in part:
                                        await websocket.send_text(json.dumps({
                                            "type": "ASSISTANT_RESPONSE",
                                            "speaker": "mia",
                                            "message": part["text"],
                                            "language": session_mgr.language
                                        }))
                            except Exception as e:
                                logger.debug(f"Error parsing bidi message: {e}")
                    except Exception as e:
                        logger.debug(f"Bidi to client finished: {e}")

                done, pending = await asyncio.wait(
                    [asyncio.create_task(client_to_bidi()), asyncio.create_task(bidi_to_client())],
                    return_when=asyncio.FIRST_COMPLETED
                )
                for task in pending:
                    task.cancel()
                return
        except Exception as e:
            logger.warning(f"Vertex Bidi connection notice (falling back to interactive session): {e}")

    # Resilient local fallback session loop
    try:
        while True:
            data = await websocket.receive()
            if data.get("type") == "websocket.disconnect":
                break
            if "text" in data and data["text"]:
                payload = json.loads(data["text"])
                msg_type = payload.get("type", "USER_CHAT")
                if msg_type == "START_SESSION":
                    cust_name = payload.get("customer_name") or customer.name or "there"
                    prompt = f"Please give a warm, dynamic, non-static spoken greeting to {cust_name} as Kabir, introducing yourself as Mahindra's AI Showroom Specialist, welcoming them to the showroom in {session_mgr.language}, and asking which SUV or electric vehicle they'd like to check out today."
                    result = await session_mgr.process_user_text_or_intent(prompt, lambda ev: None)
                    await websocket.send_text(json.dumps({
                        "type": "ASSISTANT_RESPONSE",
                        "session_id": session_id,
                        "speaker": "mia",
                        "message": result["message"],
                        "tool_call": result.get("tool_call"),
                        "tool_args": result.get("tool_args", {}),
                        "language": result.get("language", session_mgr.language)
                    }))
                elif msg_type == "USER_CHAT":
                    user_text = payload.get("text", "")
                    result = await session_mgr.process_user_text_or_intent(user_text, lambda ev: None)
                    await websocket.send_text(json.dumps({
                        "type": "ASSISTANT_RESPONSE",
                        "session_id": session_id,
                        "speaker": "mia",
                        "message": result["message"],
                        "tool_call": result.get("tool_call"),
                        "tool_args": result.get("tool_args", {}),
                        "language": result.get("language", "Hinglish")
                    }))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.debug(f"Live audio session closed: {e}")

