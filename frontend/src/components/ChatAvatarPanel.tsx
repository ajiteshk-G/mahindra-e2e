"use client";

import React, { useState, useEffect, useRef } from "react";
import { LiveMessage } from "@/hooks/useLiveVoice";
import { AvatarVideoPlayer } from "./AvatarVideoPlayer";
import {
  Power,
  PhoneOff,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Languages,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Edit3
} from "lucide-react";

interface ChatAvatarPanelProps {
  isRecording: boolean;
  rmsLevel: number;
  messages: LiveMessage[];
  activeLanguage: string;
  onToggleRecording: (customerName?: string) => void;
  onSendMessage: (text: string) => void;
  onSwitchLanguage?: (lang: string) => void;
  onSelectPrompt?: (text: string) => void;
  onClose?: () => void;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
}

export function ChatAvatarPanel({
  isRecording,
  rmsLevel,
  messages,
  activeLanguage,
  onToggleRecording,
  onSendMessage,
  onSwitchLanguage,
  onClose,
  initialCustomerName = "",
  initialCustomerPhone = ""
}: ChatAvatarPanelProps) {
  const [name, setName] = useState(initialCustomerName || "");
  const [phone, setPhone] = useState(initialCustomerPhone || "");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false });
  const [isVerified, setIsVerified] = useState(false);

  // Regex patterns
  const NAME_REGEX = /^[a-zA-Z\s.']{2,50}$/;
  const PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

  const validateName = (val: string): string => {
    if (!val.trim()) return "Full name is required";
    if (!NAME_REGEX.test(val.trim())) {
      return "Please enter a valid name (at least 2 letters, alphabets only)";
    }
    return "";
  };

  const validatePhone = (val: string): string => {
    const cleaned = val.replace(/[\s-]/g, "");
    if (!cleaned) return "Mobile number is required";
    if (!PHONE_REGEX.test(cleaned)) {
      return "Please enter a valid 10-digit mobile number (e.g. 9820155432)";
    }
    return "";
  };

  const isFormValid =
    name.trim().length >= 2 &&
    NAME_REGEX.test(name.trim()) &&
    PHONE_REGEX.test(phone.replace(/[\s-]/g, ""));

  const handleStartConsultation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nErr = validateName(name);
    const pErr = validatePhone(phone);

    if (nErr || pErr) {
      setTouched({ name: true, phone: true });
      setNameError(nErr);
      setPhoneError(pErr);
      return;
    }

    setIsVerified(true);
  };

  const [inputText, setInputText] = useState("");
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const [hasVideoStream, setHasVideoStream] = useState(false);

  // Auto-scroll transcript to bottom as new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleDisconnect = () => {
    if (isVideoActive) {
      setIsVideoActive(false);
    }
    onToggleRecording();
  };

  useEffect(() => {
    const video = document.getElementById("video_player") as HTMLVideoElement | null;
    if (!video) return;

    const handlePlaying = () => setHasVideoStream(true);
    const handlePause = () => setHasVideoStream(false);
    const handleEnded = () => setHasVideoStream(false);

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const askQuickPrompt = (text: string) => {
    onSendMessage(text);
  };

  // Toggle user camera
  useEffect(() => {
    if (isVideoActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: 320, height: 240 } })
        .then((stream) => {
          setUserStream(stream);
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Camera access notice:", err);
          setIsVideoActive(false);
        });
    } else {
      if (userStream) {
        userStream.getTracks().forEach((track) => track.stop());
        setUserStream(null);
      }
    }
  }, [isVideoActive]);

  const isSpeaking = rmsLevel > 0.05;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (onSwitchLanguage) {
      onSwitchLanguage(val);
    }
  };

  return (
    <aside className="chat-avatar-panel flex flex-col h-full bg-[#0B0F17]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="avatar-header">
        <div className="consultant-profile">
          <div className="avatar-badge-online"></div>
          <div>
            <div className="consultant-name flex items-center gap-1.5">
              <span>Kabir</span>
              <span className="ai-chip">AI Specialist</span>
              {isVerified && name && (
                <span className="text-[9px] text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded-full font-mono flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" /> {name.split(" ")[0]}
                </span>
              )}
            </div>
            <div className="consultant-title">Mahindra Virtual Showroom</div>
          </div>
        </div>
        <div className="avatar-header-actions">
          {isVerified || messages.length > 0 ? (
            !isRecording ? (
              <button
                id="connectBtn"
                className="btn-primary-connect"
                onClick={() => onToggleRecording(name)}
                title="Start Live Voice Consultation with Kabir"
              >
                <Power className="w-3.5 h-3.5" /> Start Live Session
              </button>
            ) : (
              <button
                id="disconnectBtn"
                className="btn-secondary-disconnect"
                onClick={handleDisconnect}
              >
                <PhoneOff className="w-3.5 h-3.5" /> End
              </button>
            )
          ) : null}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors ml-1 cursor-pointer flex items-center justify-center"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pre-Chat Registration Form (Shown when not yet verified) */}
      {!isVerified && messages.length === 0 && !isRecording ? (
        <div className="flex-1 p-5 flex flex-col justify-center bg-gradient-to-b from-[#101726]/90 to-[#0B0F17]/95 overflow-y-auto animate-in fade-in duration-300">
          <div className="text-center mb-5">
            <div className="relative w-16 h-16 mx-auto mb-3">
              <div className="w-full h-full rounded-full p-0.5 bg-gradient-to-tr from-red-600 via-red-500 to-cyan-400 shadow-[0_0_25px_rgba(227,24,55,0.45)]">
                <img
                  src="/avatars/jay.png"
                  alt="Kabir Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B0F17] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              </span>
            </div>

            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>Connect with Kabir AI</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-[280px] mx-auto leading-relaxed">
              Enter your details below to unlock your interactive live voice consultation with Mahindra's AI Showroom Specialist.
            </p>
          </div>

          <form onSubmit={handleStartConsultation} className="space-y-4 max-w-[320px] mx-auto w-full">
            {/* Quick Demo Fill Option */}
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg p-2">
              <div className="text-[10px] text-slate-300">
                <span className="font-bold text-white">Demo Profile</span>: Kunal Mathuria
              </div>
              <button
                type="button"
                onClick={() => {
                  setName("Kunal mathuria");
                  setPhone("9819657034");
                  setNameError("");
                  setPhoneError("");
                  setTouched({ name: true, phone: true });
                }}
                className="text-[10px] font-bold text-cyan-300 hover:text-white bg-cyan-900/50 hover:bg-cyan-800/70 border border-cyan-500/40 px-2 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                title="Fill dummy details: Kunal mathuria (+91 98196 57034)"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>Auto Fill</span>
              </button>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> Full Name
                </span>
                {touched.name && !nameError && name.trim().length >= 2 && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    setNameError(validateName(e.target.value));
                  }
                }}
                onBlur={() => {
                  setTouched((prev) => ({ ...prev, name: true }));
                  setNameError(validateName(name));
                }}
                placeholder="e.g. Rahul Sharma"
                className={`w-full bg-[#151D2C] border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                  touched.name && nameError
                    ? "border-red-500 ring-1 ring-red-500/40 bg-red-950/20"
                    : touched.name && !nameError && name.trim().length >= 2
                    ? "border-emerald-500/70 bg-emerald-950/20 focus:border-emerald-400"
                    : "border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
                }`}
              />
              {touched.name && nameError && (
                <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {nameError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number
                </span>
                {touched.phone && !phoneError && phone.trim().length === 10 && (
                  <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-slate-400 font-mono font-bold flex items-center gap-1.5 pointer-events-none border-r border-white/10 pr-2">
                  <span>🇮🇳</span> +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setPhone(cleaned);
                    if (touched.phone) {
                      setPhoneError(validatePhone(cleaned));
                    }
                  }}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, phone: true }));
                    setPhoneError(validatePhone(phone));
                  }}
                  placeholder="98201 55432"
                  className={`w-full bg-[#151D2C] border rounded-xl pl-16 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-all ${
                    touched.phone && phoneError
                      ? "border-red-500 ring-1 ring-red-500/40 bg-red-950/20"
                      : touched.phone && !phoneError && phone.trim().length === 10
                      ? "border-emerald-500/70 bg-emerald-950/20 focus:border-emerald-400"
                      : "border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
                  }`}
                />
              </div>
              {touched.phone && phoneError && (
                <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {phoneError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-3 cursor-pointer ${
                isFormValid
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-[0_8px_25px_rgba(227,24,55,0.45)] hover:scale-[1.02] active:scale-98"
                  : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-60"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Proceed to Showroom</span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 max-w-[320px] mx-auto w-full text-[10.5px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Real-time Voice Consultation in 13+ Indian Languages</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>Instant Doorstep Test Drive Scheduling &amp; WhatsApp Dispatch</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Avatar & Customer Dual Video Communication Stage */}
          <div
            id="video-preview-container"
            className={`avatar-stage ${isVideoActive ? "dual-video" : ""} ${
              isSpeaking ? "active-speaking" : ""
            }`}
          >
            {/* Pane 1: Kabir AI Consultant */}
            <div
              className="avatar-output-wrapper cursor-pointer group"
              id="avatar-output-pane"
              onClick={() => {
                if (!isRecording) onToggleRecording(name);
              }}
              title={isRecording ? "Live Voice Session Active" : "Click to Start Voice Session with Kabir"}
            >
              <AvatarVideoPlayer
                isRecording={isRecording}
                rmsLevel={rmsLevel}
                isSpeaking={isSpeaking}
              />
            </div>

            {/* Pane 2: Customer Live Video Feed */}
            {isVideoActive && (
              <div className="customer-video-wrapper" id="customer-video-pane">
                <video ref={userVideoRef} id="video" autoPlay playsInline muted></video>
                <canvas id="canvas" style={{ display: "none" }}></canvas>
                <div className="video-pane-badge customer-badge">
                  <span className="pip-live-dot"></span>
                  <span className="pip-label">You (Live)</span>
                </div>
              </div>
            )}
          </div>

      {/* Media Controls Bar */}
      <div className="media-controls-strip">
        {isRecording ? (
          <span id="micBtn">
            <button
              className="control-circle-btn active"
              onClick={() => onToggleRecording(name)}
              title="Mute Microphone"
            >
              <Mic className="w-4 h-4" />
            </button>
          </span>
        ) : (
          <span id="micOffBtn">
            <button
              className="control-circle-btn"
              onClick={() => onToggleRecording(name)}
              title="Unmute Microphone"
            >
              <MicOff className="w-4 h-4" />
            </button>
          </span>
        )}

        {isVideoActive ? (
          <span id="cameraBtn">
            <button
              className="control-circle-btn active"
              onClick={() => setIsVideoActive(false)}
              title="Stop Camera"
            >
              <Video className="w-4 h-4" />
            </button>
          </span>
        ) : (
          <span id="cameraOffBtn">
            <button
              className="control-circle-btn"
              onClick={() => setIsVideoActive(true)}
              title="Start Camera"
            >
              <VideoOff className="w-4 h-4" />
            </button>
          </span>
        )}

        <button
          id="screenBtn"
          className="control-circle-btn disabled"
          disabled
          title="Share Screen"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <div className="device-selectors">
          <select id="audioSource" className="mini-select" title="Microphone Source">
            <option value="">Default Mic</option>
            <option value="builtin">Built-in Mic</option>
          </select>
          <select id="cameraSource" className="mini-select" title="Camera Source">
            <option value="">Default Cam</option>
            <option value="hd">HD Cam</option>
          </select>
        </div>
      </div>

      {/* Conversation Chat Window */}
      <div id="chat-container" className="live-chat-box">
        <div className="chat-box-header">
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span>Language:</span>
          <div className="chat-lang-toggle">
            <select
              id="active-indian-lang-select"
              className="lang-select-dropdown"
              value={
                activeLanguage === "Hinglish" || activeLanguage === "Hindi"
                  ? "hi-IN"
                  : activeLanguage === "English"
                  ? "en-IN"
                  : activeLanguage
              }
              onChange={handleLanguageChange}
              title="Select Indian Language for Voice & Consultation"
            >
              <option value="hi-IN">🇮🇳 Hindi (हिन्दी)</option>
              <option value="en-IN">🇬🇧 English / Hinglish</option>
              <option value="ta-IN">🇮🇳 Tamil (தமிழ்)</option>
              <option value="te-IN">🇮🇳 Telugu (తెలుగు)</option>
              <option value="kn-IN">🇮🇳 Kannada (ಕನ್ನಡ)</option>
              <option value="mr-IN">🇮🇳 Marathi (मराठी)</option>
              <option value="bn-IN">🇮🇳 Bengali (বাংলা)</option>
              <option value="gu-IN">🇮🇳 Gujarati (ગુજરાતી)</option>
              <option value="ml-IN">🇮🇳 Malayalam (മലയാളം)</option>
              <option value="pa-IN">🇮🇳 Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="or-IN">🇮🇳 Odia (ଓଡ଼ିଆ)</option>
              <option value="ur-IN">🇮🇳 Urdu (اردو)</option>
              <option value="as-IN">🇮🇳 Assamese (অসমীয়া)</option>
            </select>
          </div>
          <span className="chat-status-dot"></span>
        </div>

        <div id="text-chat" className="chat-scroll-area" ref={chatScrollRef}>
          <div className="chat-welcome-card">
            <p className="welcome-title">👋 Namaste! Welcome to Mahindra Auto.</p>
            <p className="welcome-desc">
              Kabir supports <strong>all Indian languages</strong> (Hindi, Tamil, Telugu,
              Kannada, Marathi, Bengali, Gujarati, Malayalam, Punjabi, English &amp; more).
            </p>
            <div className="suggested-questions">
              <button
                className="suggestion-chip"
                onClick={() =>
                  askQuickPrompt("Tell me about the new Thar ROXX 5-door SUV")
                }
              >
                New Thar ROXX 5-Door
              </button>
              <button
                className="suggestion-chip"
                onClick={() =>
                  askQuickPrompt("Tell me about Scorpio-N features and price")
                }
              >
                Scorpio-N (Big Daddy)
              </button>
              <button
                className="suggestion-chip"
                onClick={() =>
                  askQuickPrompt("Show me XUV700 Level 2 ADAS and features")
                }
              >
                XUV700 Tech SUV
              </button>
              <button
                className="suggestion-chip"
                onClick={() =>
                  askQuickPrompt("Tell me about XUV 3XO compact SUV")
                }
              >
                XUV 3XO (Skyroof)
              </button>
            </div>
          </div>

          {/* Dialogue Bubbles */}
          {messages.map((msg) => {
            const isUser = msg.speaker === "customer";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isUser ? "items-end" : "items-start"
                } w-full`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span
                    className={`text-[11px] font-black tracking-wide ${
                      isUser ? "text-cyan-400" : "text-amber-400"
                    }`}
                  >
                    {isUser ? "User" : "Kabir"}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
                <div
                  className={`chat-bubble ${
                    isUser ? "user-bubble" : "model-bubble"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.toolCall && (
                    <span className="block mt-1.5 pt-1 border-t border-white/10 text-[9.5px] text-amber-300 font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Action: {msg.toolCall.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            id="text-message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Kabir about Thar Roxx, Scorpio-N, XUV700, XUV 3XO, Bolero..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="send-msg-btn"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )}
</aside>
  );
}
