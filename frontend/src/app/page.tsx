"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PreSalesShowroom } from "@/components/PreSalesShowroom";
import { SalesMobileApp } from "@/components/SalesMobileApp";
import { OutboundCallSimulator } from "@/components/OutboundCallSimulator";
import { FinancingDocUpload } from "@/components/FinancingDocUpload";
import { TelematicsWidget } from "@/components/TelematicsWidget";
import { CustomerProfileDrawer } from "@/components/CustomerProfileDrawer";
import { CustomerLeadModal } from "@/components/CustomerLeadModal";
import { useCustomerProfile } from "@/hooks/useCustomerProfile";
import { fetchCatalog, fetchDealerships, fetchLiveTelematics } from "@/lib/api";
import { DEFAULT_VEHICLES } from "@/lib/defaultCatalog";
import {
  VehicleItem,
  DealershipItem,
  TelematicsData,
  TestRideInsightResponse
} from "@/types";
import { Zap } from "lucide-react";

export default function Home() {
  const { profile, setProfile, loadProfile, setPhase } = useCustomerProfile();
  const [vehicles, setVehicles] = useState<VehicleItem[]>(DEFAULT_VEHICLES);
  const [dealerships, setDealerships] = useState<DealershipItem[]>([]);
  const [telematics, setTelematics] = useState<TelematicsData | null>(null);

  // Active Omnichannel Stage
  const [activeStage, setActiveStage] = useState<
    "presales" | "sales_app" | "outbound_call" | "financing" | "connected"
  >("presales");

  // Selected vehicle & insights state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("thar_roxx");
  const [testRideInsights, setTestRideInsights] = useState<TestRideInsightResponse | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGlobalLeadModalOpen, setIsGlobalLeadModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cat, dealers, tele] = await Promise.all([
          fetchCatalog(),
          fetchDealerships(),
          fetchLiveTelematics()
        ]);
        if (Array.isArray(cat) && cat.length > 0) {
          setVehicles(cat);
        }
        setDealerships(dealers);
        setTelematics(tele);
      } catch (e) {
        console.error("Data load error:", e);
      }
    }
    loadData();
  }, []);

  const handleCustomerIdentified = (data: any) => {
    setProfile({
      id: 1,
      customer_id: data.customer_id,
      name: data.name,
      phone: data.phone,
      city: "Mumbai",
      preferred_language: "Hinglish",
      current_phase: "PRE_SALES",
      interested_vehicle_id: selectedVehicleId,
      interested_variant: "AX7L Diesel AT 4x4",
      budget_range: "₹18 Lakh - ₹25 Lakh",
      kyc_status: "PENDING",
      loan_preapproval_amount: 1850000,
      loan_interest_rate: "8.15%",
      loan_status: "NOT_APPLIED",
      odometer_km: 9820
    });
    setActiveStage("presales");
  };

  const handleHeaderOpenAvatar = () => {
    setActiveStage("presales");
    const chatInput = document.querySelector('input[placeholder*="Ask Kabir"]') as HTMLInputElement;
    if (chatInput) {
      chatInput.focus();
      chatInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Crisp White Header */}
      <Header
        profile={profile}
        activeStage={activeStage}
        onSelectStage={(stage) => setActiveStage(stage)}
        onOpenProfile={() => {
          if (profile) {
            setIsProfileOpen(true);
          } else {
            setIsGlobalLeadModalOpen(true);
          }
        }}
        onOpenLeadModal={() => setIsGlobalLeadModalOpen(true)}
        onOpenAvatar={handleHeaderOpenAvatar}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-1">
        {/* Stage 1: Pre-Sales Car Website & Virtual Showroom (Split layout with embedded right Chat & Avatar panel) */}
        {activeStage === "presales" && (
          <PreSalesShowroom
            vehicles={vehicles}
            currentProfile={profile}
            onProfileUpdated={() => {
              if (profile?.phone) loadProfile(profile.phone);
            }}
          />
        )}

        {/* Stage 2: Sales Mobile App & Test Ride Recording */}
        {activeStage === "sales_app" && (
          <SalesMobileApp
            vehicles={vehicles}
            profile={profile}
            selectedVehicleId={selectedVehicleId}
            onProceedToOutboundCall={(insights) => {
              setTestRideInsights(insights);
              setActiveStage("outbound_call");
            }}
          />
        )}

        {/* Stage 3: Proactive Post-Ride Outbound Voice Call */}
        {activeStage === "outbound_call" && (
          <OutboundCallSimulator
            profile={profile}
            testRideInsights={testRideInsights}
            onProceedToFinancing={() => setActiveStage("financing")}
          />
        )}

        {/* Stage 4: 8.15% Car Loan Financing & Document KYC Upload */}
        {activeStage === "financing" && (
          <FinancingDocUpload
            vehicles={vehicles}
            profile={profile}
            selectedVehicleId={selectedVehicleId}
            onRefreshProfile={() => {
              if (profile?.phone) loadProfile(profile.phone);
            }}
            onProceedToDelivery={() => setActiveStage("connected")}
          />
        )}

        {/* Stage 5: Connected Vehicle Telematics & After-Sales */}
        {activeStage === "connected" && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <Zap className="w-3.5 h-3.5" />
                  Stage 5: Connected Vehicle IoT & After-Sales Claims
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome to Your Driver Cockpit
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Real-time IoT telemetry simulation (SoC, oil viscosity, TPMS) and Gemini Vision AI exterior vehicle damage inspection with instant zero-dep ICICI Lombard claims.
                </p>
              </div>
            </div>

            <TelematicsWidget
              telematics={telematics}
              profile={profile}
              onOpenDiagnostics={() => {}}
              onRefresh={() => {
                if (profile?.phone) loadProfile(profile.phone);
              }}
            />
          </div>
        )}
      </main>

      {/* Global Lead Identify Modal */}
      <CustomerLeadModal
        isOpen={isGlobalLeadModalOpen}
        onClose={() => setIsGlobalLeadModalOpen(false)}
        selectedVehicle={currentVehicle}
        onCustomerIdentified={handleCustomerIdentified}
      />

      {/* Customer Profile & Transcript Drawer */}
      <CustomerProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSetPhase={(phase) => setPhase(phase)}
        onRefresh={() => {
          if (profile?.phone) loadProfile(profile.phone);
        }}
      />
    </div>
  );
}
