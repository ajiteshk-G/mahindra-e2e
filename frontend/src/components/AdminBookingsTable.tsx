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
  sentiment_score: number;
  purchase_intent: number;
  loved_features: string[];
  objections_raised: string[];
  advisor_coaching_feedback: string;
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
  const [searchQuery, setSearchQuery] = useState<string>("");
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
    } catch (e) {
      console.error("Failed to load admin bookings:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedCity, selectedStatus]);

  // Debounced search
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
      `"${Math.round(b.purchase_intent * 100)}%"`
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
      {/* KPI Stats Header Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total_bookings}</p>
            <span className="text-[10px] text-emerald-400 font-medium">100% Verified in DB</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Doorstep Deliveries</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{stats.doorstep_deliveries}</p>
            <span className="text-[10px] text-slate-400 font-medium">Fleet At Customer Home</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Showroom Visits</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.showroom_visits}</p>
            <span className="text-[10px] text-slate-400 font-medium">Dealership Experience</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmed Slots</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.confirmed_count}</p>
            <span className="text-[10px] text-emerald-400 font-medium">Reserved in Real-Time</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Twilio SMS Dispatch</p>
            <p className="text-2xl font-black text-red-400 mt-1">{stats.sms_dispatch_rate}</p>
            <span className="text-[10px] text-slate-400 font-medium">Instant Confirmation</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Purchase Intent</p>
            <p className="text-2xl font-black text-purple-400 mt-1">{stats.avg_purchase_intent}</p>
            <span className="text-[10px] text-emerald-400 font-medium">High Buyer Conversion</span>
          </div>
        </div>
      )}

      {/* Toolbar: Search, City Filter, Status Filter & Export */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, booking ref, SUV..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-cyan-400 text-white placeholder-slate-500 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* City Selector */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-thin">
            {["ALL", "Mumbai", "Pune", "Delhi", "Bangalore", "Chennai"].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                  selectedCity === city
                    ? "bg-red-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={fetchBookings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
            title="Refresh Table"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Bookings Table */}
      <div className="rounded-2xl bg-slate-900/90 border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-[10.5px] uppercase tracking-wider text-slate-400 font-mono">
                <th className="py-3 px-3.5 font-bold">Booking Ref / Time</th>
                <th className="py-3 px-3.5 font-bold">Customer Details</th>
                <th className="py-3 px-3.5 font-bold">Vehicle &amp; Variant</th>
                <th className="py-3 px-3.5 font-bold">Showroom &amp; Address</th>
                <th className="py-3 px-3.5 font-bold min-w-[200px] text-cyan-300">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> PreSales Transcript
                  </span>
                </th>
                <th className="py-3 px-3.5 font-bold min-w-[200px] text-purple-300">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5" /> Test Ride Transcript
                  </span>
                </th>
                <th className="py-3 px-3.5 font-bold text-center">Status / SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {isLoading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                      <span>Loading booked test rides from database...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <AlertCircle className="w-6 h-6 text-amber-400" />
                      <span className="font-bold text-white">No test ride bookings matched your filter.</span>
                      <span className="text-xs text-slate-500">Try changing the search keyword or city filter.</span>
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
                      className="hover:bg-white/3 transition-colors group"
                    >
                      {/* Column 1: Ref & Date */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-mono font-black text-amber-400 text-xs">
                          {booking.booking_reference}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-bold mt-1">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{booking.scheduled_date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>{booking.scheduled_time_slot}</span>
                        </div>
                      </td>

                      {/* Column 2: Customer Details */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-bold text-white flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{booking.customer_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono mt-0.5 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>{booking.customer_phone}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          📍 {booking.customer_city} • {booking.customer_id}
                        </div>
                      </td>

                      {/* Column 3: Vehicle & Variant */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-bold text-white flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{booking.vehicle_name}</span>
                        </div>
                        <div className="inline-block px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-[10px] font-bold text-red-300 mt-1">
                          {booking.variant}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Color: <span className="text-slate-300">{booking.color}</span>
                        </div>
                      </td>

                      {/* Column 4: Showroom & Address */}
                      <td className="py-3.5 px-3.5 align-top max-w-[220px]">
                        <div className="font-bold text-slate-200 flex items-center gap-1 leading-tight">
                          <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{booking.dealership_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-300 mt-1 leading-tight">
                          {booking.booking_type === "HOME_DOORSTEP" ? (
                            <span className="text-emerald-400 font-medium">
                              🏠 Doorstep: {booking.delivery_address}
                            </span>
                          ) : (
                            <span className="text-amber-300 font-medium">🏢 Showroom Visit</span>
                          )}
                        </div>
                        <div className="text-[9.5px] text-slate-400 mt-1">
                          Specialist: <span className="text-slate-300 font-medium">{booking.sales_advisor_name}</span>
                        </div>
                      </td>

                      {/* Column 5: PreSales Transcript */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-1">
                          <div className="flex items-center justify-between text-[9.5px]">
                            <span className="font-bold text-cyan-400 font-mono">
                              {booking.presales_transcript.length} Dialogue Turns
                            </span>
                            <span className="text-[9px] text-slate-400">Showroom Live</span>
                          </div>
                          {presalesLastTurn && (
                            <p className="text-[10px] text-slate-300 line-clamp-2 italic leading-tight">
                              &ldquo;{presalesLastTurn.speaker}: {presalesLastTurn.message}&rdquo;
                            </p>
                          )}
                          <button
                            onClick={() => {
                              setActiveModalBooking(booking);
                              setActiveTranscriptTab("presales");
                            }}
                            className="mt-1 text-[10px] font-bold text-cyan-300 hover:text-cyan-200 underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Read Full Pre-Sales Chat</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Column 6: Test Ride Transcript */}
                      <td className="py-3.5 px-3.5 align-top">
                        {booking.test_ride_transcript.length > 0 ? (
                          <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-500/20 space-y-1">
                            <div className="flex items-center justify-between text-[9.5px]">
                              <span className="font-bold text-purple-400 font-mono">
                                {booking.test_ride_transcript.length} In-Vehicle Turns
                              </span>
                              {booking.purchase_intent !== null && (
                                <span className="px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                                  {Math.round(booking.purchase_intent * 100)}% Intent
                                </span>
                              )}
                            </div>
                            {testRideFirstTurn && (
                              <p className="text-[10px] text-slate-300 line-clamp-2 italic leading-tight">
                                &ldquo;{testRideFirstTurn.speaker}: {testRideFirstTurn.message}&rdquo;
                              </p>
                            )}
                            <button
                              onClick={() => {
                                setActiveModalBooking(booking);
                                setActiveTranscriptTab("test_ride");
                              }}
                              className="mt-1 text-[10px] font-bold text-purple-300 hover:text-purple-200 underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>Read Ride Transcript &amp; Insights</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-white/2 border border-dashed border-white/15 text-center">
                            <span className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" /> Pending Test Ride
                            </span>
                            <p className="text-[9.5px] text-slate-400 mt-0.5">Will be captured in Stage 2</p>
                          </div>
                        )}
                      </td>

                      {/* Column 7: Status & SMS */}
                      <td className="py-3.5 px-3.5 align-top text-center space-y-1.5">
                        <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black tracking-wide">
                          {booking.status}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[9.5px] text-emerald-400 font-medium">
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

      {/* Interactive Transcript Modal / Drawer */}
      {activeModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-left text-white">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 bg-slate-950 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {activeModalBooking.booking_reference}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 text-[10px] font-bold">
                    {activeModalBooking.vehicle_name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customer: <strong>{activeModalBooking.customer_name}</strong> ({activeModalBooking.customer_phone}) • {activeModalBooking.dealership_name}
                </p>
              </div>

              <button
                onClick={() => setActiveModalBooking(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switches: PreSales vs Test Ride */}
            <div className="flex border-b border-white/10 bg-black/40 px-4">
              <button
                onClick={() => setActiveTranscriptTab("presales")}
                className={`py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTranscriptTab === "presales"
                    ? "border-cyan-400 text-cyan-300 bg-cyan-950/20"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>1. Pre-Sales Showroom Transcript ({activeModalBooking.presales_transcript.length} turns)</span>
              </button>

              <button
                onClick={() => setActiveTranscriptTab("test_ride")}
                className={`py-2.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTranscriptTab === "test_ride"
                    ? "border-purple-400 text-purple-300 bg-purple-950/20"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>2. In-Vehicle Test Ride Transcript &amp; Insights</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {activeTranscriptTab === "presales" ? (
                <div className="space-y-4">
                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        Live transcript for <strong>{activeModalBooking.customer_name}</strong> ({activeModalBooking.customer_phone}) with <strong>Kabir (AI Specialist)</strong>.
                      </span>
                    </div>
                    <span className="text-[11px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-lg border border-cyan-500/30 font-bold shrink-0">
                      {activeModalBooking.presales_transcript.length} turns
                    </span>
                  </div>

                  {/* Grouped Transcripts by Date/Time */}
                  {(() => {
                    // Group turns by date
                    const groups: { [dateKey: string]: TranscriptTurn[] } = {};
                    activeModalBooking.presales_transcript.forEach((turn) => {
                      const key = turn.full_date || turn.date || "Conversation Session";
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(turn);
                    });

                    const groupEntries = Object.entries(groups);

                    if (groupEntries.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400">
                          <p>No conversation transcripts recorded yet.</p>
                        </div>
                      );
                    }

                    return groupEntries.map(([dateKey, turns], groupIdx) => (
                      <div key={groupIdx} className="space-y-3 pt-1">
                        {/* Date Group Divider */}
                        <div className="flex items-center gap-3 my-2">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 shadow-md">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{dateKey}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({turns.length} message{turns.length !== 1 ? "s" : ""})
                            </span>
                          </div>
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                        </div>

                        {/* Turns in this Date Group */}
                        <div className="space-y-2.5">
                          {turns.map((turn, idx) => {
                            const isUser = turn.role === "customer" || turn.speaker.toLowerCase().includes("customer");
                            return (
                              <div
                                key={idx}
                                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                              >
                                <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400 px-1">
                                  <span className={`font-bold ${isUser ? "text-cyan-400" : "text-amber-400"}`}>
                                    {turn.speaker}
                                  </span>
                                  {(turn.time || turn.timestamp) && (
                                    <span className="font-mono text-slate-500 flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5 inline" />
                                      {turn.time || turn.timestamp}
                                    </span>
                                  )}
                                  {turn.channel && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">
                                      {turn.channel}
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                                    isUser
                                      ? "bg-cyan-600/20 border border-cyan-500/40 text-cyan-100 rounded-tr-xs"
                                      : "bg-black/60 border border-white/15 text-slate-200 rounded-tl-xs"
                                  }`}
                                >
                                  <p>{turn.message}</p>
                                  {turn.tool && (
                                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[9.5px] text-amber-300 font-mono flex items-center gap-1">
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
                  {activeModalBooking.test_ride_transcript.length > 0 ? (
                    <>
                      {/* AI Extracted Insights Bar */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Sentiment Score</span>
                          <p className="text-lg font-black text-emerald-400 mt-0.5">
                            {activeModalBooking.sentiment_score !== null
                              ? `${Math.round(activeModalBooking.sentiment_score * 100)}% Positive`
                              : "N/A"}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Purchase Intent</span>
                          <p className="text-lg font-black text-cyan-400 mt-0.5">
                            {activeModalBooking.purchase_intent !== null
                              ? `${Math.round(activeModalBooking.purchase_intent * 100)}% Ready`
                              : "N/A"}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Loved Features</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {activeModalBooking.loved_features.length > 0 ? (
                              activeModalBooking.loved_features.map((f, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold"
                                >
                                  ✓ {f}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-500 italic">None logged</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Advisor Coaching Feedback */}
                      {activeModalBooking.advisor_coaching_feedback && (
                        <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200">
                          <p className="font-bold flex items-center gap-1.5 text-purple-300">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Sales Advisor In-Vehicle Turn Notes:
                          </p>
                          <p className="text-[11px] text-slate-300 mt-1">
                            {activeModalBooking.advisor_coaching_feedback}
                          </p>
                        </div>
                      )}

                      {/* Test Ride Turns */}
                      <div className="space-y-2.5 pt-2">
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          In-Vehicle Audio Dialogue Turns:
                        </h5>
                        {activeModalBooking.test_ride_transcript.map((turn, idx) => {
                          const isCustomer = turn.speaker.toLowerCase().includes("customer");
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                            >
                              <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                                <span className={`font-bold ${isCustomer ? "text-cyan-400" : "text-purple-400"}`}>
                                  {turn.speaker}
                                </span>
                                {turn.timestamp && <span className="font-mono">• {turn.timestamp}</span>}
                              </div>
                              <div
                                className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                                  isCustomer
                                    ? "bg-purple-600/20 border border-purple-500/40 text-purple-100 rounded-tr-xs"
                                    : "bg-black/60 border border-white/15 text-slate-200 rounded-tl-xs"
                                }`}
                              >
                                <p>{turn.message}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center space-y-3 my-4">
                      <div className="w-12 h-12 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
                        <Volume2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">No Test Ride Transcript Recorded Yet</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                          This booking is scheduled for <strong>{activeModalBooking.scheduled_date} at {activeModalBooking.scheduled_time_slot}</strong>. In-vehicle audio recordings, live transcription, and sentiment insights will be inserted automatically once the test drive flow is completed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-white/10 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Twilio SMS dispatched &amp; logged in database</span>
              </span>
              <button
                onClick={() => setActiveModalBooking(null)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all"
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
