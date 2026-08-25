"use client";

import React, { useState } from "react";
import { VehicleItem, CustomerProfile } from "@/types";
import {
  X,
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Send,
  Languages,
  Bot,
  Power,
  PhoneOff,
  ChevronDown
} from "lucide-react";

interface LiveAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: VehicleItem | null;
  currentProfile: CustomerProfile | null;
  activeSession: {
    customer_id: string;
    name: string;
    phone: string;
    session_id: string;
    session_type: "LIVE_CALL" | "CHAT_BOT";
    is_returning: boolean;
  } | null;
  isRecording: boolean;
  rmsLevel: number;
  messages: any[];
  activeLanguage: string;
  onToggleRecording: () => void;
  onSendMessage: (text: string) => void;
  onSwitchLanguage: (lang: any) => void;
  onBookTestDrive?: (vehicle: VehicleItem) => void;
  onCompareVehicles?: (vehicle: VehicleItem) => void;
}

export function LiveAvatarModal({
  isOpen,
  onClose,
  selectedVehicle,
  currentProfile,
  activeSession,
  isRecording,
  rmsLevel,
  messages,
  activeLanguage,
  onToggleRecording,
  onSendMessage,
  onSwitchLanguage
}: LiveAvatarModalProps) {
  const [inputText, setInputText] = useState("");
  const [isVideoActive, setIsVideoActive] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const scale = Math.max(1, Math.min(1.35, 1 + rmsLevel * 1.2));
  const glowOpacity = Math.min(1, 0.4 + rmsLevel * 1.5);

  const indianLanguages = [
    { code: "hi-IN", id: "Hindi", label: "🇮🇳 Hindi (हिन्दी)" },
    { code: "en-IN", id: "English", label: "🇬🇧 English / Hinglish" },
    { code: "ta-IN", id: "Tamil", label: "🇮🇳 Tamil (தமிழ்)" },
    { code: "te-IN", id: "Telugu", label: "🇮🇳 Telugu (తెలుగు)" },
    { code: "kn-IN", id: "Kannada", label: "🇮🇳 Kannada (ಕನ್ನಡ)" },
    { code: "mr-IN", id: "Marathi", label: "🇮🇳 Marathi (मराठी)" },
    { code: "bn-IN", id: "Bengali", label: "🇮🇳 Bengali (বাংলা)" },
    { code: "gu-IN", id: "Gujarati", label: "🇮🇳 Gujarati (ગુજરાતી)" },
    { code: "ml-IN", id: "Malayalam", label: "🇮🇳 Malayalam (മലയാളം)" },
    { code: "pa-IN", id: "Punjabi", label: "🇮🇳 Punjabi (ਪੰਜਾਬੀ)" },
    { code: "or-IN", id: "Odia", label: "🇮🇳 Odia (ଓଡ଼ିଆ)" },
    { code: "ur-IN", id: "Urdu", label: "🇮🇳 Urdu (اردو)" },
    { code: "as-IN", id: "Assamese", label: "🇮🇳 Assamese (অসমীয়া)" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B0F17] border border-[#1E293B] rounded-3xl shadow-2xl w-full max-w-[460px] h-[92vh] max-h-[860px] flex flex-col overflow-hidden text-white font-sans">
        {/* 1. Header Bar matching live screenshot */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#0F172A]/80 backdrop-blur-md">
          {/* Profile Details */}
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm tracking-tight">Kabir</span>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                  AI CONSULTANT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Mahindra SUV Specialist</p>
            </div>
          </div>

          {/* Action Session Buttons & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRecording}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                isRecording
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30"
                  : "bg-gradient-to-r from-blue-600 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white shadow-[0_4px_14px_rgba(0,198,255,0.3)] hover:scale-102"
              }`}
            >
              {isRecording ? (
                <>
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End</span>
                </>
              ) : (
                <>
                  <Power className="w-3.5 h-3.5" />
                  <span>Start Live Session</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Main Body: Avatar Video Stage + Media Controls + Live Chat */}
        <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-hidden bg-[#070A10]">
          {/* Avatar & Customer Video Stage */}
          <div className={`relative w-full h-[200px] rounded-2xl bg-[#020408] border transition-all duration-300 overflow-hidden flex flex-col items-center justify-center ${
            isRecording ? "border-cyan-400/60 shadow-[0_0_20px_rgba(0,229,255,0.2)]" : "border-white/10"
          }`}>
            {/* Top-Left Kabir AI Badge */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-cyan-400/30 text-[10px] font-bold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00e5ff] animate-pulse"></span>
              <span>Kabir (AI)</span>
            </div>

            {/* Ambient Background Glow when Speaking */}
            <div
              className="absolute w-44 h-44 rounded-full bg-cyan-500/15 filter blur-3xl pointer-events-none transition-opacity duration-300"
              style={{ opacity: isRecording ? glowOpacity : 0.1 }}
            />

            {/* Center Avatar Placeholder & Prompt */}
            <div className="relative flex flex-col items-center justify-center space-y-2 z-10">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 ${
                  isRecording
                    ? "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-[0_0_18px_rgba(0,229,255,0.6)]"
                    : "bg-gradient-to-tr from-blue-950 to-slate-900 border border-cyan-400/50 text-cyan-400"
                }`}
                style={{ transform: isRecording ? `scale(${scale})` : "scale(1)" }}
              >
                <Bot className="w-7 h-7" />
              </div>
              <p className="text-xs text-slate-300 font-medium text-center max-w-[280px]">
                {isRecording ? (
                  <span className="text-cyan-300 font-bold">Kabir is listening live...</span>
                ) : (
                  <>
                    Click <strong className="text-white">Start Live Session</strong> to talk with Kabir
                  </>
                )}
              </p>
            </div>

            {/* Live Audio Energy Waveform Overlay */}
            {isRecording && (
              <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1 px-4 z-10">
                {[0.4, 0.9, 1.4, 0.7, 1.2, 0.5, 1.1, 0.6, 1.3, 0.8].map((multiplier, idx) => {
                  const h = Math.max(3, Math.min(18, rmsLevel * 45 * multiplier));
                  return (
                    <span
                      key={idx}
                      className="w-1 bg-cyan-400 rounded-full transition-all duration-75 shadow-[0_0_6px_#00e5ff]"
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Media Controls Strip */}
          <div className="flex items-center gap-2 p-1.5 bg-white/[0.04] border border-white/10 rounded-xl">
            <button
              onClick={onToggleRecording}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-md shadow-cyan-500/40"
                  : "bg-white/10 text-slate-400 hover:text-white"
              }`}
              title={isRecording ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isRecording ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsVideoActive(!isVideoActive)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isVideoActive
                  ? "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-md shadow-cyan-500/40"
                  : "bg-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle Video Camera"
            >
              {isVideoActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              className="w-8 h-8 rounded-full bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
              title="Share Screen"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 ml-auto">
              <select className="bg-black/60 border border-white/15 text-slate-300 text-[10px] font-bold rounded-lg px-2 py-1 outline-none max-w-[100px] truncate">
                <option>Default Micro</option>
              </select>
              <select className="bg-black/60 border border-white/15 text-slate-300 text-[10px] font-bold rounded-lg px-2 py-1 outline-none max-w-[95px] truncate">
                <option>Default Cam</option>
              </select>
            </div>
          </div>

          {/* 3. Conversation Chat Window */}
          <div className="flex-1 bg-[#080C14] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-inner min-h-0">
            {/* Chat Scroll Feed */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs">
              {/* Welcome Card matching screengrab */}
              <div className="bg-[#002855]/35 border border-cyan-400/25 rounded-xl p-3 text-left space-y-1.5">
                <p className="font-bold text-white text-xs">👋 Namaste! Welcome to Mahindra Auto.</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kabir supports <strong>all Indian languages</strong> (Hindi, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Malayalam, Punjabi, English & more).
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "New Thar ROXX 5-Door",
                    "Scorpio-N (Big Daddy)",
                    "XUV700 Tech SUV",
                    "XUV 3XO (Skyroof)"
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(chip)}
                      className="bg-white/10 hover:bg-cyan-500/25 border border-white/15 hover:border-cyan-400/50 text-cyan-300 text-[10px] font-bold px-2 py-0.5 rounded-full transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Dialogue Bubbles */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.speaker === "customer" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-2.5 text-xs leading-relaxed shadow-sm ${
                      msg.speaker === "customer"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-xs"
                        : "bg-[#0F1624] border border-white/10 border-l-[3px] border-l-cyan-400 text-slate-100 rounded-bl-xs"
                    }`}
                  >
                    <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                    {msg.toolCall && (
                      <div className="mt-1.5 pt-1 border-t border-white/10 text-[9px] text-amber-300 font-mono flex items-center gap-1 font-bold">
                        <span className="w-1 h-1 rounded-full bg-amber-400 animate-ping"></span>
                        Action: {msg.toolCall.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSend} className="p-2 border-t border-white/10 bg-[#060910] flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Kabir about Thar Roxx, Scorpio-N, XUV700, XUV 3XO, Bolero..."
                className="flex-1 bg-white/[0.07] border border-white/15 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30 transition-all hover:scale-105"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
