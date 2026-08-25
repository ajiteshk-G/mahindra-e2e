"use client";

import React from "react";
import Link from "next/link";
import { AdminBookingsTable } from "@/components/AdminBookingsTable";
import { ShieldCheck, ArrowLeft, Car, Layers } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#06080E] text-slate-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Virtual Showroom</span>
          </Link>

          <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(227,24,55,0.4)]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-tight text-white uppercase">
                  Mahindra Omnichannel Admin Portal
                </h1>
                <span className="px-1.5 py-0.2 rounded bg-red-600/30 text-red-300 font-mono text-[9px] font-bold border border-red-500/40">
                  Live Operations
                </span>
              </div>
              <p className="text-[10.5px] text-slate-400">
                Booked Test Rides • Dual Transcripts (Pre-Sales &amp; Test Ride) • Twilio SMS Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Database Connected
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Test Ride Bookings &amp; Transcripts Registry</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time audit log of all reserved customer slots across Maharashtra, Delhi, Bangalore, and Chennai showrooms.
            </p>
          </div>
        </div>

        {/* Bookings Table Component */}
        <AdminBookingsTable />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-slate-500">
        Mahindra &amp; Mahindra Ltd. • AI Virtual Showroom &amp; Omnichannel Dealership Management Platform
      </footer>
    </div>
  );
}
