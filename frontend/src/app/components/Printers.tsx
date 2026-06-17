import { useState, useEffect } from "react";
import { Printer, Plus, Pencil, Wrench, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PrinterItem {
  id: string;
  name: string;
  model: string;
  purchase_price: number;
  lifetime_kg: number;
  total_printed_grams: number;
  nozzle_cost: number;
  nozzle_lifetime_grams: number;
  current_nozzle_grams: number;
  electricity_rate_per_hour: number;
  is_active: boolean;
  notes: string;
  depreciation_per_gram: number;
  nozzle_usage_percent: number;
}

const emptyForm = {
  name: "",
  model: "",
  purchase_price: "",
  lifetime_kg: "500",
  nozzle_cost: "",
  nozzle_lifetime_grams: "",
  electricity_rate_per_hour: "0.45",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Printers() {
  const [printers, setPrinters]   = useState<PrinterItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  function load() {
    setLoading(true);
    api.get<PrinterItem[]>("/api/printers")
      .then((data) => {
        setPrinters(data);
        if (!selectedId && data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const selected = printers.find((p) => p.id === selectedId) ?? null;

  const nozzlePct     = selected ? Math.min(100, selected.nozzle_usage_percent) : 0;
  const lifetimePct   = selected ? Math.min(100, (selected.total_printed_grams / (selected.lifetime_kg * 1000)) * 100) : 0;
  const nozzleWarning = nozzlePct > 80;

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit() {
    if (!selected) return;
    setEditingId(selected.id);
    setForm({
      name:                      selected.name,
      model:                     selected.model,
      purchase_price:            String(selected.purchase_price),
      lifetime_kg:               String(selected.lifetime_kg),
      nozzle_cost:               String(selected.nozzle_cost),
      nozzle_lifetime_grams:     String(selected.nozzle_lifetime_grams),
      electricity_rate_per_hour: String(selected.electricity_rate_per_hour),
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.model.trim()) return;
    setSaving(true);
    try {
      const body = {
        name:                      form.name,
        model:                     form.model,
        purchase_price:            Number(form.purchase_price),
        lifetime_kg:               Number(form.lifetime_kg),
        nozzle_cost:               Number(form.nozzle_cost),
        nozzle_lifetime_grams:     Number(form.nozzle_lifetime_grams),
        electricity_rate_per_hour: Number(form.electricity_rate_per_hour),
        notes:                     "",
      };
      if (editingId) {
        const updated = await api.put<PrinterItem>(`/api/printers/${editingId}`, body);
        setPrinters((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      } else {
        const created = await api.post<PrinterItem>("/api/printers", body);
        setPrinters((prev) => [...prev, created]);
        setSelectedId(created.id);
      }
      setShowDialog(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleResetNozzle() {
    if (!selectedId) return;
    try {
      const updated = await api.post<PrinterItem>(`/api/printers/${selectedId}/reset-nozzle`, {});
      setPrinters((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex h-full">
      {/* LEFT PANEL */}
      <div className="w-[360px] border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Printer className="size-5" style={{ color: "#1e3a8a" }} />
            <span className="font-semibold text-base flex-1" style={{ color: "#0f172a" }}>Printers</span>
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={openAdd} style={{ backgroundColor: "#1e3a8a" }}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
            <Button size="sm" variant="outline" onClick={openEdit} disabled={!selected}>
              <Pencil size={14} className="mr-1" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetNozzle} disabled={!selected}>
              <Wrench size={14} className="mr-1" /> Reset Nozzle
            </Button>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin size-5" style={{ color: "#1e3a8a" }} />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: "#f8fafc" }}>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "#64748b" }}>Name</th>
                  <th className="text-left px-4 py-2 font-medium" style={{ color: "#64748b" }}>Model</th>
                  <th className="text-right px-4 py-2 font-medium" style={{ color: "#64748b" }}>Printed (kg)</th>
                  <th className="text-center px-4 py-2 font-medium" style={{ color: "#64748b" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {printers.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ backgroundColor: selectedId === p.id ? "#eff6ff" : undefined }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{p.name}</td>
                    <td className="px-4 py-3" style={{ color: "#64748b" }}>{p.model}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "#0f172a" }}>
                      {(p.total_printed_grams / 1000).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: p.is_active ? "#dcfce7" : "#f1f5f9",
                          color: p.is_active ? "#10b981" : "#64748b",
                          border: "none",
                        }}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {printers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center" style={{ color: "#64748b" }}>
                      No printers yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-6 overflow-auto" style={{ backgroundColor: "#f8fafc" }}>
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center" style={{ color: "#64748b" }}>
              <Printer className="size-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Select a printer</p>
              <p className="text-sm">Choose a printer from the list to view details</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl space-y-5">
            {/* Printer info card */}
            <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl" style={{ color: "#0f172a" }}>{selected.name}</CardTitle>
                    <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{selected.model}</p>
                  </div>
                  <Badge style={{
                    backgroundColor: selected.is_active ? "#dcfce7" : "#f1f5f9",
                    color: selected.is_active ? "#10b981" : "#64748b",
                    border: "none",
                  }}>
                    {selected.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "#64748b" }}>Purchase Price</p>
                    <p className="text-base font-semibold" style={{ color: "#0f172a" }}>EGP {selected.purchase_price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "#64748b" }}>Lifetime (kg)</p>
                    <p className="text-base font-semibold" style={{ color: "#0f172a" }}>{selected.lifetime_kg} kg</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#1e3a8a" }}>Depreciation/g</p>
                    <p className="text-sm font-bold" style={{ color: "#1e3a8a" }}>
                      {selected.depreciation_per_gram.toFixed(4)} EGP
                    </p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#10b981" }}>Electricity/hr</p>
                    <p className="text-sm font-bold" style={{ color: "#10b981" }}>
                      {selected.electricity_rate_per_hour.toFixed(2)} EGP
                    </p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#7c3aed" }}>Nozzle Cost</p>
                    <p className="text-sm font-bold" style={{ color: "#7c3aed" }}>
                      EGP {selected.nozzle_cost.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nozzle Wear */}
            <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                  Nozzle Wear
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "#64748b" }}>
                    Used: {Math.round(selected.current_nozzle_grams)} g / {selected.nozzle_lifetime_grams} g life
                  </span>
                  <span className="font-semibold" style={{ color: nozzleWarning ? "#f59e0b" : "#0f172a" }}>
                    {nozzlePct.toFixed(0)}%
                    {nozzleWarning && (
                      <Badge className="ml-1.5 text-[10px] px-1.5 py-0" style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "none" }}>
                        Replace soon
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: "#e2e8f0" }}>
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{ width: `${nozzlePct}%`, backgroundColor: nozzleWarning ? "#f59e0b" : "#10b981" }}
                  />
                </div>
                {nozzleWarning && (
                  <p className="text-xs font-medium" style={{ color: "#f59e0b" }}>
                    Warning: Nozzle wear exceeds 80% — consider replacement soon.
                  </p>
                )}
                <Button size="sm" variant="outline" onClick={handleResetNozzle}>
                  <Wrench size={14} className="mr-1" /> Reset Nozzle
                </Button>
              </CardContent>
            </Card>

            {/* Lifetime Usage */}
            <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                  Lifetime Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: "#64748b" }}>
                    Total printed: {selected.total_printed_grams.toLocaleString()} g
                  </span>
                  <span className="font-semibold" style={{ color: "#0f172a" }}>
                    {lifetimePct.toFixed(1)}% of {selected.lifetime_kg} kg max
                  </span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: "#e2e8f0" }}>
                  <div className="h-2.5 rounded-full transition-all" style={{ width: `${lifetimePct}%`, backgroundColor: "#1e3a8a" }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Printer" : "Add Printer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Printer 4" />
            </div>
            <div className="space-y-1.5">
              <Label>Model <span className="text-red-500">*</span></Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Bambu X1C" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Purchase Price (EGP)</Label>
                <Input type="number" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} placeholder="15000" />
              </div>
              <div className="space-y-1.5">
                <Label>Lifetime (kg)</Label>
                <Input type="number" value={form.lifetime_kg} onChange={(e) => setForm({ ...form, lifetime_kg: e.target.value })} placeholder="500" />
              </div>
              <div className="space-y-1.5">
                <Label>Nozzle Cost (EGP)</Label>
                <Input type="number" value={form.nozzle_cost} onChange={(e) => setForm({ ...form, nozzle_cost: e.target.value })} placeholder="35" />
              </div>
              <div className="space-y-1.5">
                <Label>Nozzle Life (g)</Label>
                <Input type="number" value={form.nozzle_lifetime_grams} onChange={(e) => setForm({ ...form, nozzle_lifetime_grams: e.target.value })} placeholder="1000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.model.trim() || saving}
              style={{ backgroundColor: "#1e3a8a" }}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              {editingId ? "Save Changes" : "Add Printer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
