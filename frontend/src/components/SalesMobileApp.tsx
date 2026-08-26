"use client";

import React, { useState, useEffect, useRef } from "react";
import { VehicleItem, CustomerProfile, TestRideLeadItem, TestRideInsightResponse, DealershipItem } from "@/types";
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
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  Volume2,
  Share2,
  Database,
  Building2,
  MapPin,
  RefreshCw,
  ChevronRight,
  Filter
} from "lucide-react";
import { fetchSalesLeads, uploadTestRideRecording, fetchDealerships } from "@/lib/api";

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
  // Showrooms & Filtering
  const [dealerships, setDealerships] = useState<DealershipItem[]>([]);
  const [selectedShowroom, setSelectedShowroom] = useState<string>("ALL");
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);

  // Leads & Selected Test Ride
  const [leads, setLeads] = useState<TestRideLeadItem[]>([]);
  const [selectedLead, setSelectedLead] = useState<TestRideLeadItem | null>(null);
  const [testVehicleId, setTestVehicleId] = useState<string>(selectedVehicleId);
  const [selectedVariant, setSelectedVariant] = useState<string>("AX7L Diesel AT 4x4");
  const [activeTab, setActiveTab] = useState<"leads" | "record" | "insights">("leads");

  // Mobile Microphone Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [insights, setInsights] = useState<TestRideInsightResponse | null>(null);
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({});

  const toggleChecklistItem = (item: string) => {
    setCheckedChecklist((prev) => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 1. Load Dealerships on Mount
  useEffect(() => {
    async function loadDealers() {
      try {
        const dealers = await fetchDealerships();
        if (dealers && dealers.length > 0) {
          setDealerships(dealers);
        }
      } catch (e) {
        console.error("Failed to load dealerships:", e);
      }
    }
    loadDealers();
  }, []);

  // 2. Load Leads whenever selected showroom changes
  const loadLeadsForShowroom = async (dealershipId: string) => {
    setIsLoadingLeads(true);
    try {
      const data = await fetchSalesLeads(dealershipId);
      if (data && data.length > 0) {
        setLeads(data);
        // Select the first lead by default
        const first = data[0];
        setSelectedLead(first);
        if (first.vehicle_id) {
          setTestVehicleId(first.vehicle_id);
          setSelectedVariant(first.variant || "Official Variant");
        }
      } else {
        setLeads([]);
        setSelectedLead(null);
      }
    } catch (e) {
      console.error("Failed to load sales leads:", e);
      setLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    loadLeadsForShowroom(selectedShowroom);
  }, [selectedShowroom]);

  // Handle lead selection - dynamic vehicle extraction from booking
  const handleSelectLead = (lead: TestRideLeadItem) => {
    setSelectedLead(lead);
    setCheckedChecklist({});
    // Dynamic vehicle id directly from booking API
    const vId = lead.vehicle_id || "thar_roxx";
    setTestVehicleId(vId);
    setSelectedVariant(lead.variant || "AX7L Diesel AT 4x4");
    setActiveTab("record");
  };

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
      let base64Audio: string | undefined = undefined;
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const reader = new FileReader();
        base64Audio = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });
      }

      const response = await uploadTestRideRecording({
        customer_id: selectedLead?.customer_id || profile?.customer_id || "CUST-AARAV-001",
        booking_reference: selectedLead?.booking_reference,
        customer_name: selectedLead?.name || profile?.name,
        vehicle_id: testVehicleId,
        variant: selectedVariant,
        sales_advisor_name: selectedLead?.dealership_name ? `Specialist (${selectedLead.dealership_name})` : "Rajesh Varma (Bayview Mahindra)",
        duration_seconds: Math.max(recordingSeconds, 184),
        audio_format: "audio/wav",
        audio_base64: base64Audio,
        simulated_scenario: "test_drive_recording",
        advisor_checklist: selectedLead?.advisor_checklist
      });

      setInsights(response);
      setActiveTab("insights");
    } catch (err) {
      console.error("Error uploading test ride:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const simulateTestDriveRecording = async () => {
    setIsUploading(true);
    setRecordingSeconds(184);

    try {
      const response = await uploadTestRideRecording({
        customer_id: selectedLead?.customer_id || profile?.customer_id || "CUST-AARAV-001",
        booking_reference: selectedLead?.booking_reference,
        customer_name: selectedLead?.name || profile?.name,
        vehicle_id: testVehicleId,
        variant: selectedVariant,
        sales_advisor_name: selectedLead?.dealership_name ? `Specialist (${selectedLead.dealership_name})` : "Rajesh Varma (Bayview Mahindra)",
        duration_seconds: 184,
        audio_format: "audio/wav",
        simulated_scenario: "test_drive_simulation",
        advisor_checklist: selectedLead?.advisor_checklist
      });

      setInsights(response);
      setActiveTab("insights");
    } catch (err) {
      console.error("Error simulating test ride recording:", err);
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

  const activeShowroomName =
    selectedShowroom === "ALL"
      ? "All Regional Dealerships"
      : dealerships.find((d) => d.id === selectedShowroom)?.name || selectedShowroom;

  return (
    <div className="space-y-6">
      {/* Stage Header Banner with Showroom Selector */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-amber-950/80 p-5 rounded-2xl border border-amber-900/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5" />
            Stage 2: Sales Advisor Mobile Companion &amp; Test Ride Recording
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span>Advisor Field App &amp; GCS Audio Insights Engine</span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 max-w-2xl">
            Select a showroom to load verified customer test drive bookings. The advisor companion automatically pulls the customer&apos;s booked vehicle from the database and captures live audio insights.
          </p>

          {/* Showroom Selector Dropdown in Banner */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-black/50 px-3 py-1.5 rounded-xl border border-white/10">
              <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Select Showroom:</span>
              <select
                value={selectedShowroom}
                onChange={(e) => setSelectedShowroom(e.target.value)}
                className="bg-neutral-900 text-white font-bold border border-white/20 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">🏢 All Showrooms ({dealerships.length} Dealerships)</option>
                {dealerships.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name} ({dealer.city})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              {leads.length} Booked Lead{leads.length !== 1 ? "s" : ""} Available
            </span>
          </div>
        </div>

        {insights && (
          <button
            onClick={() => onProceedToOutboundCall(insights)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/40 flex items-center gap-2 shrink-0 cursor-pointer"
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
            <div className="bg-neutral-950 rounded-[32px] overflow-hidden border border-neutral-800 flex flex-col h-[620px] text-xs">
              {/* App Top Bar */}
              <div className="bg-gradient-to-r from-red-950 via-neutral-900 to-black px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[9.5px] text-red-300 font-bold uppercase tracking-wider block">
                    Mahindra Advisor Field App
                  </span>
                  <span className="font-black text-white text-xs truncate max-w-[190px] block">
                    {activeShowroomName}
                  </span>
                </div>
                <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Online
                </span>
              </div>

              {/* Mobile Tabs */}
              <div className="flex border-b border-neutral-800 bg-neutral-900/60 text-[11px]">
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
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                {/* TAB 1: Leads loaded for Selected Showroom */}
                {activeTab === "leads" && (
                  <div className="space-y-3">
                    {/* Showroom filter inside mobile */}
                    <div className="p-2.5 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Showroom Filter
                        </span>
                        <span>{leads.length} Booked</span>
                      </div>
                      <select
                        value={selectedShowroom}
                        onChange={(e) => setSelectedShowroom(e.target.value)}
                        className="w-full bg-black text-white font-bold border border-neutral-700 rounded-lg px-2 py-1 text-[11px] outline-none"
                      >
                        <option value="ALL">All Dealerships</option>
                        {dealerships.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    {isLoadingLeads ? (
                      <div className="py-8 text-center text-neutral-400 space-y-1.5">
                        <RefreshCw className="w-5 h-5 animate-spin text-amber-400 mx-auto" />
                        <p className="text-xs">Loading showroom leads...</p>
                      </div>
                    ) : leads.length === 0 ? (
                      <div className="py-8 text-center text-neutral-400 p-4 bg-neutral-900/40 rounded-2xl border border-neutral-800 space-y-1">
                        <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                        <p className="font-bold text-white text-xs">No bookings for this showroom yet.</p>
                        <p className="text-[10.5px] text-neutral-500">
                          Select &quot;All Dealerships&quot; or book a new test ride in Pre-Sales Showroom.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {leads.map((lead, idx) => {
                          const isSelected = selectedLead?.customer_id === lead.customer_id;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleSelectLead(lead)}
                              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-red-950/40 border-red-500 shadow-md shadow-red-950/40 ring-1 ring-red-500/50"
                                  : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">{lead.name}</span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                                  {lead.booking_status}
                                </span>
                              </div>

                              <p className="text-neutral-400 text-[10px] mt-1 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-red-400" />
                                <span>{lead.phone}</span>
                                {lead.city && <span>• 📍 {lead.city}</span>}
                              </p>

                              {/* Booked Vehicle & Variant */}
                              <div className="mt-2 p-1.5 bg-black/60 rounded-lg border border-white/5 space-y-0.5">
                                <div className="text-amber-300 font-bold text-[10.5px] flex items-center gap-1">
                                  <Car className="w-3 h-3 text-red-400 shrink-0" />
                                  <span className="truncate">{lead.preferred_vehicle}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9.5px] text-neutral-400">
                                  <span>{lead.scheduled_slot}</span>
                                  {lead.booking_reference && (
                                    <span className="font-mono text-cyan-300 font-bold">
                                      {lead.booking_reference}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {lead.booking_type === "HOME_DOORSTEP" && lead.delivery_address && (
                                <div className="mt-1 text-[9.5px] text-emerald-400 truncate">
                                  🏠 Doorstep: {lead.delivery_address}
                                </div>
                              )}

                              {lead.is_custom_checklist && (
                                <div className="mt-1.5 flex items-center gap-1 text-[9px] text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/20">
                                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">AI Pre-Sales Checklist ({lead.advisor_checklist?.length || 0} asks)</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedLead && (
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab("record")}
                          className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/50 cursor-pointer"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Start Test Ride for {selectedLead.name}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Mobile Audio Recording */}
                {activeTab === "record" && (
                  <div className="space-y-3.5">
                    {/* Customer & Booked Vehicle Header */}
                    <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Customer</span>
                        <span className="font-bold text-white">{selectedLead?.name || "Valued Customer"}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Phone</span>
                        <span className="font-mono text-slate-300 text-[11px]">{selectedLead?.phone || "—"}</span>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Test Ride Vehicle</span>
                        <span className="font-black text-amber-400 text-[11px]">
                          {currentVehicleObj?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Booked Variant</span>
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30 font-bold">
                          {selectedVariant}
                        </span>
                      </div>
                    </div>

                    {/* Advisor Demo Checklist picked up dynamically from Database or Static Fallback */}
                    {(() => {
                      const activeChecklist = (selectedLead?.advisor_checklist && selectedLead.advisor_checklist.length > 0)
                        ? selectedLead.advisor_checklist
                        : (currentVehicleObj?.key_highlights && currentVehicleObj.key_highlights.length > 0
                            ? currentVehicleObj.key_highlights.slice(0, 3).map(h => `Demonstrate / Highlight ${h}`)
                            : [
                                "Demonstrate Frequency Selective Damping (FSD) / Ride Pliability",
                                "Showcase Engine / EV Throttle Acceleration & Brake Feel",
                                "Highlight Skyroof, Cockpit Twin Displays & Rear Seat Comfort"
                              ]);
                      const isCustom = selectedLead?.is_custom_checklist ?? (selectedLead?.advisor_checklist && selectedLead.advisor_checklist.length > 0);

                      return (
                        <div className="p-3 bg-neutral-900/80 rounded-2xl border border-neutral-800 text-[10.5px] space-y-2 text-neutral-300">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1 truncate">
                              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" /> Demo Checklist ({currentVehicleObj?.name || "Mahindra SUV"}):
                            </span>
                            {isCustom ? (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-1 shadow-sm">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> AI-Tailored (Database)
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 shrink-0">
                                Static Vehicle Demo
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5 pt-0.5">
                            {activeChecklist.map((item, idx) => {
                              const isChecked = !!checkedChecklist[item];
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleChecklistItem(item)}
                                  className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                                      : "bg-black/40 hover:bg-neutral-800/60 text-neutral-200 border border-white/5"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="mt-0.5 accent-emerald-500 rounded cursor-pointer shrink-0"
                                  />
                                  <span className={`text-[10.5px] leading-snug ${isChecked ? "line-through text-emerald-400/70" : "text-neutral-200"}`}>
                                    {item}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="text-[9px] text-neutral-500 flex items-center justify-between pt-0.5 border-t border-white/5">
                            <span>
                              {Object.values(checkedChecklist).filter(Boolean).length}/{activeChecklist.length} Items Demonstrated
                            </span>
                            <span className="text-[8.5px] text-neutral-400 font-mono">
                              Source: {isCustom ? "Pre-Sales Voice Asks" : "Official Catalog"}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Audio Waveform & Timer Recorder Shell */}
                    <div className="p-4 bg-black rounded-2xl border border-neutral-800 text-center space-y-3">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                        {isRecording ? "🔴 RECORDING IN PROGRESS" : "TEST RIDE AUDIO CAPTURE"}
                      </div>

                      {/* Timer Display */}
                      <div className="text-3xl font-black font-mono text-white tracking-widest">
                        {formatTime(recordingSeconds)}
                      </div>

                      {/* Animated Audio Waveform */}
                      <div className="h-10 flex items-center justify-center gap-1 px-4">
                        {[4, 10, 18, 28, 14, 34, 22, 12, 30, 20, 8, 24, 16, 6].map((h, i) => (
                          <span
                            key={i}
                            className={`w-1 rounded-full transition-all duration-150 ${
                              isRecording && !isPaused ? "bg-red-500 animate-pulse" : "bg-neutral-800"
                            }`}
                            style={{
                              height: isRecording && !isPaused ? `${h * 1.1}px` : "6px",
                              animationDelay: `${i * 60}ms`
                            }}
                          ></span>
                        ))}
                      </div>

                      {/* Recording Controls */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {!isRecording ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
                            <button
                              onClick={startRecording}
                              className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 cursor-pointer transition-all hover:scale-102"
                            >
                              <Mic className="w-4 h-4" />
                              <span>Start Ride Recording</span>
                            </button>

                            <button
                              onClick={simulateTestDriveRecording}
                              disabled={isUploading}
                              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-cyan-700 hover:from-purple-600 hover:to-cyan-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer transition-all hover:scale-102 disabled:opacity-50"
                            >
                              <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
                              <span>Simulate Test Drive Recording</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            {isPaused ? (
                              <button
                                onClick={resumeRecording}
                                className="p-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-full cursor-pointer"
                                title="Resume"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={pauseRecording}
                                className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full border border-neutral-700 cursor-pointer"
                                title="Pause"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={stopAndProcessRecording}
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-red-950/50 cursor-pointer"
                            >
                              <Square className="w-3.5 h-3.5" />
                              <span>Stop &amp; Upload to GCS</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {isUploading && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-center space-y-1">
                        <UploadCloud className="w-5 h-5 animate-bounce mx-auto" />
                        <p className="font-bold text-xs">Uploading Audio to Cloud Storage &amp; Analyzing...</p>
                        <p className="text-[10px] text-neutral-400">Executing Multi-Dimensional Speech &amp; Sentiment AI</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: AI Insights */}
                {activeTab === "insights" && (
                  <div className="space-y-3 text-left">
                    {insights ? (
                      <>
                        <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white truncate">{insights.vehicle_name}</span>
                            <span className="font-mono text-emerald-400 font-bold shrink-0">
                              {Math.round(insights.purchase_intent_score * 100)}% Intent
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/60 border border-white/5 space-y-1">
                            <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block">GCS Audio Storage:</span>
                            <div className="font-mono text-[9px] text-neutral-300 break-all select-all">
                              {insights.gcs_uri}
                            </div>
                          </div>
                        </div>

                        {/* Speaker Identified Test Ride Transcript */}
                        <div className="p-3 rounded-2xl bg-black/80 border border-neutral-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                              <Volume2 className="w-3 h-3 text-purple-400" /> Test Ride Audio Transcript:
                            </span>
                            <span className="text-[9px] font-mono text-neutral-500">{insights.duration_seconds}s</span>
                          </div>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto text-[10px] font-mono pr-1">
                            {insights.transcript.split("\n").map((line, idx) => {
                              if (!line.trim()) return null;
                              const isAdv = line.toLowerCase().includes("advisor");
                              return (
                                <div
                                  key={idx}
                                  className={`p-1.5 rounded-lg border leading-relaxed ${
                                    isAdv
                                      ? "bg-purple-950/20 border-purple-800/30 text-purple-200"
                                      : "bg-cyan-950/20 border-cyan-800/30 text-cyan-200"
                                  }`}
                                >
                                  {line}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase">Loved Features:</span>
                          <ul className="text-[10px] text-neutral-300 list-disc pl-4 space-y-0.5">
                            {insights.loved_features.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                          <span className="text-[10px] font-bold text-amber-400 uppercase">Objections Raised:</span>
                          <ul className="text-[10px] text-neutral-300 list-disc pl-4 space-y-0.5">
                            {insights.objections_raised.map((o, i) => (
                              <li key={i}>{o}</li>
                            ))}
                          </ul>
                        </div>

                        {onProceedToOutboundCall && (
                          <button
                            onClick={() => onProceedToOutboundCall(insights)}
                            className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/50 cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Proceed to Outbound Call (Stage 3)</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="py-8 text-center text-neutral-400">
                        <AlertCircle className="w-6 h-6 text-neutral-600 mx-auto mb-1" />
                        <p>Complete a test drive recording first to generate AI insights.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Detailed In-Vehicle Test Ride Audio & Insights Panel */}
        <div className="lg:col-span-7 space-y-4 text-left">
          {/* Active Vehicle Card (From Booking API) */}
          <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 font-mono text-[10px] font-bold uppercase">
                  Active Test Ride Vehicle
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-bold">
                  {selectedLead?.booking_reference || "LIVE BOOKING"}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{currentVehicleObj.name}</h3>
              <p className="text-xs text-amber-300 font-bold">
                Variant: {selectedVariant} • Showroom: {selectedLead?.dealership_name || activeShowroomName}
              </p>
              <p className="text-[11px] text-neutral-400">
                Customer: <strong>{selectedLead?.name || "Aarav Sharma"}</strong> ({selectedLead?.phone || "+91 98201 23456"})
              </p>
            </div>

            {/* Vehicle Image */}
            <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0">
              <img
                src={
                  currentVehicleObj.hero_image ||
                  currentVehicleObj.image_url ||
                  `/assets/${currentVehicleObj.id.replace("_", "-")}.jpg`
                }
                alt={currentVehicleObj.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/assets/thar-roxx.jpg";
                }}
              />
            </div>
          </div>

          {/* AI Insights & Audio STT Transcript Details */}
          {insights ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Score Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">Customer Sentiment</span>
                  <p className="text-xl font-black text-emerald-400 mt-1">
                    {Math.round(insights.customer_sentiment_score * 100)}% Positive
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">Purchase Intent</span>
                  <p className="text-xl font-black text-cyan-400 mt-1">
                    {Math.round(insights.purchase_intent_score * 100)}% Ready
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">Advisor Pitch Score</span>
                  <p className="text-xl font-black text-amber-400 mt-1">
                    {insights.advisor_pitch_score} / 10
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 uppercase font-bold">GCS Storage Status</span>
                  <p className="text-xs font-mono font-bold text-purple-400 mt-2 truncate">
                    Uploaded (GCS)
                  </p>
                </div>
              </div>

              {/* Full In-Vehicle Transcript Box */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-400" />
                    <span>In-Vehicle Test Ride Audio STT Transcript (Multi-Turn)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Duration: {insights.duration_seconds}s
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-black/70 border border-neutral-800 text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                  {insights.transcript}
                </div>
              </div>

              {/* GCS URI Card */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">GCS Cloud Storage Audio Path:</span>
                  <p className="font-mono text-xs text-neutral-300 break-all select-all mt-0.5">{insights.gcs_uri}</p>
                </div>
                <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                  WAV 16kHz
                </span>
              </div>

              {/* Loved Features & Objections Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1">
                    ✓ Loved Features ({insights.loved_features.length})
                  </span>
                  <ul className="text-xs text-neutral-300 space-y-1 list-disc pl-4">
                    {insights.loved_features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1">
                    ⚠ Objections & Concerns ({insights.objections_raised.length})
                  </span>
                  <ul className="text-xs text-neutral-300 space-y-1 list-disc pl-4">
                    {insights.objections_raised.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coaching Feedback & Next Action */}
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span>AI Coaching Feedback for Sales Advisor:</span>
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {insights.advisor_coaching_feedback}
                </p>
                <div className="pt-2 border-t border-purple-800/30 text-xs text-amber-300 font-semibold">
                  Recommended Follow-up: {insights.recommended_action}
                </div>
              </div>

              {onProceedToOutboundCall && (
                <div className="pt-2">
                  <button
                    onClick={() => onProceedToOutboundCall(insights)}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-950/60 transition-all hover:scale-101 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Proceed to Proactive Outbound Call Simulator (Stage 3)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Ready for Test Ride Audio Capture</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Select a customer lead on the mobile phone interface, tap &quot;Start Ride Recording&quot; to begin in-cabin audio recording, and upload to GCS to generate STT transcript and buyer sentiment analytics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
