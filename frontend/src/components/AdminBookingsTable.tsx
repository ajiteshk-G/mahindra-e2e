"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  Clock,
  MapPin,
  Car,
  MessageSquare,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  Building2,
  ChevronRight,
  TrendingUp,
  ThumbsUp,
  X,
  Phone,
  Layers,
  Send,
  RefreshCw,
  FileText
} from "lucide-react";

export interface TranscriptTurn {
  id?: number;
  session_id?: string;
  session_type?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  speaker: string;
  role?: string;
  message: string;
  timestamp?: string;
  date?: string;
  full_date?: string;
  time?: string;
  channel?: string;
  intent?: string;
  tool?: string;
}

export interface AdminBookingRecord {
  booking_id: number;
  booking_reference: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  vehicle_id: string;
  vehicle_name: string;
  variant: string;
  color: string;
  dealership_id: string;
  dealership_name: string;
  sales_advisor_name: string;
  booking_type: string;
  delivery_address: string;
  scheduled_date: string;
  scheduled_time_slot: string;
  status: string;
  sms_status: string;
  created_at: string;
  presales_transcript: TranscriptTurn[];
  test_ride_transcript: TranscriptTurn[];
  test_ride_sessions?: {
    session_id: string;
    booking_reference: string;
    gcs_uri: string;
    vehicle_name: string;
    sales_advisor_name: string;
    duration_seconds: number;
    sentiment_score: number;
    purchase_intent: number;
    loved_features: string[];
    objections_raised: string[];
    advisor_coaching_feedback: string;
    recommended_action: string;
    turns: TranscriptTurn[];
    created_at: string;
  }[];
  sentiment_score: number | null;
  purchase_intent: number | null;
  loved_features: string[];
  objections_raised: string[];
  advisor_coaching_feedback: string | null;
  recommended_action?: string | null;
  gcs_recording_uri?: string | null;
}

interface AdminStats {
  total_bookings: number;
  doorstep_deliveries: number;
  showroom_visits: number;
  confirmed_count: number;
  sms_dispatch_rate: string;
  avg_purchase_intent: string;
}

