"use client";

import React, { useState } from "react";
import { CustomerProfile, VehicleItem } from "@/types";
import { scanKYCDocument, submitVoiceConsent } from "@/lib/api";
import { X, ShieldCheck, Camera, Mic, CheckCircle, FileText, Sparkles, CreditCard } from "lucide-react";

interface ShowroomFinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  selectedVehicle: VehicleItem | null;
  onProfileUpdated: () => void;
}

export function ShowroomFinancingModal({
  isOpen,
  onClose,
  profile,
  selectedVehicle,
  onProfileUpdated
}: ShowroomFinancingModalProps) {
  const [activeTab, setActiveTab] = useState<"FINANCING" | "KYC" | "CONSENT">("FINANCING");
  const [loanAmount, setLoanAmount] = useState<number>(profile?.loan_preapproval_amount || 1850000);
  const [downPayment, setDownPayment] = useState<number>(399000);
  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [kycResult, setKycResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [voiceConsentResult, setVoiceConsentResult] = useState<any>(null);
  const [consentPhrase, setConsentPhrase] = useState(
    "I, Aarav Sharma, approve the loan application of ₹18.5 Lakhs with Mahindra Finance."
  );
  const [recordingConsent, setRecordingConsent] = useState(false);

  if (!isOpen) return null;

  // Monthly EMI calculation at 8.15% fixed
  const r = 8.15 / (12 * 100);
  const n = tenureMonths;
  const emi = Math.round((loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  const handleScanKYC = async (docType: "PAN" | "AADHAAR") => {
    setScanning(true);
    try {
      const res = await scanKYCDocument({
        customer_id: profile?.customer_id || "CUST-AARAV-001",
        document_type: docType,
        mock_preset: docType === "PAN" ? "aarav_pan" : "aarav_aadhaar"
      });
      setKycResult(res);
      onProfileUpdated();
    } catch (e) {
      console.error("KYC scan error:", e);
    } finally {
      setScanning(false);
    }
  };

  const handleCaptureVoiceConsent = async () => {
    setRecordingConsent(true);
    try {
      const res = await submitVoiceConsent({
        customer_id: profile?.customer_id || "CUST-AARAV-001",
        spoken_phrase: consentPhrase,
        loan_amount: loanAmount,
        lender_name: "Mahindra Finance"
      });
      setVoiceConsentResult(res);
      onProfileUpdated();
    } catch (e) {
      console.error("Voice consent error:", e);
    } finally {
      setRecordingConsent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-mahindra-card border border-mahindra-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-mahindra-border flex items-center justify-between sticky top-0 bg-mahindra-card z-10">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-mahindra-red" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Showroom Financing & Multimodal KYC</h2>
              <p className="text-xs text-gray-400">Mahindra Finance Pre-Approved Rate: 8.15% Fixed</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="grid grid-cols-3 border-b border-mahindra-border text-xs text-center bg-mahindra-charcoal">
          <button
            onClick={() => setActiveTab("FINANCING")}
            className={`py-3 font-semibold transition-colors ${
              activeTab === "FINANCING" ? "text-mahindra-red border-b-2 border-mahindra-red bg-mahindra-card" : "text-gray-400"
            }`}
          >
            1. Loan & EMI Structure
          </button>
          <button
            onClick={() => setActiveTab("KYC")}
            className={`py-3 font-semibold transition-colors ${
              activeTab === "KYC" ? "text-mahindra-red border-b-2 border-mahindra-red bg-mahindra-card" : "text-gray-400"
            }`}
          >
            2. Gemini Vision KYC
          </button>
          <button
            onClick={() => setActiveTab("CONSENT")}
            className={`py-3 font-semibold transition-colors ${
              activeTab === "CONSENT" ? "text-mahindra-red border-b-2 border-mahindra-red bg-mahindra-card" : "text-gray-400"
            }`}
          >
            3. Voice Biometric Consent
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {activeTab === "FINANCING" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-mahindra-dark p-4 rounded-xl border border-mahindra-border">
                <div>
                  <div className="text-gray-400">Estimated Monthly EMI</div>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1">₹{emi.toLocaleString()}/mo</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">8.15% interest for {tenureMonths} months</div>
                </div>
                <div>
                  <div className="text-gray-400">Sanctioned Loan Amount</div>
                  <div className="text-xl font-extrabold text-white mt-1">₹{loanAmount.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Zero pre-closure charges</div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Loan Amount Slider</label>
                <input
                  type="range"
                  min={500000}
                  max={2500000}
                  step={50000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-mahindra-red"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>₹5 Lakhs</span>
                  <span>₹25 Lakhs</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("KYC")}
                  className="bg-mahindra-red hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl"
                >
                  Proceed to Vision KYC Scan →
                </button>
              </div>
            </div>
          )}

          {activeTab === "KYC" && (
            <div className="space-y-4">
              <p className="text-gray-300">
                Point your camera or upload your PAN card & Aadhaar card. Gemini Vision extracts and validates identity fields instantly.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleScanKYC("PAN")}
                  disabled={scanning}
                  className="p-4 rounded-xl border border-mahindra-border bg-mahindra-dark hover:border-mahindra-red/70 flex flex-col items-center gap-2 text-center transition-all"
                >
                  <Camera className="w-6 h-6 text-mahindra-red" />
                  <span className="font-bold text-white">Scan PAN Card</span>
                  <span className="text-[10px] text-gray-400">Validates with NSDL Registry</span>
                </button>

                <button
                  onClick={() => handleScanKYC("AADHAAR")}
                  disabled={scanning}
                  className="p-4 rounded-xl border border-mahindra-border bg-mahindra-dark hover:border-mahindra-red/70 flex flex-col items-center gap-2 text-center transition-all"
                >
                  <FileText className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold text-white">Scan Aadhaar Card</span>
                  <span className="text-[10px] text-gray-400">Validates UIDAI QR Signature</span>
                </button>
              </div>

              {scanning && (
                <div className="text-center py-3 text-gray-400 animate-pulse">
                  Gemini Vision OCR analyzing document elements...
                </div>
              )}

              {kycResult && (
                <div className="bg-mahindra-dark p-4 rounded-xl border border-emerald-500/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    {kycResult.message}
                  </div>
                  <pre className="text-[11px] font-mono text-gray-300 bg-black/40 p-2.5 rounded-lg overflow-x-auto">
                    {JSON.stringify(kycResult.extracted_fields, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveTab("CONSENT")}
                  className="bg-mahindra-red hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl"
                >
                  Proceed to Voice Consent →
                </button>
              </div>
            </div>
          )}

          {activeTab === "CONSENT" && (
            <div className="space-y-4">
              <div className="bg-mahindra-dark p-4 rounded-xl border border-mahindra-border space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-mahindra-red" />
                  Voice Biometric Consent Verification
                </div>
                <p className="text-gray-300">
                  Please speak the following mandatory regulatory confirmation into your microphone:
                </p>
                <div className="p-3 bg-black/60 rounded-lg border border-mahindra-border font-serif italic text-amber-200">
                  "{consentPhrase}"
                </div>
              </div>

              <button
                onClick={handleCaptureVoiceConsent}
                disabled={recordingConsent}
                className="w-full bg-mahindra-red hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Mic className="w-4 h-4" />
                {recordingConsent ? "Hashing Biometric Voice Signature..." : "Record Voice Approval & Sanction Loan"}
              </button>

              {voiceConsentResult && (
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle className="w-4 h-4" />
                    Loan Provisionally Approved!
                  </div>
                  <div className="text-[11px] text-gray-300 space-y-1">
                    <div>Consent Token: <span className="font-mono text-emerald-300">{voiceConsentResult.consent_token}</span></div>
                    <div>Biometric Hash: <span className="font-mono text-gray-400">{voiceConsentResult.biometric_hash}</span></div>
                    <div>Amount: ₹{voiceConsentResult.sanctioned_amount.toLocaleString()} at {voiceConsentResult.interest_rate}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
