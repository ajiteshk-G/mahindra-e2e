"use client";

import React from "react";
import Link from "next/link";
import { CustomerProfile } from "@/types";
import {
  Sparkles,
  Smartphone,
  PhoneCall,
  CreditCard,
  Zap,
  UserCheck,
  MessageSquare,
  ShieldCheck
} from "lucide-react";

interface HeaderProps {
  profile: CustomerProfile | null;
  activeStage: "presales" | "sales_app" | "outbound_call" | "financing";
  onSelectStage: (stage: "presales" | "sales_app" | "outbound_call" | "financing") => void;
  onOpenProfile: () => void;
  onOpenLeadModal?: () => void;
  onOpenAvatar?: () => void;
}

export function Header({
  profile,
  activeStage,
  onSelectStage,
  onOpenProfile,
  onOpenLeadModal,
  onOpenAvatar
}: HeaderProps) {
  const stages = [
    { id: "presales" as const, label: "1. Pre-Sales Showroom", icon: Sparkles },
    { id: "sales_app" as const, label: "2. Sales Mobile App", icon: Smartphone },
    { id: "outbound_call" as const, label: "3. Outbound Call", icon: PhoneCall },
    { id: "financing" as const, label: "4. Loan & KYC", icon: CreditCard }
  ];

  return (
    <header className="w-full bg-white/95 border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectStage("presales")}>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-5 bg-red-600 transform skew-x-[-15deg] inline-block rounded-xs"></span>
            <span className="text-lg font-black tracking-wider text-slate-900">MAHINDRA</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 hidden sm:inline-block">
            MIA OMNICHANNEL
          </span>
        </div>

        {/* Omnichannel Journey Stage Navigation */}
        <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs overflow-x-auto max-w-[580px]">
          {stages.map((st) => {
            const Icon = st.icon;
            const isActive = activeStage === st.id;
            return (
              <button
                key={st.id}
                onClick={() => onSelectStage(st.id)}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{st.label}</span>
                <span className="inline md:hidden">{st.label.split(". ")[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Direct Avatar Launch Button + Admin Link + Logged-in Profile */}
        <div className="flex items-center gap-2">
          {/* Admin Portal Button */}
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-xs group"
            title="Open Mahindra Test Rides & Transcripts Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Admin Portal</span>
          </Link>



          {/* Customer Profile Pill (Only shown when identified) */}
          {profile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-bold text-slate-900 leading-none flex items-center gap-1">
                  {profile.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {profile.phone}
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
