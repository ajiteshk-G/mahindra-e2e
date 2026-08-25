"use client";

import React, { useState } from "react";
import { TelematicsData, CustomerProfile } from "@/types";
import { triggerTelematicsAlert } from "@/lib/api";
import { Activity, Gauge, BatteryCharging, AlertTriangle, CheckCircle, Wrench, Shield, KeyRound } from "lucide-react";

interface TelematicsWidgetProps {
  telematics: TelematicsData | null;
  profile: CustomerProfile | null;
  onOpenDiagnostics: () => void;
  onRefresh: () => void;
}

export function TelematicsWidget({
  telematics,
  profile,
  onOpenDiagnostics,
  onRefresh
}: TelematicsWidgetProps) {
  const [alertTriggered, setAlertTriggered] = useState(false);

  const handleTriggerAlert = async () => {
    try {
      await triggerTelematicsAlert(profile?.customer_id || "CUST-AARAV-001");
      setAlertTriggered(true);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const odo = telematics?.odometer_km || profile?.odometer_km || 9820;
  const oilLife = telematics?.oil_viscosity_pct || 14;
  const isServiceDue = odo >= 9800 || oilLife <= 15;

  return (
    <div className="bg-mahindra-card rounded-2xl border border-mahindra-border/80 p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-mahindra-border pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-mahindra-red animate-pulse" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            AdrenoX Connected Telematics & IoT Hub
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          VIN: {profile?.owned_vin?.slice(-6) || "MUM01"} • ONLINE
        </span>
      </div>

      {/* Vehicle Identity */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <div className="font-bold text-white">{profile?.owned_vehicle_name || "Mahindra Thar ROXX AX7L"}</div>
          <div className="text-gray-400 font-mono text-[10px]">{profile?.registration_number || "MH 02 FJ 9090"}</div>
        </div>
        <div className="text-right">
          <div className="font-bold text-white">{odo.toLocaleString()} km</div>
          <div className="text-[10px] text-gray-400">Odometer</div>
        </div>
      </div>

      {/* IoT Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Engine Oil Life */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between ${
          oilLife <= 15 ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' : 'bg-mahindra-dark border-mahindra-border text-gray-300'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Oil Life</span>
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base font-extrabold text-amber-400 mt-1">{oilLife}%</div>
          <div className="text-[9px] text-gray-400 mt-0.5">Service in 180 km</div>
        </div>

        {/* Battery Health / 12V */}
        <div className="p-3 rounded-xl bg-mahindra-dark border border-mahindra-border flex flex-col justify-between text-gray-300">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Battery SoC</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-extrabold text-emerald-400 mt-1">{telematics?.battery_soc_pct || 84}%</div>
          <div className="text-[9px] text-gray-400 mt-0.5">Optimal Range: {telematics?.distance_to_empty_km || 465} km</div>
        </div>

        {/* TPMS Summary */}
        <div className="p-3 rounded-xl bg-mahindra-dark border border-mahindra-border flex flex-col justify-between text-gray-300">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>TPMS Status</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-extrabold text-white mt-1">32.5 PSI</div>
          <div className="text-[9px] text-emerald-400 mt-0.5">All 4 Wheels Balanced</div>
        </div>

        {/* Smart Locks */}
        <div className="p-3 rounded-xl bg-mahindra-dark border border-mahindra-border flex flex-col justify-between text-gray-300">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Central Lock</span>
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base font-extrabold text-white mt-1">LOCKED</div>
          <div className="text-[9px] text-gray-400 mt-0.5">Geo-fencing Active</div>
        </div>
      </div>

      {/* Proactive Predictive Alert Banner */}
      {isServiceDue && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-bold text-amber-300">Predictive Maintenance Alert: 10,000 km Periodic Service Due</div>
            <div className="text-gray-300 text-[11px]">
              Oil viscosity degradation detected. Bayview Workshop has home-pickup slots open this Saturday at 9:00 AM.
            </div>
            <div className="pt-1 flex gap-2">
              <button
                onClick={onOpenDiagnostics}
                className="bg-mahindra-red hover:bg-red-600 text-white px-3 py-1 rounded-lg font-bold text-[10px] transition-all"
              >
                Inspect & Schedule Pickup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
