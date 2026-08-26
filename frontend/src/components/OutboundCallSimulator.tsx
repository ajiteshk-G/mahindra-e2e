"use client";

import React, { useState, useEffect, useRef } from "react";
import { CustomerProfile, OutboundCallInsightsResponse, TestRideInsightResponse } from "@/types";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  User,
  Clock,
  ShieldCheck,
  Award,
  Zap,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { triggerOutboundCall, sendOutboundDialogueTurn, fetchOutboundCallInsights } from "@/lib/api";

interface OutboundCallSimulatorProps {
  profile: CustomerProfile | null;
  testRideInsights: TestRideInsightResponse | null;
}

export function OutboundCallSimulator({
  profile,
  testRideInsights
}: OutboundCallSimulatorProps) {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected" | "ended">("idle");
  const [callReference, setCallReference] = useState<string>("CALL-MIA-2026-9901");
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const [agentSpeaking, setAgentSpeaking] = useState<boolean>(false);

  // Call Insights
  const [callInsights, setCallInsights] = useState<OutboundCallInsightsResponse | null>(null);

  // Dialogue History
  const [dialogue, setDialogue] = useState<Array<{ speaker: string; text: string; time: string }>>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Timer for active call
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const speakText = (text: string) => {
    if (!synthRef.current || !isSpeakerOn) return;
    try {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.onstart = () => setAgentSpeaking(true);
      utterance.onend = () => setAgentSpeaking(false);
      utterance.onerror = () => setAgentSpeaking(false);
      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  const handleStartOutboundCall = async () => {
    setCallState("ringing");
    setCallDuration(0);
    setTurnIndex(0);
    setDialogue([]);
    setCallInsights(null);

    try {
      const resp = await triggerOutboundCall({
        customer_id: profile?.customer_id || "CUST-AARAV-001",
        customer_name: profile?.name || "Aarav Sharma",
        phone_number: profile?.phone || "+91 98201 23456",
        vehicle_name: "Mahindra Thar ROXX AX7L Diesel AT",
        advisor_name: "Rajesh Varma",
        test_ride_session_id: testRideInsights?.session_id || "TR-2026-AARAV-881"
      });
      if (resp?.call_reference) {
        setCallReference(resp.call_reference);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerCall = () => {
    setCallState("connected");
    const initialGreeting = `Hi ${profile?.name || "Aarav"}! Hope you enjoyed driving the Thar ROXX with Advisor Rajesh. How did the suspension feel on the Bandra-Worli Sea Link?`;

    setDialogue([
      {
        speaker: "MIA",
        text: initialGreeting,
        time: "00:02"
      }
    ]);
    speakText(initialGreeting);
    setTurnIndex(1);
  };

  const handleCustomerReply = async (customText?: string) => {
    let replyText = "";
    if (customText) {
      replyText = customText;
    } else if (turnIndex === 1) {
      replyText = "The engine and suspension were amazing! But honestly, my wife is slightly concerned about rear seat legroom and the delivery wait period.";
    } else if (turnIndex === 2) {
      replyText = "That is fantastic news! Let's lock this Stealth Black allocation right away. Can you send me the financing options?";
    } else {
      replyText = "Thank you MIA! Let's proceed to loan pre-approval.";
    }

    const newDialogue = [
      ...dialogue,
      {
        speaker: profile?.name || "Aarav",
        text: replyText,
        time: `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}`
      }
    ];
    setDialogue(newDialogue);

    // Call backend dialogue turn
    try {
      const turnResp = await sendOutboundDialogueTurn({
        call_reference: callReference,
        customer_speech: replyText,
        turn_index: turnIndex
      });

      setTimeout(() => {
        setDialogue((prev) => [
          ...prev,
          {
            speaker: "MIA",
            text: turnResp.agent_message,
            time: `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}`
          }
        ]);
        speakText(turnResp.agent_message);
        setTurnIndex(turnResp.turn_index);

        if (turnResp.is_call_finished || turnIndex >= 2) {
          setTimeout(() => {
            handleEndCall();
          }, 4500);
        }
      }, 800);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEndCall = async () => {
    if (synthRef.current) synthRef.current.cancel();
    setCallState("ended");

    try {
      const insightsData = await fetchOutboundCallInsights(callReference);
      setCallInsights(insightsData);
    } catch (e) {
      console.error(e);
      // Fallback
      setCallInsights({
        call_reference: callReference,
        customer_id: profile?.customer_id || "CUST-AARAV-001",
        customer_name: profile?.name || "Aarav Sharma",
        agent_name: "MIA (Mahindra Intelligent Assistant)",
        phone_number: profile?.phone || "+91 98201 23456",
        call_status: "COMPLETED",
        call_duration_seconds: callDuration || 82,
        transcript: dialogue.map((d) => `[${d.time}] ${d.speaker}: "${d.text}"`).join("\n"),
        objections_handled: [
          "Rear seat legroom (Addressed with 60:40 Split Reclining Seats demo)",
          "12-16 week delivery wait time (Resolved: Locked 12-day allocation in Stealth Black)"
        ],
        objection_resolution_status: "100% RESOLVED",
        customer_sentiment: "VERY_POSITIVE (Enthusiastic)",
        customer_decision: "LOCKED_ALLOCATION_PROCEED_TO_FINANCE",
        locked_vehicle_variant: "Thar ROXX AX7L Diesel AT 4x4 (Stealth Black)",
        locked_allocation_days: 12,
        next_step: "DIGITAL_FINANCING_KYC",
        created_at: new Date().toISOString()
      });
    }
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-blue-950/80 p-5 rounded-2xl border border-blue-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <PhoneCall className="w-3.5 h-3.5" />
            Stage 3: Proactive Post-Ride Outbound Voice Call & Insights
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span>MIA Intelligent Post-Test Ride Voice Follow-up</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono">
              Auto-Triggered
            </span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 mt-1 max-w-2xl">
            Proactive voice call from MIA right after the test ride. Automatically addresses concerns (rear legroom & waiting period) and confirms fast-track 12-day allocation.
          </p>
        </div>

        {callInsights && (
          <div className="bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Allocation Provisionally Confirmed</span>
          </div>
        )}
      </div>

      {/* Grid: 5 Cols Phone Call Interface | 7 Cols AI Call Analytics & Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Phone Call Simulator */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm bg-black rounded-[42px] p-3 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[6px] border-neutral-800 relative">
            {/* Phone Notch */}
            <div className="w-28 h-5 bg-neutral-900 rounded-full mx-auto mb-2 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-800"></span>
              <span className="w-2 h-2 rounded-full bg-blue-900/60"></span>
            </div>

            {/* Screen Container */}
            <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-black rounded-[32px] overflow-hidden border border-neutral-800 flex flex-col h-[580px] p-4 text-xs justify-between relative">
              {/* IDLE STATE */}
              {callState === "idle" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <PhoneCall className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                      Trigger Post-Ride Call
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      MIA Outbound Voice Agent
                    </h3>
                    <p className="text-neutral-400 text-xs mt-1">
                      Ready to call {profile?.name || "Aarav Sharma"} ({profile?.phone || "+91 98201 23456"})
                    </p>
                  </div>

                  <button
                    onClick={handleStartOutboundCall}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-950/60 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Initiate Outbound Call Now</span>
                  </button>
                </div>
              )}

              {/* RINGING STATE */}
              {callState === "ringing" && (
                <div className="flex-1 flex flex-col items-center justify-between py-8 text-center animate-fade-in">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest block animate-pulse">
                      INCOMING OUTBOUND CALL...
                    </span>
                    <h3 className="text-2xl font-black text-white">MIA Virtual Assistant</h3>
                    <p className="text-neutral-400 text-xs">+91 22 6900 1000 • Mahindra Rise</p>
                  </div>

                  {/* Pulsing Avatar */}
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-blue-600/20 border-2 border-blue-500 animate-ping absolute inset-0"></div>
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-black shadow-2xl relative z-10">
                      MIA
                    </div>
                  </div>

                  {/* Answer & Decline Buttons */}
                  <div className="flex items-center justify-around w-full px-6 pt-4">
                    <button
                      onClick={handleEndCall}
                      className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-950/60"
                      title="Decline"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                    <button
                      onClick={handleAnswerCall}
                      className="p-4 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg shadow-green-950/60 animate-bounce"
                      title="Answer"
                    >
                      <Phone className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* CONNECTED CALL STATE */}
              {callState === "connected" && (
                <div className="flex-1 flex flex-col justify-between py-2 space-y-3">
                  {/* Call Header */}
                  <div className="text-center border-b border-neutral-800 pb-2">
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider block">
                      ● CALL CONNECTED • {formatCallTime(callDuration)}
                    </span>
                    <h4 className="text-base font-black text-white">MIA (Mahindra Assistant)</h4>
                    <span className="text-[10px] text-neutral-400">Post-Test Ride Experience Handoff</span>
                  </div>

                  {/* Live Speaking Orb / Acoustic Wave */}
                  <div className="flex flex-col items-center justify-center py-2 relative">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        agentSpeaking
                          ? "border-blue-400 scale-110 shadow-[0_0_30px_rgba(59,130,246,0.6)]"
                          : "border-blue-900 bg-blue-950/40"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                        MIA
                      </div>
                    </div>

                    {agentSpeaking && (
                      <div className="flex items-center gap-1 mt-2">
                        {[4, 12, 22, 10, 26, 14, 8, 20, 16, 6].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-blue-400 rounded-full animate-pulse"
                            style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
                          ></span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dialogue Transcript Scroll Box */}
                  <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 max-h-44 overflow-y-auto space-y-2 text-[11px]">
                    {dialogue.map((d, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl ${
                          d.speaker === "MIA"
                            ? "bg-neutral-900 text-neutral-200 border border-neutral-800"
                            : "bg-blue-600 text-white ml-4"
                        }`}
                      >
                        <div className="text-[9px] opacity-70 flex justify-between font-bold">
                          <span>{d.speaker}</span>
                          <span>{d.time}</span>
                        </div>
                        <p className="mt-0.5 leading-relaxed">{d.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Customer Interactive Spoken Response Options */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-neutral-400 font-bold block">
                      Respond as Customer ({profile?.name || "Aarav"}):
                    </span>
                    {turnIndex === 1 && (
                      <button
                        onClick={() => handleCustomerReply()}
                        className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-blue-200 rounded-xl text-left text-[11px] leading-tight"
                      >
                        🗣️ "Engine & suspension were amazing, but wife concerned on rear legroom & wait period."
                      </button>
                    )}
                    {turnIndex === 2 && (
                      <button
                        onClick={() => handleCustomerReply()}
                        className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-green-300 rounded-xl text-left text-[11px] leading-tight"
                      >
                        🗣️ "That's fantastic! Let's lock the 12-day Stealth Black allocation & see financing."
                      </button>
                    )}
                  </div>

                  {/* In-Call Action Bar */}
                  <div className="flex items-center justify-around pt-2 border-t border-neutral-800">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-2.5 rounded-full ${isMuted ? "bg-red-900 text-red-300" : "bg-neutral-800 text-neutral-300"}`}
                      title="Mute"
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      className={`p-2.5 rounded-full ${!isSpeakerOn ? "bg-neutral-800 text-neutral-500" : "bg-blue-900/60 text-blue-300"}`}
                      title="Speaker"
                    >
                      {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={handleEndCall}
                      className="p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-full"
                      title="End Call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ENDED STATE */}
              {callState === "ended" && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider block">
                      Call Completed & Analyzed
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">Objections Resolved 100%</h3>
                    <p className="text-neutral-400 text-xs mt-1">
                      Allocation Locked (#MAH-AL-99218) • 12 Days ETA
                    </p>
                  </div>

                  <button
                    onClick={onProceedToFinancing}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60"
                  >
                    <span>Proceed to Stage 4: Instant Financing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleStartOutboundCall}
                    className="text-neutral-400 hover:text-white text-[11px]"
                  >
                    Replay Call Simulation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Post-Call Insights & Dealership Pipeline Dashboard */}
        <div className="lg:col-span-7 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Gemini Conversational Analytics
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Post-Test Ride Call Insights & Resolution
              </h3>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
              Ref: {callReference}
            </span>
          </div>

          {callInsights ? (
            <div className="space-y-5 text-xs">
              {/* Call Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Resolution Rate</span>
                  <span className="text-xl font-black text-green-400 mt-0.5 block">100%</span>
                  <span className="text-[9px] text-neutral-500">All Objections Cleared</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Customer Sentiment</span>
                  <span className="text-xl font-black text-blue-400 mt-0.5 block">Very Positive</span>
                  <span className="text-[9px] text-neutral-500">Committed to Buy</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Locked Allocation</span>
                  <span className="text-xl font-black text-amber-400 mt-0.5 block">12 Days</span>
                  <span className="text-[9px] text-neutral-500">Bayview Mahindra</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Call Duration</span>
                  <span className="text-xl font-black text-purple-400 mt-0.5 block">
                    {callInsights.call_duration_seconds}s
                  </span>
                  <span className="text-[9px] text-neutral-500">3 Turn Dialogue</span>
                </div>
              </div>

              {/* Handled Objections Breakdown */}
              <div className="p-4 bg-blue-950/20 border border-blue-800/40 rounded-xl space-y-3">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Objections Addressed & Resolved by MIA
                </span>
                <div className="space-y-2 text-neutral-300">
                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div className="flex items-center justify-between font-bold text-neutral-200">
                      <span>1. Rear Seat Legroom & Elder Comfort</span>
                      <span className="text-green-400 text-[10px]">RESOLVED</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      MIA highlighted the AX7L's 60:40 split reclining seat function which expands rear knee room and provides adjustable under-thigh comfort.
                    </p>
                  </div>

                  <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                    <div className="flex items-center justify-between font-bold text-neutral-200">
                      <span>2. Delivery Waiting Period (12-16 Weeks Anxiety)</span>
                      <span className="text-green-400 text-[10px]">RESOLVED</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      MIA scanned real-time regional dealer allocation pipeline and provisionally locked a ready <strong>Stealth Black AX7L Diesel AT</strong> scheduled for delivery in <strong>12 days</strong> at Bayview Mahindra.
                    </p>
                  </div>
                </div>
              </div>

              {/* Locked Vehicle Allocation Badge */}
              <div className="p-4 bg-gradient-to-r from-amber-950/40 via-neutral-950 to-neutral-950 rounded-xl border border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Fast-Track Regional Inventory Allocation Lock:
                  </span>
                  <span className="text-base font-black text-white mt-0.5 block">
                    {callInsights.locked_vehicle_variant}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Allocation #MAH-AL-99218 • Dealership: Bayview Mahindra, Bandra West
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold whitespace-nowrap">
                  12 Days Delivery ETA
                </div>
              </div>

              {/* Timestamped Transcript */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Outbound Call Transcript:
                </span>
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 max-h-40 overflow-y-auto space-y-1.5 font-mono text-[11px] text-neutral-300">
                  {callInsights.transcript.split("\n").map((line, idx) => (
                    <div key={idx} className={line.includes("MIA") ? "text-blue-300" : "text-neutral-300"}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion Banner */}
              <div className="w-full p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Outbound Customer Feedback Completed • Priority Vehicle Allocation Confirmed</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-4 text-neutral-400">
              <PhoneCall className="w-12 h-12 mx-auto text-neutral-600 animate-pulse" />
              <div>
                <h4 className="text-base font-bold text-neutral-200">
                  Ready to Initiate Outbound Call
                </h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Click the call button on the phone simulator to launch the proactive outbound follow-up conversation.
                </p>
              </div>
              <button
                onClick={handleStartOutboundCall}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
              >
                Start Outbound Call Simulation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
