"use client";

import React, { useState, useEffect } from "react";
import {
  VehicleItem,
  CustomerProfile,
  EMICalculationResponse,
  DocumentExtractedResponse,
  SanctionLetterResponse
} from "@/types";
import {
  CreditCard,
  Calculator,
  Upload,
  FileCheck,
  CheckCircle2,
  Mic,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Download,
  Printer,
  Car,
  DollarSign,
  AlertCircle,
  FileText,
  Lock,
  Zap,
  TrendingUp
} from "lucide-react";
import { calculateEMI, uploadKYCDocument, recordVoiceConsent, fetchSanctionLetter } from "@/lib/api";

interface FinancingDocUploadProps {
  vehicles: VehicleItem[];
  profile: CustomerProfile | null;
  selectedVehicleId?: string;
  onRefreshProfile?: () => void;
  onProceedToDelivery?: () => void;
}

export function FinancingDocUpload({
  vehicles,
  profile,
  selectedVehicleId = "thar_roxx",
  onRefreshProfile,
  onProceedToDelivery
}: FinancingDocUploadProps) {
  const [activeStep, setActiveStep] = useState<"calculator" | "documents" | "consent" | "sanction">("calculator");
  const [vehicleId, setVehicleId] = useState<string>(selectedVehicleId);
  const [variant, setVariant] = useState<string>("AX7L Diesel AT 4x4");
  const [downPayment, setDownPayment] = useState<number>(795000);
  const [tenureMonths, setTenureMonths] = useState<number>(60);
  const [interestRate, setInterestRate] = useState<number>(8.15);

  // EMI Result
  const [emiData, setEmiData] = useState<EMICalculationResponse | null>(null);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // Document Upload States
  const [aadhaarDoc, setAadhaarDoc] = useState<DocumentExtractedResponse | null>(null);
  const [salaryDoc, setSalaryDoc] = useState<DocumentExtractedResponse | null>(null);
  const [panDoc, setPanDoc] = useState<DocumentExtractedResponse | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState<string | null>(null);

  // File Input Refs
  const aadhaarFileRef = React.useRef<HTMLInputElement | null>(null);
  const salaryFileRef = React.useRef<HTMLInputElement | null>(null);
  const panFileRef = React.useRef<HTMLInputElement | null>(null);

  // Voice Consent State
  const [isRecordingConsent, setIsRecordingConsent] = useState<boolean>(false);
  const [consentHash, setConsentHash] = useState<string | null>(null);

  // Sanction Letter State
  const [sanctionLetter, setSanctionLetter] = useState<SanctionLetterResponse | null>(null);

  const currentVehicle = vehicles.find((v) => v.id === vehicleId) || vehicles[0] || {
    id: "thar_roxx",
    name: "Thar ROXX",
    price_range: "₹22.49 Lakh"
  };

  // Recalculate EMI whenever inputs change
  useEffect(() => {
    async function runCalc() {
      try {
        const exPrice = vehicleId === "thar_roxx" ? 2249000 : vehicleId === "be_6e" ? 2190000 : vehicleId === "xev_9e" ? 2490000 : 2350000;
        const res = await calculateEMI({
          vehicle_id: vehicleId,
          variant: variant,
          ex_showroom_price: exPrice,
          down_payment: downPayment,
          tenure_months: tenureMonths,
          interest_rate_annual: interestRate
        });
        setEmiData(res);
      } catch (e) {
        console.error(e);
      }
    }
    runCalc();
  }, [vehicleId, variant, downPayment, tenureMonths, interestRate]);

  // Handle Document Upload simulation or actual upload
  const handleUploadDoc = async (type: "AADHAAR" | "SALARY_SLIP" | "PAN", fileName?: string) => {
    setIsUploadingDoc(type);
    try {
      const res = await uploadKYCDocument({
        customer_id: profile?.customer_id || "CUST-AARAV-001",
        document_type: type,
        file_name: fileName || `${type.toLowerCase()}_aarav_sharma.pdf`
      });

      if (type === "AADHAAR") setAadhaarDoc(res);
      if (type === "SALARY_SLIP") setSalaryDoc(res);
      if (type === "PAN") setPanDoc(res);

      if (onRefreshProfile) onRefreshProfile();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploadingDoc(null);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, type: "AADHAAR" | "SALARY_SLIP" | "PAN") => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadDoc(type, file.name);
    }
  };

  // Handle Voice Consent Capture
  const handleRecordVoiceConsent = async () => {
    setIsRecordingConsent(true);
    setTimeout(async () => {
      try {
        const res = await recordVoiceConsent({
          customer_id: profile?.customer_id || "CUST-AARAV-001",
          customer_name: profile?.name || "Aarav Sharma",
          loan_amount: emiData?.loan_amount || 1850000,
          spoken_phrase: `I, ${profile?.name || "Aarav Sharma"}, approve the loan application of Rs ${(emiData?.loan_amount || 1850000) / 100000} Lakhs with Mahindra Finance.`
        });
        setConsentHash(res.biometric_hash);
        setIsRecordingConsent(false);
        if (onRefreshProfile) onRefreshProfile();
      } catch (e) {
        console.error(e);
        setIsRecordingConsent(false);
      }
    }, 2000);
  };

  // Generate / Fetch Sanction Letter
  const handleGenerateSanction = async () => {
    try {
      const letter = await fetchSanctionLetter(profile?.customer_id || "CUST-AARAV-001");
      setSanctionLetter(letter);
      setActiveStep("sanction");
      if (onRefreshProfile) onRefreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const allDocsUploaded = !!(aadhaarDoc && salaryDoc && panDoc);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-stone-900 to-emerald-950/80 p-5 rounded-2xl border border-emerald-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            Stage 4: Mahindra Finance Instant Loan & Document KYC
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span>Special 8.15% Car Loan & Paperless KYC Engine</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
              Pre-Approved Partner
            </span>
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 mt-1 max-w-2xl">
            Select vehicle & tenure for real-time EMI calculation. Upload Aadhaar, Salary Slip, and PAN for instant OCR income evaluation, biometric voice consent, and instant Sanction Letter.
          </p>
        </div>

        {sanctionLetter && onProceedToDelivery && (
          <button
            onClick={onProceedToDelivery}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs md:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/40 flex items-center gap-2"
          >
            <span>Proceed to Connected Telematics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Sub-Steps */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 pb-2">
        {[
          { id: "calculator", label: "1. EMI & Tenure Calculator", icon: Calculator },
          { id: "documents", label: "2. Document Upload & OCR", icon: Upload },
          { id: "consent", label: "3. Voice Biometric Consent", icon: Mic },
          { id: "sanction", label: "4. Digital Sanction Letter", icon: Award }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStep === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStep(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/40"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: EMI & TENURE CALCULATOR */}
      {activeStep === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Vehicle & Loan Sliders */}
          <div className="lg:col-span-7 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-6 shadow-2xl">
            <div className="border-b border-neutral-800 pb-3">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Vehicle Selection & Down Payment
              </span>
              <h3 className="text-xl font-black text-white mt-1">Configure Loan Parameters</h3>
            </div>

            {/* Vehicle Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">Select Mahindra Model</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.category.split(" ")[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-400 block mb-1">Variant & Trim</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white font-semibold"
                >
                  <option value="AX7L Diesel AT 4x4">AX7L Diesel AT 4x4 (Stealth Black)</option>
                  <option value="AX5L Diesel MT 4x4">AX5L Diesel MT 4x4</option>
                  <option value="MX5 Petrol AT RWD">MX5 Petrol AT RWD</option>
                  <option value="AX7L AWD Diesel">AX7L AWD Luxury Pack</option>
                </select>
              </div>
            </div>

            {/* Down Payment Slider */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-400 font-bold block">Down Payment</span>
                  <span className="text-lg font-black text-white">₹{downPayment.toLocaleString("en-IN")}</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono">
                  {emiData?.on_road_price
                    ? `${Math.round((downPayment / emiData.on_road_price) * 100)}% of On-Road`
                    : "30%"}
                </span>
              </div>

              <input
                type="range"
                min={200000}
                max={1500000}
                step={25000}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>Min: ₹2,00,000</span>
                <span>Max: ₹15,00,000</span>
              </div>
            </div>

            {/* Loan Tenure Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-400 block">
                Loan Tenure (Months / Years)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[12, 24, 36, 48, 60, 84].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenureMonths(t)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      tenureMonths === t
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div>{t} Mo</div>
                    <div className="text-[9px] opacity-70 font-normal">{t / 12} Yrs</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate Callout */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-bold block">Mahindra Finance Exclusive Rate</span>
                  <span className="text-[10px] text-neutral-400">Zero pre-closure charges after 6 months</span>
                </div>
              </div>
              <span className="text-base font-black text-emerald-400">8.15% p.a.</span>
            </div>

            {/* Proceed to Upload */}
            <button
              onClick={() => setActiveStep("documents")}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
            >
              <span>Next: Upload KYC Documents (Aadhaar, Salary Slip, PAN)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right 5 Cols: Live EMI Summary & Price Breakdown */}
          <div className="lg:col-span-5 bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-5 shadow-2xl">
            <div className="border-b border-neutral-800 pb-3">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Instant Calculation Breakdown
              </span>
              <h3 className="text-xl font-black text-white mt-1">Monthly EMI & Summary</h3>
            </div>

            {/* Highlighted Big Monthly EMI Card */}
            <div className="p-6 bg-gradient-to-br from-neutral-950 to-emerald-950/60 rounded-2xl border border-emerald-800/60 text-center space-y-2 shadow-inner">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Calculated Monthly EMI
              </span>
              <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
                ₹{emiData?.monthly_emi?.toLocaleString("en-IN") || "37,654"}
                <span className="text-xs text-neutral-400 font-normal"> / month</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                for {tenureMonths} Months ({tenureMonths / 12} Years) @ {interestRate}% p.a.
              </p>
            </div>

            {/* Price Component Table */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5 text-xs">
              <div className="flex justify-between text-neutral-300">
                <span>Ex-Showroom Price:</span>
                <span className="font-mono font-semibold">₹{emiData?.ex_showroom_price?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>RTO Registration (12%):</span>
                <span className="font-mono">₹{emiData?.rto_registration?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Zero-Dep Comprehensive Insurance:</span>
                <span className="font-mono">₹{emiData?.insurance_comprehensive?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Fastag, TCS & Admin Fees:</span>
                <span className="font-mono">₹{emiData?.other_charges?.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-white">
                <span>Total On-Road Price:</span>
                <span className="font-mono text-emerald-400">₹{emiData?.on_road_price?.toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-1 border-t border-neutral-850 flex justify-between text-neutral-300">
                <span>Sanctioned Loan Amount:</span>
                <span className="font-mono font-bold text-white">₹{emiData?.loan_amount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Interest Payable:</span>
                <span className="font-mono">₹{emiData?.total_interest?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Toggle Amortization Schedule */}
            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 rounded-xl text-xs border border-neutral-800 transition-colors"
            >
              {showAmortization ? "Hide Amortization Schedule" : "View Year-by-Year Amortization Schedule"}
            </button>

            {showAmortization && (
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 max-h-48 overflow-y-auto font-mono text-[10px] space-y-1.5">
                <div className="grid grid-cols-4 font-bold text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>Year</span>
                  <span>EMI/mo</span>
                  <span>Principal</span>
                  <span>Balance</span>
                </div>
                {[1, 2, 3, 4, 5].slice(0, tenureMonths / 12).map((yr) => (
                  <div key={yr} className="grid grid-cols-4 text-neutral-300 py-0.5">
                    <span>Year {yr}</span>
                    <span>₹{emiData?.monthly_emi?.toLocaleString("en-IN")}</span>
                    <span>₹{((emiData?.monthly_emi || 37654) * 12 * 0.75).toFixed(0)}</span>
                    <span className="text-emerald-400">
                      ₹{Math.max(0, (emiData?.loan_amount || 1850000) - yr * 370000).toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: MULTIMODAL DOCUMENT UPLOAD & OCR */}
      {activeStep === "documents" && (
        <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-6 shadow-2xl">
          <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Step 2: Paperless KYC & Income Verification
              </span>
              <h3 className="text-xl font-black text-white mt-1">Upload Aadhaar, Salary Slip & PAN</h3>
            </div>
            <span className="text-xs text-neutral-400">
              AI OCR extraction in &lt; 3 seconds
            </span>
          </div>

          {/* 3-Column Document Upload Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Aadhaar Card */}
            <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Identity & Address
                  </span>
                  {aadhaarDoc ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">Required</span>
                  )}
                </div>
                <h4 className="text-base font-black text-white">Aadhaar Card (UIDAI)</h4>
                <p className="text-xs text-neutral-400">
                  Extracts name, masked Aadhaar number, date of birth, and verified residential address.
                </p>

                {aadhaarDoc && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] space-y-1 text-neutral-300">
                    <div><strong>Name:</strong> {aadhaarDoc.extracted_fields.full_name}</div>
                    <div><strong>UID:</strong> {aadhaarDoc.extracted_fields.id_number}</div>
                    <div><strong>DOB:</strong> {aadhaarDoc.extracted_fields.dob}</div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      <strong>Address:</strong> {aadhaarDoc.extracted_fields.address}
                    </div>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={aadhaarFileRef}
                onChange={(e) => handleFileSelected(e, "AADHAAR")}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  disabled={isUploadingDoc === "AADHAAR"}
                  onClick={() => aadhaarFileRef.current?.click()}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    aadhaarDoc
                      ? "bg-green-950 text-green-300 border border-green-800"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                  }`}
                >
                  {isUploadingDoc === "AADHAAR" ? (
                    <span>Scanning with AI OCR...</span>
                  ) : aadhaarDoc ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aadhaar Verified (Upload New)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Aadhaar File</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleUploadDoc("AADHAAR")}
                  title="Simulate Instant OCR Scan"
                  className="px-3 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-xs border border-neutral-800"
                >
                  ⚡ Demo
                </button>
              </div>
            </div>

            {/* Card 2: Salary Slip / Bank Statement */}
            <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Income & Eligibility
                  </span>
                  {salaryDoc ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                      Eligible (FOIR 26.5%)
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">Required</span>
                  )}
                </div>
                <h4 className="text-base font-black text-white">Salary Slip / Income Proof</h4>
                <p className="text-xs text-neutral-400">
                  Evaluates monthly in-hand income, employer credentials, and Debt-to-Income FOIR ratio.
                </p>

                {salaryDoc && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] space-y-1 text-neutral-300">
                    <div><strong>Employer:</strong> {salaryDoc.extracted_fields.employer_name}</div>
                    <div><strong>Net Monthly Salary:</strong> {salaryDoc.extracted_fields.net_monthly_salary}</div>
                    <div className="text-emerald-400 font-bold">
                      <strong>FOIR Ratio:</strong> {salaryDoc.income_metrics?.foir_ratio_percentage}% (Safe Low Risk)
                    </div>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={salaryFileRef}
                onChange={(e) => handleFileSelected(e, "SALARY_SLIP")}
                accept=".pdf,.png,.jpg,.jpeg,.csv"
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  disabled={isUploadingDoc === "SALARY_SLIP"}
                  onClick={() => salaryFileRef.current?.click()}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    salaryDoc
                      ? "bg-green-950 text-green-300 border border-green-800"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                  }`}
                >
                  {isUploadingDoc === "SALARY_SLIP" ? (
                    <span>Evaluating Income via OCR...</span>
                  ) : salaryDoc ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Income Verified (Upload New)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Salary Slip</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleUploadDoc("SALARY_SLIP")}
                  title="Simulate Instant OCR Scan"
                  className="px-3 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-xs border border-neutral-800"
                >
                  ⚡ Demo
                </button>
              </div>
            </div>

            {/* Card 3: PAN Card */}
            <div className="p-5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Tax & Credit Assessment
                  </span>
                  {panDoc ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">Required</span>
                  )}
                </div>
                <h4 className="text-base font-black text-white">PAN Card</h4>
                <p className="text-xs text-neutral-400">
                  Verifies Permanent Account Number with NSDL and checks CIBIL credit Bureau linkage.
                </p>

                {panDoc && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-[11px] space-y-1 text-neutral-300">
                    <div><strong>PAN Number:</strong> {panDoc.extracted_fields.id_number}</div>
                    <div><strong>Full Name:</strong> {panDoc.extracted_fields.full_name}</div>
                    <div><strong>Status:</strong> {panDoc.extracted_fields.pan_status}</div>
                  </div>
                )}
              </div>

              <input
                type="file"
                ref={panFileRef}
                onChange={(e) => handleFileSelected(e, "PAN")}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="flex gap-2">
                <button
                  disabled={isUploadingDoc === "PAN"}
                  onClick={() => panFileRef.current?.click()}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    panDoc
                      ? "bg-green-950 text-green-300 border border-green-800"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40"
                  }`}
                >
                  {isUploadingDoc === "PAN" ? (
                    <span>Checking NSDL Database...</span>
                  ) : panDoc ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>PAN Verified (Upload New)</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload PAN Card</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleUploadDoc("PAN")}
                  title="Simulate Instant OCR Scan"
                  className="px-3 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl text-xs border border-neutral-800"
                >
                  ⚡ Demo
                </button>
              </div>
            </div>
          </div>

          {/* Quick Auto-Fill / Verify All Button */}
          {!allDocsUploaded && (
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-neutral-300">
                Want to test the full flow in 1-click?
              </span>
              <button
                onClick={async () => {
                  await handleUploadDoc("AADHAAR");
                  await handleUploadDoc("SALARY_SLIP");
                  await handleUploadDoc("PAN");
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl border border-neutral-700 transition-colors"
              >
                ⚡ Auto-Scan & Verify All 3 Documents
              </button>
            </div>
          )}

          {/* Next Button */}
          <div className="flex justify-end">
            <button
              disabled={!allDocsUploaded}
              onClick={() => setActiveStep("consent")}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-40 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60"
            >
              <span>Next: Voice Biometric Consent Capture</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VOICE BIOMETRIC CONSENT */}
      {activeStep === "consent" && (
        <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-6 shadow-2xl max-w-3xl mx-auto">
          <div className="border-b border-neutral-800 pb-3 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
              Step 3: Biometric Voice Consent & E-Sign
            </span>
            <h3 className="text-xl font-black text-white mt-1">Instant Loan Approval Voice Hash</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-lg mx-auto">
              Please state your full name and loan approval statement into the microphone. A cryptographic voice biometric hash will be created.
            </p>
          </div>

          {/* Consent Spoken Prompt Card */}
          <div className="p-5 bg-black rounded-2xl border border-neutral-800 space-y-3 text-center">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
              Please Read Aloud:
            </span>
            <blockquote className="text-base sm:text-lg font-bold text-emerald-300 font-serif italic max-w-xl mx-auto">
              "I, {profile?.name || "Aarav Sharma"}, approve the loan application of ₹{((emiData?.loan_amount || 1850000) / 100000).toFixed(1)} Lakhs with Mahindra Finance."
            </blockquote>

            <div className="pt-3">
              {!consentHash ? (
                <button
                  disabled={isRecordingConsent}
                  onClick={handleRecordVoiceConsent}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-red-950/60"
                >
                  <Mic className={`w-4 h-4 ${isRecordingConsent ? "animate-pulse text-yellow-300" : ""}`} />
                  <span>
                    {isRecordingConsent ? "Listening & Generating Biometric Hash..." : "Record Voice Consent"}
                  </span>
                </button>
              ) : (
                <div className="p-3 bg-green-950/40 border border-green-800/60 rounded-xl text-green-300 text-xs space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Voice Consent Biometric Hash Verified & Stored!</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400 block break-all">
                    Hash Token: {consentHash}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveStep("documents")}
              className="text-xs text-neutral-400 hover:text-white"
            >
              ← Back to Documents
            </button>

            <button
              disabled={!consentHash}
              onClick={handleGenerateSanction}
              className="py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 disabled:opacity-40 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60"
            >
              <Award className="w-4 h-4" />
              <span>Issue Official Digital Sanction Letter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: OFFICIAL DIGITAL SANCTION LETTER */}
      {activeStep === "sanction" && sanctionLetter && (
        <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 p-6 space-y-6 shadow-2xl max-w-4xl mx-auto">
          {/* Certificate Container */}
          <div className="bg-neutral-950 p-6 sm:p-8 rounded-3xl border-2 border-emerald-600/40 space-y-6 relative overflow-hidden shadow-2xl">
            {/* Background Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-900 font-black text-7xl select-none pointer-events-none opacity-20 rotate-[-15deg]">
              MAHINDRA FINANCE
            </div>

            {/* Letter Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-red-500 tracking-wider">MAHINDRA</span>
                  <span className="text-xl font-bold text-white">FINANCE</span>
                </div>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  Mahindra & Mahindra Financial Services Limited • Reg. NBFC-ND-SI
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                  SANCTION ID: {sanctionLetter.sanction_id}
                </span>
                <span className="text-[10px] text-neutral-400">
                  Issued: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
                INSTANT AUTO LOAN PRE-APPROVAL LETTER
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                Loan Sanction Certificate
              </h3>
            </div>

            {/* Sanction Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 block">Borrower Name</span>
                <span className="font-bold text-white text-sm">{sanctionLetter.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Sanctioned Amount</span>
                <span className="font-black text-emerald-400 text-sm">
                  ₹{sanctionLetter.sanctioned_loan_amount?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Monthly EMI</span>
                <span className="font-black text-white text-sm">
                  ₹{sanctionLetter.monthly_emi?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block">Interest Rate</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {sanctionLetter.interest_rate_annual}% p.a.
                </span>
              </div>
            </div>

            {/* Vehicle & KYC Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Vehicle Allocation Summary
                </span>
                <div className="space-y-1 text-neutral-300">
                  <div><strong>Vehicle:</strong> {sanctionLetter.vehicle_name}</div>
                  <div><strong>Variant:</strong> {sanctionLetter.variant}</div>
                  <div><strong>On-Road Price:</strong> ₹{sanctionLetter.on_road_price?.toLocaleString("en-IN")}</div>
                  <div><strong>Down Payment:</strong> ₹{sanctionLetter.down_payment?.toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  KYC & Income Verification
                </span>
                <div className="space-y-1 text-neutral-300">
                  <div><strong>Aadhaar:</strong> {sanctionLetter.kyc_summary?.aadhaar_status}</div>
                  <div><strong>PAN:</strong> {sanctionLetter.kyc_summary?.pan_status}</div>
                  <div><strong>Income:</strong> {sanctionLetter.kyc_summary?.salary_verification}</div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    <strong>Biometric Hash:</strong> {sanctionLetter.kyc_summary?.voice_biometric_hash}
                  </div>
                </div>
              </div>
            </div>

            {/* Special Benefits List */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Exclusive Loan Privileges & Guarantees:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-neutral-300">
                {sanctionLetter.special_benefits?.map((b, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Digital Stamp & Sign-off */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-neutral-800 pt-4 text-xs text-neutral-400">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/60 bg-emerald-950/40 flex items-center justify-center text-[10px] font-black text-emerald-400 text-center leading-tight">
                  SEAL<br />APPROVED
                </div>
                <div>
                  <span className="font-bold text-white block">Digitally Certified & Approved</span>
                  <span className="text-[10px]">Mahindra & Mahindra Financial Services Ltd.</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 border border-neutral-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => alert("Sanction Letter PDF downloaded to your device!")}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
