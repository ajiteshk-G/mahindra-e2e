"use client";

import React, { useState, useEffect, useRef } from "react";
import { VehicleItem, CustomerProfile, TestRideLeadItem, TestRideInsightResponse } from "@/types";
import {
  Smartphone,
  Mic,
  Square,
  Play,
  Pause,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  User,
  Car,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Volume2,
  Share2,
  Database
} from "lucide-react";
import { fetchSalesLeads, uploadTestRideRecording } from "@/lib/api";

interface SalesMobileAppProps {
  vehicles: VehicleItem[];
  profile: CustomerProfile | null;
  selectedVehicleId?: string;
  onProceedToOutboundCall: (insights: TestRideInsightResponse) => void;
}

export function SalesMobileApp({
  vehicles,
  profile,
  selectedVehicleId = "thar_roxx",
  onProceedToOutboundCall
}: SalesMobileAppProps) {
  const [leads, setLeads] = useState<TestRideLeadItem[]>([]);
  const [selectedLead, setSelectedLead] = useState<TestRideLeadItem | null>(null);
  const [testVehicleId, setTestVehicleId] = useState<string>(selectedVehicleId);
  const [activeTab, setActiveTab] = useState<"leads" | "record" | "insights">("leads");

  // Mobile Microphone Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [insights, setInsights] = useState<TestRideInsightResponse | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load leads on mount
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSalesLeads();
        if (data && data.length > 0) {
          setLeads(data);
          setSelectedLead(data[0]);
        } else {
          // Default lead
          const defaultLead: TestRideLeadItem = {
            customer_id: profile?.customer_id || "CUST-AARAV-001",
            name: profile?.name || "Aarav Sharma",
            phone: profile?.phone || "+91 98201 23456",
            email: profile?.email || "aarav.sharma@example.com",
            city: profile?.city || "Mumbai",
            preferred_vehicle: "Thar ROXX AX7L Diesel AT 4x4",
            booking_status: "CONFIRMED_PRE_SALES",
            scheduled_slot: "Tomorrow at 5:00 PM",
            presales_notes: "Explored Thar ROXX in Virtual Showroom. Inquired about suspension and city commute."
          };
          setLeads([defaultLead]);
          setSelectedLead(defaultLead);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [profile]);

  // Sync incoming vehicle
  useEffect(() => {
    if (selectedVehicleId) {
      setTestVehicleId(selectedVehicleId);
    }
  }, [selectedVehicleId]);

  // Recording Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    setRecordingSeconds(0);
    setAudioUrl(null);
    setInsights(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.warn("Microphone not accessible, fallback to mock timer:", err);
      setIsRecording(true);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
    }
    setIsPaused(true);
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
    }
    setIsPaused(false);
  };

  const stopAndProcessRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setIsUploading(true);

    try {
      const response = await uploadTestRideRecording({
        customer_id: selectedLead?.customer_id || profile?.customer_id || "CUST-AARAV-001",
        vehicle_id: testVehicleId,
        variant: "AX7L Diesel AT 4x4",
        sales_advisor_name: "Rajesh Varma (Bayview Mahindra)",
        duration_seconds: Math.max(recordingSeconds, 184),
        audio_format: "audio/webm",
        simulated_scenario: "bandra_sea_link_test_ride"
      });

      setInsights(response);
      setActiveTab("insights");
    } catch (err) {
      console.error("Error uploading test ride:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentVehicleObj = vehicles.find((v) => v.id === testVehicleId) || vehicles[0];

  return (
    <div className="space-y-6">
      {/* Stage Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-amber-950/80 p-5 rounded-2xl border border-amber-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            Stage 2: Sales Advisor Mobile Companion & Test Ride Recording
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span>Advisor Field App & GCS Audio Insights Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              Bayview Mahindra
            </span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 mt-1 max-w-2xl">
            Pre-sales leads automatically loaded. Sales Advisor records customer communication during test drive on mobile, dumps audio to GCS, and generates multi-dimensional AI insights.
          </p>
        </div>

        {insights && (
          <button
            onClick={() => onProceedToOutboundCall(insights)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/40 flex items-center gap-2"
          >
            <span>Proceed to Stage 3: Outbound Call</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid: 5 Cols Mobile Phone Frame | 7 Cols Audio AI Insights Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Realistic Mobile Device View */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm bg-black rounded-[42px] p-3 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[6px] border-neutral-800 relative">
            {/* Phone Notch / Dynamic Island */}
            <div className="w-28 h-5 bg-neutral-900 rounded-full mx-auto mb-2 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-800"></span>
              <span className="w-2 h-2 rounded-full bg-blue-900/60"></span>
            </div>

            {/* Mobile Screen Shell */}
            <div className="bg-neutral-950 rounded-[32px] overflow-hidden border border-neutral-800 flex flex-col h-[600px] text-xs">
              {/* App Top Bar */}
              <div className="bg-gradient-to-r from-red-900 to-neutral-900 px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-red-200 font-bold uppercase tracking-wider block">
                    Mahindra Sales Advisor
                  </span>
                  <span className="font-black text-white text-sm">Advisor Rajesh Varma</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                  Online
                </span>
              </div>

              {/* Mobile Tabs */}
              <div className="flex border-b border-neutral-800 bg-neutral-900/60">
                <button
                  onClick={() => setActiveTab("leads")}
                  className={`flex-1 py-2.5 font-bold text-center transition-colors ${
                    activeTab === "leads"
                      ? "text-red-400 border-b-2 border-red-500 bg-red-950/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  📋 Leads ({leads.length})
                </button>
                <button
                  onClick={() => setActiveTab("record")}
                  className={`flex-1 py-2.5 font-bold text-center transition-colors ${
                    activeTab === "record"
                      ? "text-red-400 border-b-2 border-red-500 bg-red-950/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  🎙️ Test Ride
                </button>
                <button
                  onClick={() => setActiveTab("insights")}
                  className={`flex-1 py-2.5 font-bold text-center transition-colors ${
                    activeTab === "insights"
                      ? "text-red-400 border-b-2 border-red-500 bg-red-950/20"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  ✨ Insights
                </button>
              </div>

              {/* Mobile Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* TAB 1: Leads loaded from Pre-sales */}
                {activeTab === "leads" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-neutral-300">
                        Active Pre-Sales Inquiries:
                      </span>
                      <span className="text-[10px] text-neutral-400">Live CRM Sync</span>
                    </div>

                    {leads.map((lead, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedLead(lead);
                          setActiveTab("record");
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedLead?.customer_id === lead.customer_id
                            ? "bg-red-950/40 border-red-500 shadow-md shadow-red-950/40"
                            : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{lead.name}</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-950 text-green-400 border border-green-800">
                            {lead.booking_status}
                          </span>
                        </div>

                        <p className="text-neutral-400 text-[11px] mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-red-400" />
                          {lead.phone} • {lead.city}
                        </p>

                        <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-amber-300 font-semibold">{lead.preferred_vehicle}</span>
                          <span className="text-neutral-400">{lead.scheduled_slot}</span>
                        </div>
                      </div>
                    ))}

                    <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                        Advisor Action:
                      </span>
                      <button
                        onClick={() => setActiveTab("record")}
                        className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Start Test Ride Recording for {selectedLead?.name || "Aarav"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: Mobile Audio Recording */}
                {activeTab === "record" && (
                  <div className="space-y-4">
                    {/* Customer & Vehicle Header */}
                    <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 uppercase">Customer</span>
                        <span className="font-bold text-white">{selectedLead?.name || "Aarav Sharma"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400 uppercase">Vehicle for Test Ride</span>
                        <select
                          value={testVehicleId}
                          onChange={(e) => setTestVehicleId(e.target.value)}
                          className="bg-neutral-950 border border-neutral-700 rounded-lg text-[11px] text-white px-2 py-1 font-semibold"
                        >
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Advisor Talking Points */}
                    <div className="p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 text-[11px] space-y-1 text-neutral-300">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">
                        Advisor Demo Checklist:
                      </span>
                      <div>• Demonstrate FSD Suspension on rough patches / Sea Link</div>
                      <div>• Showcase 2.2L mHawk Diesel Acceleration</div>
                      <div>• Highlight 60:40 Split Reclining Rear Seats for legroom</div>
                    </div>

                    {/* Audio Waveform & Timer Recorder Shell */}
                    <div className="p-5 bg-black rounded-2xl border border-neutral-800 text-center space-y-3">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        {isRecording ? "🔴 RECORDING IN PROGRESS" : "TEST RIDE AUDIO CAPTURE"}
                      </div>

                      {/* Timer Display */}
                      <div className="text-3xl font-black font-mono text-white tracking-widest">
                        {formatTime(recordingSeconds)}
                      </div>

                      {/* Animated Audio Waveform */}
                      <div className="h-12 flex items-center justify-center gap-1 px-4">
                        {[4, 10, 18, 28, 14, 34, 22, 12, 30, 20, 8, 24, 16, 6].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isRecording && !isPaused ? "bg-red-500 animate-pulse" : "bg-neutral-800"
                            }`}
                            style={{
                              height: isRecording && !isPaused ? `${h * 1.3}px` : "6px",
                              animationDelay: `${i * 60}ms`
                            }}
                          ></span>
                        ))}
                      </div>

                      {/* Recording Controls */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-xs flex items-center gap-2 shadow-lg shadow-red-950/60"
                          >
                            <Mic className="w-4 h-4" />
                            <span>Start Ride Recording</span>
                          </button>
                        ) : (
                          <>
                            {isPaused ? (
                              <button
                                onClick={resumeRecording}
                                className="p-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full"
                                title="Resume"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={pauseRecording}
                                className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full border border-neutral-700"
                                title="Pause"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={stopAndProcessRecording}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50"
                            >
                              <Square className="w-3.5 h-3.5" />
                              <span>Stop & Upload to GCS</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isUploading && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-center space-y-1">
                        <UploadCloud className="w-5 h-5 animate-bounce mx-auto text-amber-400" />
                        <span className="font-bold text-xs">Uploading audio to Google Cloud Storage (GCS)...</span>
                        <p className="text-[10px] text-neutral-400">Extracting STT transcript & AI Insights</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: AI Insights Quick Mobile View */}
                {activeTab === "insights" && (
                  <div className="space-y-3">
                    {insights ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-green-950/30 border border-green-800/50 rounded-xl text-green-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold block">GCS Upload Complete</span>
                            <span className="text-[9px] text-neutral-400 font-mono truncate block max-w-[200px]">
                              {insights.gcs_uri}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                            <span className="text-[10px] text-neutral-400 block">Customer Sentiment</span>
                            <span className="text-base font-black text-green-400">
                              {(insights.customer_sentiment_score * 100).toFixed(0)}% Positive
                            </span>
                          </div>
                          <div className="p-2.5 bg-neutral-900 rounded-xl border border-neutral-800 text-center">
                            <span className="text-[10px] text-neutral-400 block">Purchase Intent</span>
                            <span className="text-base font-black text-amber-400">
                              {(insights.purchase_intent_score * 100).toFixed(0)}% High
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-red-400 block">
                            Key Objections Captured:
                          </span>
                          <ul className="text-[11px] text-neutral-300 space-y-1">
                            {insights.objections_raised?.map((o, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-400 font-bold">•</span>
                                <span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          onClick={() => onProceedToOutboundCall(insights)}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Trigger Outbound MIA Follow-Up Call</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-neutral-500 space-y-2">
                        <FileText className="w-8 h-8 mx-auto opacity-40" />
                        <p>No recording processed yet. Start a test ride in the Test Ride tab.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Multi-Dimensional AI Insights & GCS Dump Panel */}
        <div className="lg:col-span-7 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Google Cloud Storage & Gemini Multimodal
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Test Ride Communication Insights & Analytics
              </h3>
            </div>

            {insights && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-mono">
                Session: {insights.session_id}
              </span>
            )}
          </div>

          {insights ? (
            <div className="space-y-5 text-xs">
              {/* Storage Metadata Card */}
              <div className="p-3.5 bg-black/60 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    GCS Recording Storage URI:
                  </span>
                  <span className="text-green-400 font-mono text-[11px] font-bold">Encrypted & Archived</span>
                </div>
                <div className="p-2 rounded bg-neutral-950 border border-neutral-850 text-neutral-300 font-mono text-[11px] break-all">
                  {insights.gcs_uri}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Customer Sentiment</span>
                  <span className="text-xl font-black text-green-400 mt-0.5 block">
                    {(insights.customer_sentiment_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-neutral-500">Very Positive Tone</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Purchase Intent</span>
                  <span className="text-xl font-black text-amber-400 mt-0.5 block">
                    {(insights.purchase_intent_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-[9px] text-neutral-500">High Conversion Likelihood</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Advisor Score</span>
                  <span className="text-xl font-black text-blue-400 mt-0.5 block">
                    {insights.advisor_pitch_score} / 10
                  </span>
                  <span className="text-[9px] text-neutral-500">Rajesh Varma</span>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-center">
                  <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Duration</span>
                  <span className="text-xl font-black text-purple-400 mt-0.5 block">
                    {Math.floor(insights.duration_seconds / 60)}m {insights.duration_seconds % 60}s
                  </span>
                  <span className="text-[9px] text-neutral-500">Sea Link Route</span>
                </div>
              </div>

              {/* Loved Features vs Objections Raised */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Loved Features */}
                <div className="p-4 bg-green-950/20 border border-green-800/40 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Customer Loved Features
                  </span>
                  <ul className="space-y-1.5 text-neutral-300">
                    {insights.loved_features?.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-green-400 font-bold">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Objections / Concerns */}
                <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-xl space-y-2">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Objections / Friction Points
                  </span>
                  <ul className="space-y-1.5 text-neutral-300">
                    {insights.objections_raised?.map((o, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Advisor Coaching & Recommendation */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Coaching & Next Best Action
                </span>
                <p className="text-neutral-300 leading-relaxed">
                  {insights.advisor_coaching_feedback}
                </p>
                <div className="mt-2 pt-2 border-t border-neutral-800 text-neutral-200">
                  <strong className="text-red-400">Automated Next Action: </strong>
                  {insights.recommended_action}
                </div>
              </div>

              {/* Timestamped Speech-to-Text Conversation Transcript */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Full Speech-to-Text Diarized Transcript:
                </span>
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 max-h-48 overflow-y-auto space-y-2 font-mono text-[11px] text-neutral-300 leading-relaxed">
                  {insights.transcript.split("\n").map((line, idx) => (
                    <div key={idx} className={line.includes("Aarav") ? "text-amber-200" : "text-neutral-300"}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>

              {/* Big CTA */}
              <button
                onClick={() => onProceedToOutboundCall(insights)}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/60"
              >
                <Phone className="w-4 h-4" />
                <span>Launch Stage 3: Proactive Outbound Call from MIA to Aarav</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-16 space-y-4 text-neutral-400">
              <Mic className="w-12 h-12 mx-auto text-neutral-600 animate-pulse" />
              <div>
                <h4 className="text-base font-bold text-neutral-200">
                  Awaiting Test Ride Audio Stream
                </h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Use the Sales Advisor mobile simulator on the left to start and record the communication during the test ride.
                </p>
              </div>
              <button
                onClick={startRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs"
              >
                Simulate Sea Link Test Ride Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
