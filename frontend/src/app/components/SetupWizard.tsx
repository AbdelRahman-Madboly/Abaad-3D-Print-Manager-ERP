import { useState } from "react";
import { Upload, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Progress } from "./ui/progress";

export function SetupWizard({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Step 1 — Company Info
  const [companyName, setCompanyName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [tagline, setTagline] = useState("");
  const [socialHandle, setSocialHandle] = useState("");
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  // Step 2 — Filament colors
  const COLORS = [
    { id: "black", label: "Black", swatch: "#1a1a1a" },
    { id: "white", label: "White", swatch: "#f5f5f5" },
    { id: "blue", label: "Blue", swatch: "#3b82f6" },
    { id: "red", label: "Red", swatch: "#ef4444" },
    { id: "gray", label: "Gray", swatch: "#6b7280" },
    { id: "yellow", label: "Yellow", swatch: "#eab308" },
    { id: "green", label: "Green", swatch: "#22c55e" },
    { id: "orange", label: "Orange", swatch: "#f97316" },
    { id: "purple", label: "Purple", swatch: "#a855f7" },
  ];
  const [selectedColors, setSelectedColors] = useState<Record<string, boolean>>({});
  const [colorWeights, setColorWeights] = useState<Record<string, string>>({});

  // Step 3 — Primary Printer
  const [printerName, setPrinterName] = useState("");
  const [printerModel, setPrinterModel] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [electricityRate, setElectricityRate] = useState("");
  const [nozzleCost, setNozzleCost] = useState("");
  const [nozzleLife, setNozzleLife] = useState("");

  // Step 4 — Cost Defaults
  const [ratePerGram, setRatePerGram] = useState("0.50");
  const [costPerGram, setCostPerGram] = useState("0.20");
  const [depositPercent, setDepositPercent] = useState("30");
  const [quoteValidity, setQuoteValidity] = useState("7");

  function handleNext() {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  }

  function toggleColor(id: string) {
    setSelectedColors((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const stepLabels = ["Company Info", "Filament Spools", "Primary Printer", "Cost Defaults"];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ color: "#0f172a" }}
      >
        {/* Header */}
        <div className="px-8 pt-7 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold" style={{ color: "#0f172a" }}>
              Welcome to Abaad ERP
            </h2>
            <span className="text-sm font-medium" style={{ color: "#64748b" }}>
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>
          <p className="text-sm mb-4" style={{ color: "#64748b" }}>
            {stepLabels[currentStep - 1]}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const stepNum = i + 1;
              const done = stepNum <= currentStep;
              return (
                <div
                  key={stepNum}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: done ? "2rem" : "0.5rem",
                    backgroundColor: done ? "#1e3a8a" : "#e2e8f0",
                  }}
                />
              );
            })}
          </div>
          <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-1 mt-2" />
        </div>

        <Separator />

        {/* Step content */}
        <div className="px-8 py-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. PrintShop Pro"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    placeholder="e.g. 3D Printing Services"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="e.g. +20 100 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. Cairo, Egypt"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="e.g. Your ideas, printed"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="socialHandle">Social Handle</Label>
                  <Input
                    id="socialHandle"
                    placeholder="e.g. @printshoppro"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                  />
                </div>
              </div>

              {/* Logo upload */}
              <div className="space-y-1.5">
                <Label>Logo</Label>
                <label
                  htmlFor="logoUpload"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-6 cursor-pointer transition-colors hover:bg-slate-50"
                  style={{ borderColor: "#cbd5e1" }}
                >
                  <Upload size={24} style={{ color: "#94a3b8" }} />
                  <span className="text-sm" style={{ color: "#64748b" }}>
                    {logoFileName ?? "Click to upload logo"}
                  </span>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setLogoFileName(e.target.files?.[0]?.name ?? null)
                    }
                  />
                </label>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "#64748b" }}>
                Select your initial filament colors
              </p>
              <div className="grid grid-cols-3 gap-3">
                {COLORS.map((color) => {
                  const checked = !!selectedColors[color.id];
                  return (
                    <div
                      key={color.id}
                      className="border rounded-lg p-3 space-y-2 transition-colors"
                      style={{
                        borderColor: checked ? "#1e3a8a" : "#e2e8f0",
                        backgroundColor: checked ? "#eff6ff" : "white",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border shrink-0"
                          style={{
                            backgroundColor: color.swatch,
                            borderColor: color.id === "white" ? "#d1d5db" : color.swatch,
                          }}
                        />
                        <span className="text-sm font-medium flex-1" style={{ color: "#0f172a" }}>
                          {color.label}
                        </span>
                        <Checkbox
                          id={`color-${color.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleColor(color.id)}
                        />
                      </div>
                      {checked && (
                        <div className="space-y-1">
                          <Label
                            htmlFor={`weight-${color.id}`}
                            className="text-xs"
                            style={{ color: "#64748b" }}
                          >
                            Initial weight (g)
                          </Label>
                          <Input
                            id={`weight-${color.id}`}
                            type="number"
                            placeholder="1000"
                            className="h-7 text-xs"
                            value={colorWeights[color.id] ?? ""}
                            onChange={(e) =>
                              setColorWeights((prev) => ({
                                ...prev,
                                [color.id]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="printerName">Printer Name</Label>
                  <Input
                    id="printerName"
                    placeholder="e.g. Main Printer"
                    value={printerName}
                    onChange={(e) => setPrinterName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="printerModel">Model</Label>
                  <Input
                    id="printerModel"
                    placeholder="e.g. Bambu Lab X1C"
                    value={printerModel}
                    onChange={(e) => setPrinterModel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="purchasePrice">Purchase Price (EGP)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    placeholder="e.g. 25000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="electricityRate">Electricity Rate (kWh)</Label>
                  <Input
                    id="electricityRate"
                    type="number"
                    placeholder="e.g. 1.75"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nozzleCost">Nozzle Cost (EGP)</Label>
                  <Input
                    id="nozzleCost"
                    type="number"
                    placeholder="e.g. 150"
                    value={nozzleCost}
                    onChange={(e) => setNozzleCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nozzleLife">Nozzle Life (grams)</Label>
                  <Input
                    id="nozzleLife"
                    type="number"
                    placeholder="e.g. 5000"
                    value={nozzleLife}
                    onChange={(e) => setNozzleLife(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-5">
              <p className="text-sm" style={{ color: "#64748b" }}>
                Review and adjust your default cost settings.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ratePerGram">Rate per gram (EGP)</Label>
                  <Input
                    id="ratePerGram"
                    type="number"
                    value={ratePerGram}
                    onChange={(e) => setRatePerGram(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="costPerGram">Cost per gram (EGP)</Label>
                  <Input
                    id="costPerGram"
                    type="number"
                    value={costPerGram}
                    onChange={(e) => setCostPerGram(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="depositPercent">Deposit %</Label>
                  <Input
                    id="depositPercent"
                    type="number"
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quoteValidity">Quote validity (days)</Label>
                  <Input
                    id="quoteValidity"
                    type="number"
                    value={quoteValidity}
                    onChange={(e) => setQuoteValidity(e.target.value)}
                  />
                </div>
              </div>

              {/* Summary */}
              <div
                className="rounded-lg p-4 space-y-2 text-sm"
                style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <p className="font-medium mb-3" style={{ color: "#0f172a" }}>
                  Configuration Summary
                </p>
                {[
                  ["Company", companyName || "—"],
                  ["Phone", phone || "—"],
                  ["Printer", printerName ? `${printerName} (${printerModel})` : "—"],
                  ["Filament colors", Object.keys(selectedColors).filter((k) => selectedColors[k]).length.toString()],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span style={{ color: "#64748b" }}>{key}</span>
                    <span className="font-medium" style={{ color: "#0f172a" }}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack} className="gap-1">
                <ChevronLeft size={16} />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onSkip} className="gap-1">
              Skip Step
            </Button>
            <Button
              variant="ghost"
              onClick={currentStep === TOTAL_STEPS ? onComplete : onSkip}
              className="gap-1"
            >
              <X size={15} />
              Close
            </Button>
            <Button
              onClick={handleNext}
              className="gap-1 text-white"
              style={{ backgroundColor: "#1e3a8a" }}
            >
              {currentStep === TOTAL_STEPS ? "Finish" : "Next"}
              {currentStep < TOTAL_STEPS && <ChevronRight size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
