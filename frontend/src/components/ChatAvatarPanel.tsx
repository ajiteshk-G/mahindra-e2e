"use client";

import React, { useState, useEffect, useRef } from "react";
import { LiveMessage } from "@/hooks/useLiveVoice";
import { AvatarVideoPlayer } from "./AvatarVideoPlayer";
import {
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Send,
  Power,
  PhoneOff,
  X,
  Radio
} from "lucide-react";

interface ChatAvatarPanelProps {
  isRecording: boolean;
  rmsLevel: number;
  messages: LiveMessage[];
  activeLanguage: string;
  onToggleRecording: () => void;
  onSendMessage: (text: string) => void;
  onSelectPrompt?: (text: string) => void;
  onClose?: () => void;
}

export function ChatAvatarPanel({
  isRecording,
  rmsLevel,
  messages,
  activeLanguage,
  onToggleRecording,
  onSendMessage,
  onClose
}: ChatAvatarPanelProps) {
  const [inputText, setInputText] = useState("");
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const userVideoRef = useRef<HTMLVideoElement | null>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
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

  return (
    <aside className="bg-[#0B0F17] border border-[#1E293B] rounded-3xl shadow-2xl flex flex-col h-[780px] lg:h-[840px] overflow-hidden text-white font-sans w-full animate-in fade-in slide-in-from-right-4 duration-300">
      {/* 1. Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#0F172A]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] shrink-0"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-sm tracking-tight">Kabir</span>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                LIVE VIDEO AVATAR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Mahindra SUV Specialist</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRecording}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
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

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close Live Window"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Content Body: Avatar Video Stage + Controls + Live Chat */}
      <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-hidden bg-[#070A10]">
        {/* LIVE MULTIMODAL AVATAR VIDEO STAGE */}
        <div
          className={`relative w-full h-[220px] lg:h-[240px] rounded-2xl bg-black border transition-all duration-300 overflow-hidden flex flex-col items-center justify-center shrink-0 ${
            isSpeaking
              ? "border-cyan-400 shadow-[0_0_25px_rgba(0,229,255,0.35)]"
              : isRecording
              ? "border-cyan-500/60 shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              : "border-white/10"
          }`}
        >
          {/* Live Video Avatar Stream Component */}
          <AvatarVideoPlayer
            isRecording={isRecording}
            rmsLevel={rmsLevel}
            isSpeaking={isSpeaking}
          />

          {/* Top-Right PiP: Customer Live Video Stream (if camera enabled) */}
          {isVideoActive && (
            <div className="absolute top-2.5 right-2.5 w-20 h-16 rounded-xl border border-red-500/60 overflow-hidden shadow-xl z-20 bg-black">
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.2 rounded text-[8px] font-bold text-red-400 flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                <span>You</span>
              </div>
            </div>
          )}

          {/* Live Audio Energy Waveform Overlay at the base of the Video */}
          {isRecording && (
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1 px-4 z-10 pointer-events-none">
              {[0.4, 0.9, 1.4, 0.7, 1.2, 0.5, 1.1, 0.6, 1.3, 0.8, 1.2, 0.5, 0.9].map((multiplier, idx) => {
                const h = Math.max(3, Math.min(22, rmsLevel * 50 * multiplier));
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
        <div className="flex items-center gap-2 p-1.5 bg-white/[0.04] border border-white/10 rounded-xl shrink-0">
          <button
            onClick={onToggleRecording}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isRecording
                ? "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-md shadow-cyan-500/40"
                : "bg-white/10 text-slate-400 hover:text-white"
            }`}
            title={isRecording ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isRecording ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsVideoActive(!isVideoActive)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isVideoActive
                ? "bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-md shadow-cyan-500/40"
                : "bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Toggle Video Camera"
          >
            {isVideoActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </button>

          <button
            className="w-7 h-7 rounded-full bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Share Screen"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 ml-auto">
            <select className="bg-black/60 border border-white/15 text-slate-300 text-[10px] font-bold rounded-lg px-2 py-0.5 outline-none max-w-[90px] truncate">
              <option>Default Micro</option>
            </select>
            <select className="bg-black/60 border border-white/15 text-slate-300 text-[10px] font-bold rounded-lg px-2 py-0.5 outline-none max-w-[85px] truncate">
              <option>Default Cam</option>
            </select>
          </div>
        </div>

        {/* 3. Conversation Chat Window */}
        <div className="flex-1 bg-[#080C14] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-inner min-h-0">
          {/* Chat Scroll Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 font-sans text-xs">
            {/* Dynamic Dialogue Bubbles (Empty initially until spoken) */}
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
          <form onSubmit={handleSend} className="p-2 border-t border-white/10 bg-[#060910] flex items-center gap-2 shrink-0">
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
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
