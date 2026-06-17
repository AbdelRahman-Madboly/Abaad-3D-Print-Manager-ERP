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
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { api } from "@/lib/api";

// ── Settings key mapping ──────────────────────────────────────────────────────

const DEFAULTS = {
  companyName:      "PrintShop Pro",
  appSubtitle:      "3D Printing Services",
  phone:            "",
  address:          "",
  tagline:          "",
  socialHandle:     "",
  ratePerGram:      "4.00",
  costPerGram:      "1.20",
  currency:         "EGP",
  depositPercent:   "50",
  quoteValidity:    "7",
  nextOrderNumber:  "1",
};

type FormKeys = typeof DEFAULTS;

function dbToForm(db: Record<string, string>): FormKeys {
  return {
    companyName:     db.company_name          ?? DEFAULTS.companyName,
    appSubtitle:     db.company_subtitle      ?? DEFAULTS.appSubtitle,
    phone:           db.company_phone         ?? DEFAULTS.phone,
    address:         db.company_address       ?? DEFAULTS.address,
    tagline:         db.company_tagline       ?? DEFAULTS.tagline,
    socialHandle:    db.company_social        ?? DEFAULTS.socialHandle,
    ratePerGram:     db.default_rate_per_gram ?? DEFAULTS.ratePerGram,
    costPerGram:     db.default_cost_per_gram ?? DEFAULTS.costPerGram,
    currency:        db.currency_symbol       ?? DEFAULTS.currency,
    depositPercent:  db.deposit_percent       ?? DEFAULTS.depositPercent,
    quoteValidity:   db.quote_validity_days   ?? DEFAULTS.quoteValidity,
    nextOrderNumber: db.next_order_number     ?? DEFAULTS.nextOrderNumber,
  };
}

function formToDb(form: FormKeys): Record<string, string> {
  return {
    company_name:           form.companyName,
    company_subtitle:       form.appSubtitle,
    company_phone:          form.phone,
    company_address:        form.address,
    company_tagline:        form.tagline,
    company_social:         form.socialHandle,
    default_rate_per_gram:  form.ratePerGram,
    default_cost_per_gram:  form.costPerGram,
    currency_symbol:        form.currency,
    deposit_percent:        form.depositPercent,
    quote_validity_days:    form.quoteValidity,
    next_order_number:      form.nextOrderNumber,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Settings() {
  const [form, setForm]           = useState<FormKeys>(DEFAULTS);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

  useEffect(() => {
    api.get<Record<string, string>>("/api/settings")
      .then((data) => setForm(dbToForm(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set(field: keyof FormKeys) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.post("/api/settings", formToDb(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  function handleBackup() {
    setBackupMsg("Backup feature requires server-side support.");
    setTimeout(() => setBackupMsg(""), 3000);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: "#f8fafc" }}>
        <Loader2 className="animate-spin size-6" style={{ color: "#1e3a8a" }} />
      </div>
    );
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
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#1e3a8a" }}>
              {saving
                ? <Loader2 className="size-4 mr-1 animate-spin" />
                : <Save className="size-4 mr-1" />}
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
                <Label>Company Name <span style={{ color: "#ef4444" }}>*</span></Label>
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

            <div className="space-y-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                <div
                  className="rounded-lg overflow-hidden flex items-center justify-center"
                  style={{ width: 60, height: 60, backgroundColor: "#e2e8f0", border: "1px dashed #94a3b8", flexShrink: 0 }}
                >
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <label>
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">Browse…</span>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Rate per gram (EGP)</Label>
                <Input type="number" step="0.01" value={form.ratePerGram} onChange={set("ratePerGram")} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost per gram (EGP)</Label>
                <Input type="number" step="0.01" value={form.costPerGram} onChange={set("costPerGram")} />
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
                <Download className="size-4 mr-1" />
                Backup Database
              </Button>
              <Button variant="outline" disabled>
                <FileDown className="size-4 mr-1" />
                Export to CSV
              </Button>
            </div>
            {backupMsg && (
              <div
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md"
                style={{ backgroundColor: "#ecfdf5", color: "#10b981", border: "1px solid #a7f3d0" }}
              >
                <CheckCircle className="size-4 shrink-0" />
                {backupMsg}
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
