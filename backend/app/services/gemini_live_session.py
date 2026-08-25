import json
import logging
import asyncio
import re
from typing import Dict, Any, Optional, Callable
from google import genai
from google.genai import types
from app.config import settings
from app.services.catalog_service import CatalogService
from app.services.customer_service import CustomerService

logger = logging.getLogger("gemini_live_session")

KABIR_SYSTEM_PROMPT = """You are Kabir, an expert, enthusiastic male AI Showroom Specialist from Mahindra Auto & Mahindra Electric Origin SUV Virtual Showroom.
You represent Mahindra across all SUV and vehicle categories:
- Authentic 4x4 SUVs: Thar ROXX (5-Door), Thar (3-Door), Scorpio-N (The Big Daddy of SUVs), Scorpio Classic.
- Tech & Luxury SUVs: XUV700, XUV 3XO.
- Born Electric & Electric Origin SUVs: BE 6e (Born EV Sport Coupe with 682km range), XEV 9e (Luxury Electric Origin SUV Coupe with triple screens and 656km range), XUV400 EV (456km range).
- Tough Utilities & Pickups: Bolero Neo, Bolero Neo+, Bolero, Marazzo, Bolero Camper & Maxx Pik-Up.

ALL INDIAN LANGUAGES & MULTILINGUAL CAPABILITY (MANDATORY):
- You MUST understand and respond fluently in ALL Indian languages:
  * Hindi (हिन्दी)
  * English & Hinglish
  * Tamil (தமிழ்)
  * Telugu (తెలుగు)
  * Kannada (ಕನ್ನಡ)
  * Malayalam (മലയാളം)
  * Marathi (मराठी)
  * Gujarati (ગુજરાતી)
  * Bengali (বাংলা)
  * Punjabi (ਪੰਜਾਬੀ)
  * Odia (ଓଡ଼ିଆ)
  * Urdu (اردو)
  * Assamese (অসমীয়া)
- If the customer speaks or asks in ANY Indian language, immediately answer in that EXACT SAME Indian language with native fluency, cultural politeness, and appropriate regional phrasing.
- If the customer asks in English or mixed Hinglish/Tanglish/etc., respond naturally in that same mixed style.

*** STEP-BY-STEP CONFIRMATION PROTOCOL FOR TEST DRIVE / TEST RIDE (MANDATORY REQUIREMENT) ***
- Test rides must ALWAYS be provided in the customer's same city.
- YOU MUST CONFIRM ON EACH STEP BEFORE YOU PROCEED:
  * STEP 1 (HOME vs SHOWROOM PREFERENCE):
    Ask whether they want the test drive delivered at their Home (Doorstep) or if they would like to visit the Showroom:
    (In Hindi): "[Name] ji, kya aap test drive apne ghar par mangwana chahte hain ya hamare Showroom aakar dekhna chahenge?"
    (In English): "[Name] ji, would you prefer a Doorstep Test Drive at your home, or would you like to visit our Showroom?"
  * STEP 2 (COLLECT ADDRESS WITH PIN CODE):
    Ask for their local Address and area PIN code:
    (In Hindi): "Bahut badhiya! Test drive ke liye, kya main aapka area PIN code aur pata (address) jaan sakta hoon [Name] ji?"
    (In English): "Wonderful! Could you please share your area PIN code and address, [Name] ji?"
  * STEP 3 (CONFIRM ADDRESS FIRST BEFORE ASKING FOR TIME/DATE):
    - Re-state the address / nearest showroom and EXPLICITLY ask the customer to confirm if the address is OK:
      (In Hindi): "Aapne pata [Address/PIN] bataya hai. Kya yeh address bilkul sahi hai [Name] ji?"
      (In English): "You mentioned [Address/PIN]. Is this address accurate and convenient for you, [Name] ji?"
    - CRITICAL: WAIT FOR CUSTOMER CONFIRMATION (e.g. 'Haan', 'Yes', 'Theek hai', 'OK') BEFORE PROCEEDING TO STEP 4.
  * STEP 4 (ASK FOR DATE & TIME):
    - Only after the customer confirms the address is OK, ask for their preferred Date and Time:
      (In Hindi): "Dhanyavaad! Test drive ke liye aap kaunsa din aur samay prefer karenge (jaise kal subah 11:00 baje ya dopahar)?"
      (In English): "Thank you! What date and time would you prefer for the test drive (e.g. tomorrow at 11:00 AM or afternoon)?"
  * STEP 5 (CHECK SLOT AVAILABILITY):
    - Confirm slot or suggest the next earliest available slot.
  * STEP 6 (FINAL BOOKING & WHATSAPP DISPATCH):
    - Once date & time are confirmed, confirm booking and dispatch confirmation details, slot time, and location map directly to WhatsApp.

STRICT GUARDRAILS:
1. OFFERS & ON-ROAD PRICE: Applicable offers and on-road price will be shared by our authorized Mahindra Sales Team during showroom visit / booking. Quote the official EX-SHOWROOM price accurately.
2. COMPETITOR COMPARISON DEFLECTION: If customer asks about Tata (Curvv EV, Nexon EV, Safari, Harrier), Hyundai (Creta, Ioniq 5), Kia (EV6, Seltos), Toyota (Fortuner, Innova), do NOT provide any information or specs for the competitor. Highlight the relevant segment-leading Mahindra SUV.
3. Keep the response natural, warm, and concise (under 35 words)."""