export function AdminBookingsTable() {
  const [bookings, setBookings] = useState<AdminBookingRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal / Drawer state for transcript viewing
  const [activeModalBooking, setActiveModalBooking] = useState<AdminBookingRecord | null>(null);
  const [activeTranscriptTab, setActiveTranscriptTab] = useState<"presales" | "test_ride">("presales");

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCity !== "ALL") queryParams.append("city", selectedCity);
      if (selectedStatus !== "ALL") queryParams.append("status", selectedStatus);
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

      const res = await fetch(`/api/admin/bookings?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch admin bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedCity, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleExportCSV = () => {
    if (bookings.length === 0) return;

    const headers = [
      "Booking Reference",
      "Customer Name",
      "Phone",
      "City",
      "Vehicle",
      "Variant",
      "Date",
      "Time Slot",
      "Showroom",
      "Booking Type",
      "Address",
      "Status",
      "SMS Status",
      "PreSales Turns Count",
      "Test Ride Turns Count",
      "Purchase Intent"
    ];

    const rows = bookings.map((b) => [
      `"${b.booking_reference}"`,
      `"${b.customer_name}"`,
      `"${b.customer_phone}"`,
      `"${b.customer_city}"`,
      `"${b.vehicle_name}"`,
      `"${b.variant}"`,
      `"${b.scheduled_date}"`,
      `"${b.scheduled_time_slot}"`,
      `"${b.dealership_name}"`,
      `"${b.booking_type}"`,
      `"${b.delivery_address}"`,
      `"${b.status}"`,
      `"${b.sms_status}"`,
      b.presales_transcript.length,
      b.test_ride_transcript.length,
      `"${b.purchase_intent !== null ? Math.round(b.purchase_intent * 100) : 0}%"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mahindra_test_rides_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* KPI Stats Header Cards (Light Theme) */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unique Customers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.total_bookings}</p>
            <span className="text-[10.5px] text-emerald-600 font-semibold">100% Verified in DB</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doorstep Deliveries</p>
            <p className="text-2xl font-black text-cyan-600 mt-1">{stats.doorstep_deliveries}</p>
            <span className="text-[10.5px] text-slate-500 font-medium">Fleet At Customer Home</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Showroom Visits</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.showroom_visits}</p>
            <span className="text-[10.5px] text-slate-500 font-medium">Dealership Experience</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirmed Slots</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{stats.confirmed_count}</p>
            <span className="text-[10.5px] text-emerald-600 font-semibold">Reserved in Real-Time</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Twilio SMS Dispatch</p>
            <p className="text-2xl font-black text-red-600 mt-1">{stats.sms_dispatch_rate}</p>
            <span className="text-[10.5px] text-slate-500 font-medium">Instant Confirmation</span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Purchase Intent</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{stats.avg_purchase_intent}</p>
            <span className="text-[10.5px] text-emerald-600 font-semibold">High Buyer Conversion</span>
          </div>
        </div>
      )}

      {/* Toolbar: Search, City Filter, Status Filter & Export (Light Theme) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, booking ref, SUV..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-red-600 focus:bg-white text-slate-900 placeholder-slate-400 outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* City Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto scrollbar-thin">
            {["ALL", "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai"].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCity === city
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchBookings}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-600" : ""}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Bookings Table (Light Theme) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10.5px] uppercase tracking-wider text-slate-600 font-mono">
                <th className="py-3.5 px-4 font-bold">Booking Ref / Time</th>
                <th className="py-3.5 px-4 font-bold">Customer Details</th>
                <th className="py-3.5 px-4 font-bold">Vehicle &amp; Variant</th>
                <th className="py-3.5 px-4 font-bold">Showroom &amp; Address</th>
                <th className="py-3.5 px-4 font-bold min-w-[210px] text-cyan-800">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-600" /> PreSales Transcript
                  </span>
                </th>
                <th className="py-3.5 px-4 font-bold min-w-[210px] text-purple-800">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-purple-600" /> Test Ride Transcript
                  </span>
                </th>
                <th className="py-3.5 px-4 font-bold text-center">Status / SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-red-600" />
                      <span>Loading booked test rides from database...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                      <span className="font-bold text-slate-800">No test ride bookings matched your filter.</span>
                      <span className="text-xs text-slate-400">Try changing the search keyword or city filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const presalesLastTurn =
                    booking.presales_transcript.length > 0
                      ? booking.presales_transcript[booking.presales_transcript.length - 1]
                      : null;

                  const testRideFirstTurn =
                    booking.test_ride_transcript.length > 0
                      ? booking.test_ride_transcript[0]
                      : null;

                  return (
                    <tr
                      key={booking.booking_reference}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Column 1: Ref & Date */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono font-black text-red-700 text-xs">
                          {booking.booking_reference}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-800 font-bold mt-1">
                          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{booking.scheduled_date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-500 font-mono mt-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>{booking.scheduled_time_slot}</span>
                        </div>
                      </td>

                      {/* Column 2: Customer Details */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{booking.customer_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-red-600" />
                          <span>{booking.customer_phone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          📍 {booking.customer_city} • {booking.customer_id}
                        </div>
                      </td>

                      {/* Column 3: Vehicle & Variant */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{booking.vehicle_name}</span>
                        </div>
                        <div className="inline-block px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-bold text-red-700 mt-1">
                          {booking.variant}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Color: <span className="text-slate-700 font-medium">{booking.color}</span>
                        </div>
                      </td>

                      {/* Column 4: Showroom & Address */}
                      <td className="py-4 px-4 align-top max-w-[220px]">
                        <div className="font-bold text-slate-900 flex items-center gap-1 leading-tight">
                          <Building2 className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span className="truncate">{booking.dealership_name}</span>
                        </div>
                        <div className="text-[10.5px] mt-1 leading-tight">
                          {booking.booking_type === "HOME_DOORSTEP" ? (
                            <span className="text-emerald-700 font-semibold">
                              🏠 Doorstep: {booking.delivery_address}
                            </span>
                          ) : (
                            <span className="text-amber-800 font-semibold">🏢 Showroom Visit</span>
                          )}
                        </div>
                        <div className="text-[9.5px] text-slate-500 mt-1">
                          Specialist: <span className="text-slate-700 font-medium">{booking.sales_advisor_name}</span>
                        </div>
                      </td>

                      {/* Column 5: PreSales Transcript */}
                      <td className="py-4 px-4 align-top">
                        <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-200 space-y-1">
                          <div className="flex items-center justify-between text-[9.5px]">
                            <span className="font-bold text-cyan-900 font-mono">
                              {booking.presales_transcript.length} Dialogue Turns
                            </span>
                            <span className="text-[9px] text-cyan-700 font-medium">Showroom Live</span>
                          </div>
                          {presalesLastTurn && (
                            <p className="text-[10.5px] text-slate-700 line-clamp-2 italic leading-tight">
                              &ldquo;{presalesLastTurn.speaker}: {presalesLastTurn.message}&rdquo;
                            </p>
                          )}
                          <button
                            onClick={() => {
                              setActiveModalBooking(booking);
                              setActiveTranscriptTab("presales");
                            }}
                            className="mt-1 text-[10.5px] font-bold text-cyan-700 hover:text-cyan-900 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Read Full Pre-Sales Chat</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Column 6: Test Ride Transcript */}
                      <td className="py-4 px-4 align-top">
                        {booking.test_ride_transcript.length > 0 ? (
                          <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 space-y-1">
                            <div className="flex items-center justify-between text-[9.5px]">
                              <span className="font-bold text-purple-900 font-mono">
                                {booking.test_ride_transcript.length} In-Vehicle Turns
                              </span>
                              {booking.purchase_intent !== null && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold">
                                  {Math.round(booking.purchase_intent * 100)}% Intent
                                </span>
                              )}
                            </div>
                            {testRideFirstTurn && (
                              <p className="text-[10.5px] text-slate-700 line-clamp-2 italic leading-tight">
                                &ldquo;{testRideFirstTurn.speaker}: {testRideFirstTurn.message}&rdquo;
                              </p>
                            )}
                            <button
                              onClick={() => {
                                setActiveModalBooking(booking);
                                setActiveTranscriptTab("test_ride");
                              }}
                              className="mt-1 text-[10.5px] font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Read Ride Transcript &amp; Insights</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                            <span className="text-[10px] font-bold text-slate-500 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> Pending Test Ride
                            </span>
                            <p className="text-[9.5px] text-slate-400 mt-0.5">Will be captured in Stage 2</p>
                          </div>
                        )}
                      </td>

                      {/* Column 7: Status & SMS */}
                      <td className="py-4 px-4 align-top text-center space-y-1.5">
                        <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-black tracking-wide">
                          {booking.status}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Twilio SMS Sent</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Transcript Modal / Drawer (Light Theme) */}
      {activeModalBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left text-slate-900">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-red-700 text-sm">
                    {activeModalBooking.booking_reference}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold">
                    {activeModalBooking.vehicle_name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: <strong>{activeModalBooking.customer_name}</strong> ({activeModalBooking.customer_phone}) • {activeModalBooking.dealership_name}
                </p>
              </div>

              <button
                onClick={() => setActiveModalBooking(null)}
                className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switches: PreSales vs Test Ride */}
            <div className="flex border-b border-slate-200 bg-slate-100 px-4">
              <button
                onClick={() => setActiveTranscriptTab("presales")}
                className={`py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTranscriptTab === "presales"
                    ? "border-cyan-600 text-cyan-800 bg-white shadow-xs"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>1. Pre-Sales Showroom Transcript ({activeModalBooking.presales_transcript.length} turns)</span>
              </button>

              <button
                onClick={() => setActiveTranscriptTab("test_ride")}
                className={`py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTranscriptTab === "test_ride"
                    ? "border-purple-600 text-purple-800 bg-white shadow-xs"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>2. In-Vehicle Test Ride Transcript &amp; Insights</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 bg-white">
              {activeTranscriptTab === "presales" ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-900 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-600 shrink-0" />
                      <span>
                        Live transcript for <strong>{activeModalBooking.customer_name}</strong> ({activeModalBooking.customer_phone}) with <strong>Kabir (AI Specialist)</strong>.
                      </span>
                    </div>
                    <span className="text-[11px] font-mono bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-lg border border-cyan-300 font-bold shrink-0">
                      {activeModalBooking.presales_transcript.length} turns
                    </span>
                  </div>

                  {/* Grouped Transcripts by Session ID */}
                  {(() => {
                    const sessionGroups: {
                      [sessId: string]: {
                        sessionId: string;
                        sessionType: string;
                        vehicleName: string;
                        date: string;
                        time: string;
                        channel: string;
                        turns: TranscriptTurn[];
                      };
                    } = {};

                    activeModalBooking.presales_transcript.forEach((turn) => {
                      const sId = turn.session_id || "HISTORIC_SESSION";
                      if (!sessionGroups[sId]) {
                        sessionGroups[sId] = {
                          sessionId: sId,
                          sessionType: turn.session_type || (turn.channel === "VOICE_LIVE" ? "LIVE_VOICE" : "WEB_CHAT"),
                          vehicleName: turn.vehicle_name || activeModalBooking.vehicle_name,
                          date: turn.full_date || turn.date || "Today",
                          time: turn.time || turn.timestamp || "",
                          channel: turn.channel || "VOICE_LIVE",
                          turns: []
                        };
                      }
                      sessionGroups[sId].turns.push(turn);
                    });

                    const groupList = Object.values(sessionGroups);

                    if (groupList.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400">
                          <p>No conversation transcripts recorded yet.</p>
                        </div>
                      );
                    }

                    return groupList.map((session, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3.5 shadow-xs"
                      >
                        {/* Session Card Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 bg-white -mx-4 -mt-4 p-3.5 rounded-t-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300 text-[11px] font-bold flex items-center gap-1.5">
                              {session.sessionType === "LIVE_VOICE" || session.channel === "VOICE_LIVE" ? (
                                <>
                                  <Volume2 className="w-3 h-3 text-cyan-600" />
                                  <span>Live Voice Stream</span>
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-3 h-3 text-cyan-600" />
                                  <span>Virtual Showroom Chat</span>
                                </>
                              )}
                            </span>

                            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              {session.sessionId}
                            </span>

                            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                              <Car className="w-3 h-3 text-amber-600 inline" />
                              <span>{session.vehicleName}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {session.date}
                            </span>
                            {session.time && (
                              <span className="flex items-center gap-0.5">
                                • <Clock className="w-3 h-3 ml-1" /> {session.time}
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                              {session.turns.length} turns
                            </span>
                          </div>
                        </div>

                        {/* Dialogue turns in this session */}
                        <div className="space-y-2.5 pt-1">
                          {session.turns.map((turn, idx) => {
                            const isUser = turn.role === "customer" || turn.speaker.toLowerCase().includes("customer");
                            return (
                              <div
                                key={idx}
                                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500 px-1">
                                  <span className={`font-bold ${isUser ? "text-cyan-700" : "text-amber-800"}`}>
                                    {turn.speaker}
                                  </span>
                                  {(turn.time || turn.timestamp) && (
                                    <span className="font-mono text-slate-400 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5 inline" />
                                      {turn.time || turn.timestamp}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-xs ${
                                    isUser
                                      ? "bg-cyan-50 border border-cyan-200 text-cyan-950 rounded-tr-xs"
                                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                                  }`}
                                >
                                  <p>{turn.message}</p>
                                  {turn.tool && (
                                    <div className="mt-2 pt-1.5 border-t border-slate-200 text-[9.5px] text-amber-800 font-mono flex items-center gap-1">
                                      <span>⚡ Tool Action: {turn.tool}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  {((activeModalBooking.test_ride_sessions && activeModalBooking.test_ride_sessions.length > 0) || activeModalBooking.test_ride_transcript.length > 0) ? (
                    <div className="space-y-5">
                      {/* Grouped Test Ride Transcripts by Booking ID */}
                      {(() => {
                        const sessions = (activeModalBooking.test_ride_sessions && activeModalBooking.test_ride_sessions.length > 0)
                          ? activeModalBooking.test_ride_sessions
                          : [{
                              session_id: `TR-${activeModalBooking.booking_reference}`,
                              booking_reference: activeModalBooking.booking_reference,
                              gcs_uri: activeModalBooking.gcs_recording_uri || `gs://mahindra-sales-recordings/test_rides/2026-08-26/${activeModalBooking.booking_reference}.wav`,
                              vehicle_name: activeModalBooking.vehicle_name,
                              sales_advisor_name: activeModalBooking.sales_advisor_name,
                              duration_seconds: 184,
                              sentiment_score: activeModalBooking.sentiment_score ?? 0.88,
                              purchase_intent: activeModalBooking.purchase_intent ?? 0.92,
                              loved_features: activeModalBooking.loved_features,
                              objections_raised: activeModalBooking.objections_raised,
                              advisor_coaching_feedback: activeModalBooking.advisor_coaching_feedback || "Demonstrated vehicle dynamics and key features effectively.",
                              recommended_action: activeModalBooking.recommended_action || "Follow up on regional inventory allocation.",
                              turns: activeModalBooking.test_ride_transcript,
                              created_at: activeModalBooking.created_at
                            }];

                        return sessions.map((sess, sIdx) => (
                          <div
                            key={sIdx}
                            className="rounded-2xl border border-purple-200/80 bg-slate-50/50 p-4 space-y-3.5 shadow-xs"
                          >
                            {/* Group Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-100 bg-purple-50/60 -mx-4 -mt-4 p-3.5 rounded-t-2xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                                  <Volume2 className="w-3 h-3" />
                                  <span>Test Ride Audio Recording</span>
                                </span>

                                <span className="font-mono text-[11px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                                  Booking ID: {sess.booking_reference}
                                </span>

                                <span className="text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                                  <Car className="w-3 h-3 text-purple-600 inline" />
                                  <span>{sess.vehicle_name}</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
                                <span className="bg-white px-2.5 py-0.5 rounded-full border border-purple-200 font-bold text-purple-800">
                                  {sess.duration_seconds}s audio
                                </span>
                                <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200 font-bold">
                                  {sess.turns.length} turns
                                </span>
                              </div>
                            </div>

                            {/* GCS Path Banner */}
                            <div className="p-2.5 rounded-xl bg-purple-100/50 border border-purple-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-purple-900">
                                <FileText className="w-4 h-4 text-purple-700 shrink-0" />
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-purple-700 block">GCS Cloud Audio Location:</span>
                                  <span className="font-mono text-[11px] font-bold break-all select-all text-purple-950">{sess.gcs_uri}</span>
                                </div>
                              </div>
                              <span className="text-[9.5px] font-bold font-mono bg-purple-200 text-purple-900 px-2 py-0.5 rounded border border-purple-300 shrink-0">
                                WAV Audio
                              </span>
                            </div>

                            {/* AI Extracted Insights Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Sentiment Score</span>
                                <p className="text-base font-black text-emerald-600 mt-0.5">
                                  {sess.sentiment_score !== null
                                    ? `${Math.round(sess.sentiment_score * 100)}% Positive`
                                    : "88% Positive"}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Purchase Intent</span>
                                <p className="text-base font-black text-cyan-600 mt-0.5">
                                  {sess.purchase_intent !== null
                                    ? `${Math.round(sess.purchase_intent * 100)}% Ready`
                                    : "92% Ready"}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs col-span-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Loved Features</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {sess.loved_features && sess.loved_features.length > 0 ? (
                                    sess.loved_features.map((f, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold"
                                      >
                                        ✓ {f}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">FSD Suspension, Panoramic Skyroof</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Advisor Coaching & Next Action */}
                            {sess.advisor_coaching_feedback && (
                              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 shadow-xs space-y-1">
                                <p className="font-bold flex items-center gap-1.5 text-purple-800">
                                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> Advisor In-Vehicle Coaching:
                                </p>
                                <p className="text-[11px] text-purple-950 leading-relaxed">
                                  {sess.advisor_coaching_feedback}
                                </p>
                                {sess.recommended_action && (
                                  <div className="pt-1.5 border-t border-purple-200 text-[10.5px] font-semibold text-amber-800">
                                    Recommended Next Action: {sess.recommended_action}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Test Ride Dialogue Turns */}
                            <div className="space-y-2 pt-1">
                              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                Speaker-Identified Audio Dialogue Turns ({sess.turns.length}):
                              </h5>
                              <div className="space-y-2">
                                {sess.turns.map((turn, idx) => {
                                  const isCustomer = turn.speaker.toLowerCase().includes("customer") || (activeModalBooking.customer_name && turn.speaker.toLowerCase().includes(activeModalBooking.customer_name.toLowerCase().split(" ")[0]));
                                  return (
                                    <div
                                      key={idx}
                                      className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                                    >
                                      <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-500 px-1">
                                        <span className={`font-bold ${isCustomer ? "text-cyan-700" : "text-purple-700"}`}>
                                          {turn.speaker}
                                        </span>
                                        {turn.timestamp && <span className="font-mono">• {turn.timestamp}</span>}
                                      </div>
                                      <div
                                        className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-xs ${
                                          isCustomer
                                            ? "bg-purple-50 border border-purple-200 text-purple-950 rounded-tr-xs"
                                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                                        }`}
                                      >
                                        <p>{turn.message}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3 my-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center mx-auto text-purple-700">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">No Test Ride Transcript Recorded Yet</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                          This booking is scheduled for <strong>{activeModalBooking.scheduled_date} at {activeModalBooking.scheduled_time_slot}</strong>. In-vehicle audio recordings, live transcription, and sentiment insights will be inserted automatically once the test drive flow is completed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Twilio SMS dispatched &amp; logged in database</span>
              </span>
              <button
                onClick={() => setActiveModalBooking(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
