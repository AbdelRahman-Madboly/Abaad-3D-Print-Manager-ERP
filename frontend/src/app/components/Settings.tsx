import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Building2,
  DollarSign,
  FileText,
  Database,
  Info,
  Download,
  FileDown,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

const DEFAULTS = {
  companyName: "PrintShop Pro",
  appSubtitle: "3D Printing Services",
  phone: "010-1234-5678",
  address: "Cairo, Egypt",
  tagline: "Bringing Your Ideas to Life",
  socialHandle: "@printshoppro",
  ratePerGram: "3.50",
  costPerGram: "1.20",
  electricityRate: "0.45",
  currency: "EGP",
  depositPercent: "30",
  quoteValidity: "7",
  nextOrderNumber: "007",
};

export function Settings() {
  const [form, setForm] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  function set(field: keyof typeof DEFAULTS) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleSave() {
    setSaved(true);
  }

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  function handleBackup() {
    setBackupMsg("Backup created successfully.");
    setTimeout(() => setBackupMsg(""), 3000);
  }

  function handleExport() {
    setExportMsg("Data exported to CSV.");
    setTimeout(() => setExportMsg(""), 3000);
  }

  return (
    <div className="h-full overflow-auto" style={{ backgroundColor: "#f8fafc" }}>
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="size-5" style={{ color: "#1e3a8a" }} />
            <h1 className="text-xl font-bold" style={{ color: "#0f172a" }}>Settings</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#10b981" }}>
                <CheckCircle className="size-4" />
                Settings saved!
              </div>
            )}
            <Button onClick={handleSave} style={{ backgroundColor: "#1e3a8a" }}>
              <Save />
              Save All Settings
            </Button>
          </div>
        </div>

        {/* 1. Company Information */}
        <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#0f172a" }}>
              <Building2 className="size-4" style={{ color: "#1e3a8a" }} />
              Company Information
            </CardTitle>
          </CardHeader>
          <Separator style={{ borderColor: "#e2e8f0" }} />
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Company Name <span style={{ color: "#ef4444" }}>*</span>
                </Label>
                <Input value={form.companyName} onChange={set("companyName")} required />
              </div>
              <div className="space-y-1.5">
                <Label>App Subtitle</Label>
                <Input value={form.appSubtitle} onChange={set("appSubtitle")} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={set("address")} />
              </div>
              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input value={form.tagline} onChange={set("tagline")} />
              </div>
              <div className="space-y-1.5">
                <Label>Social Handle</Label>
                <Input value={form.socialHandle} onChange={set("socialHandle")} />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {/* Placeholder thumbnail */}
                <div
                  className="rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{
                    width: 60,
                    height: 60,
                    backgroundColor: "#e2e8f0",
                    color: "#64748b",
                    border: "1px dashed #94a3b8",
                    flexShrink: 0,
                  }}
                >
                  Logo
                </div>
                {/* using raw input[type=file] because shadcn Input doesn't expose a styled file trigger */}
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">Browse...</span>
                  </Button>
                  <input type="file" accept="image/*" className="sr-only" />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Pricing Defaults */}
        <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#0f172a" }}>
              <DollarSign className="size-4" style={{ color: "#10b981" }} />
              Pricing Defaults
            </CardTitle>
          </CardHeader>
          <Separator style={{ borderColor: "#e2e8f0" }} />
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rate per gram (EGP)</Label>
                <Input type="number" step="0.01" value={form.ratePerGram} onChange={set("ratePerGram")} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost per gram (EGP)</Label>
                <Input type="number" step="0.01" value={form.costPerGram} onChange={set("costPerGram")} />
              </div>
              <div className="space-y-1.5">
                <Label>Electricity rate (EGP/kWh)</Label>
                <Input type="number" step="0.01" value={form.electricityRate} onChange={set("electricityRate")} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency symbol</Label>
                <Input value={form.currency} onChange={set("currency")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Quote & Invoice */}
        <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#0f172a" }}>
              <FileText className="size-4" style={{ color: "#7c3aed" }} />
              Quote &amp; Invoice
            </CardTitle>
          </CardHeader>
          <Separator style={{ borderColor: "#e2e8f0" }} />
          <CardContent className="pt-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Deposit (%)</Label>
                <Input type="number" min="0" max="100" value={form.depositPercent} onChange={set("depositPercent")} />
              </div>
              <div className="space-y-1.5">
                <Label>Quote validity (days)</Label>
                <Input type="number" min="1" value={form.quoteValidity} onChange={set("quoteValidity")} />
              </div>
              <div className="space-y-1.5">
                <Label>Next order #</Label>
                <Input value={form.nextOrderNumber} onChange={set("nextOrderNumber")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Data Management */}
        <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#0f172a" }}>
              <Database className="size-4" style={{ color: "#06b6d4" }} />
              Data Management
            </CardTitle>
          </CardHeader>
          <Separator style={{ borderColor: "#e2e8f0" }} />
          <CardContent className="pt-5 space-y-4">
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={handleBackup}>
                <Download />
                Backup Database
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <FileDown />
                Export to CSV
              </Button>
            </div>
            {(backupMsg || exportMsg) && (
              <div
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md"
                style={{ backgroundColor: "#ecfdf5", color: "#10b981", border: "1px solid #a7f3d0" }}
              >
                <CheckCircle className="size-4 shrink-0" />
                {backupMsg || exportMsg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 5. About */}
        <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base" style={{ color: "#0f172a" }}>
              <Info className="size-4" style={{ color: "#64748b" }} />
              About
            </CardTitle>
          </CardHeader>
          <Separator style={{ borderColor: "#e2e8f0" }} />
          <CardContent className="pt-5 space-y-1.5">
            <p className="font-bold text-lg" style={{ color: "#1e3a8a" }}>Abaad ERP v5.0.0</p>
            <p className="text-sm" style={{ color: "#64748b" }}>Professional 3D Printing Management</p>
            <p className="text-xs mt-3" style={{ color: "#94a3b8" }}>
              &copy; {new Date().getFullYear()} Abaad ERP. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