MIA_SYSTEM_PROMPT = KABIR_SYSTEM_PROMPT

GEMINI_TOOLS_DECLARATIONS = [
    {
        "name": "show_vehicle_spotlight",
        "description": "Highlights a specific Mahindra vehicle on the showroom stage.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "vehicle_id": {"type": "STRING", "description": "ID of vehicle: 'thar_roxx', 'scorpio_n', 'xuv700', 'be_6e', 'xev_9e', 'xuv400_ev'"}
            },
            "required": ["vehicle_id"]
        }
    },
    {
        "name": "compare_vehicles",
        "description": "Opens side-by-side spec comparison matrix for two Mahindra models.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "vehicle_id_1": {"type": "STRING"},
                "vehicle_id_2": {"type": "STRING"}
            },
            "required": ["vehicle_id_1", "vehicle_id_2"]
        }
    },
    {
        "name": "book_test_drive",
        "description": "Executes test drive booking with WhatsApp confirmation dispatch.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "customer_id": {"type": "STRING"},
                "model_name": {"type": "STRING"},
                "test_drive_type": {"type": "STRING"},
                "pincode": {"type": "STRING"},
                "pickup_address": {"type": "STRING"},
                "preferred_date_time": {"type": "STRING"},
                "phone_number": {"type": "STRING"}
            },
            "required": ["model_name", "phone_number"]
        }
    }
]

def detect_indian_language(text: str) -> str:
    """Detects Indian languages from script and vocabulary."""
    if re.search(r'[\u0900-\u097F]', text):
        if any(w in text for w in ["आहे", "गाडीची", "सांगा", "पाहिजे", "करायची", "किंमत", "नमस्कार", "करा", "होय"]):
            return "Marathi"
        return "Hindi"
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "Tamil"
    if re.search(r'[\u0C00-\u0C7F]', text):
        return "Telugu"
    if re.search(r'[\u0C80-\u0CFF]', text):
        return "Kannada"
    if re.search(r'[\u0D00-\u0D7F]', text):
        return "Malayalam"
    if re.search(r'[\u0980-\u09FF]', text):
        if any(w in text for w in ["নমস্কাৰ", "বিচাৰে", "কৰা"]):
            return "Assamese"
        return "Bengali"
    if re.search(r'[\u0A80-\u0AFF]', text):
        return "Gujarati"
    if re.search(r'[\u0A00-\u0A7F]', text):
        return "Punjabi"
    if re.search(r'[\u0B00-\u0B7F]', text):
        return "Odia"
    if re.search(r'[\u0600-\u06FF]', text):
        return "Urdu"

    lower = text.lower()
    if any(k in lower for k in ["ahe", "gadi", "sang", "mahit", "namaskar", "pahije"]):
        return "Marathi"
    if any(k in lower for k in ["vanakkam", "vilai", "enna", "venum", "solla"]):
        return "Tamil"
    if any(k in lower for k in ["namaskaram", "dhara", "cheppandi", "kavali", "enta"]):
        return "Telugu"
    if any(k in lower for k in ["namaskara", "bele", "hegi", "beku"]):
        return "Kannada"
    if any(k in lower for k in ["namaskaram", "vila", "enganeya"]):
        return "Malayalam"
    if any(k in lower for k in ["nomoshkar", "daam", "koto", "bolun"]):
        return "Bengali"
    if any(k in lower for k in ["namaste", "kem cho", "kimat"]):
        return "Gujarati"
    if any(k in lower for k in ["sat sri akal", "kime", "daso"]):
        return "Punjabi"
    if any(k in lower for k in ["kya", "kitna", "batao", "bhai", "hai", "kaise", "chahiye", "gadi", "milega", "karo", "namaste", "bilkul", "haan", "theek"]):
        return "Hinglish"

    return "English"

class AudioSessionManager:
    def __init__(self, session_id: str, customer_id: str = "CUST-9820155432"):
        self.session_id = session_id
        self.customer_id = customer_id
        self.is_active = True
        self.language = "Hinglish"
        self.active_vehicle_id = "thar_roxx"
        self.chat_history: list = []
        self.vertex_client: Optional[genai.Client] = None
        
        # Initialize Vertex AI Client with Project mb-poc-352009
        try:
            self.vertex_client = genai.Client(
                vertexai=True,
                project=settings.VERTEX_PROJECT_ID,
                location=settings.VERTEX_LOCATION
            )
            logger.info(f"Initialized Vertex AI Client on project {settings.VERTEX_PROJECT_ID}")
        except Exception as e:
            logger.warning(f"Could not initialize Vertex AI client: {e}")

    async def process_user_text_or_intent(self, text: str, emit_ui_callback: Callable) -> Dict[str, Any]:
        """Calls Vertex AI Gemini 2.5 Flash on project mb-poc-352009 with Kabir Persona."""
        detected_lang = detect_indian_language(text)
        if detected_lang:
            self.language = detected_lang

        lower = text.lower()
        tool_call = None
        tool_args = {}

        # 1. UI Event Detection for Co-Browsing
        if "be 6e" in lower or "be6e" in lower or "electric" in lower:
            self.active_vehicle_id = "be_6e"
            tool_call = "show_vehicle_spotlight"
            tool_args = {"vehicle_id": "be_6e"}
            try:
                res = emit_ui_callback({"type": "UI_ACTION", "tool_name": tool_call, "tool_args": tool_args})
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass
        elif "xev 9e" in lower or "xev9e" in lower or "cinema" in lower:
            self.active_vehicle_id = "xev_9e"
            tool_call = "show_vehicle_spotlight"
            tool_args = {"vehicle_id": "xev_9e"}
            try:
                res = emit_ui_callback({"type": "UI_ACTION", "tool_name": tool_call, "tool_args": tool_args})
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass
        elif "scorpio" in lower:
            self.active_vehicle_id = "scorpio_n"
            tool_call = "show_vehicle_spotlight"
            tool_args = {"vehicle_id": "scorpio_n"}
            try:
                res = emit_ui_callback({"type": "UI_ACTION", "tool_name": tool_call, "tool_args": tool_args})
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass
        elif "thar" in lower or "roxx" in lower:
            self.active_vehicle_id = "thar_roxx"
            tool_call = "show_vehicle_spotlight"
            tool_args = {"vehicle_id": "thar_roxx"}
            try:
                res = emit_ui_callback({"type": "UI_ACTION", "tool_name": tool_call, "tool_args": tool_args})
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass
        elif any(w in lower for w in ["compare", "versus", "vs", "तुलना", "ஒப்பீடு", "போலிక"]):
            tool_call = "compare_vehicles"
            tool_args = {"vehicle_id_1": self.active_vehicle_id, "vehicle_id_2": "scorpio_n" if self.active_vehicle_id != "scorpio_n" else "xuv700"}
            try:
                res = emit_ui_callback({"type": "UI_ACTION", "tool_name": tool_call, "tool_args": tool_args})
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass
        elif any(w in lower for w in ["test drive", "test ride", "book drive", "ड्राइव", "டிரைவ்", "డ్రైవ్"]):
            tool_call = "open_test_drive_booking"
            tool_args = {"vehicle_id": self.active_vehicle_id}
            try:
                res = emit_ui_callback({"type": "UI_ACTION", "tool_name": tool_call, "tool_args": tool_args})
                if asyncio.iscoroutine(res):
                    await res
            except Exception:
                pass

        # 2. Invoke Vertex AI Gemini 2.5 Flash Model
        response_text = ""
        if self.vertex_client:
            try:
                # Add to history
                self.chat_history.append({"role": "user", "parts": [{"text": text}]})

                config = types.GenerateContentConfig(
                    system_instruction=KABIR_SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=500
                )

                # Format conversation contents
                contents = []
                for turn in self.chat_history[-6:]:
                    contents.append(types.Content(
                        role=turn["role"],
                        parts=[types.Part.from_text(text=turn["parts"][0]["text"])]
                    ))

                vertex_resp = await asyncio.to_thread(
                    self.vertex_client.models.generate_content,
                    model=settings.REST_CHAT_MODEL,
                    contents=contents,
                    config=config
                )
                if vertex_resp and vertex_resp.text:
                    response_text = vertex_resp.text.strip()
                    self.chat_history.append({"role": "model", "parts": [{"text": response_text}]})
            except Exception as e:
                logger.error(f"Vertex AI Gemini generation error: {e}")

        # Fallback if vertex generation failed
        if not response_text:
            response_text = f"Namaste! Main Kabir, Mahindra Auto se. Main aapki {self.active_vehicle_id.replace('_', ' ').title()} aur Test Drive me madad kar sakta hoon."

        return {
            "message": response_text,
            "tool_call": tool_call,
            "tool_args": tool_args,
            "language": self.language
        }
