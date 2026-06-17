import { useState } from "react";
import {
  Printer,
  Plus,
  Pencil,
  Wrench,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";

interface PrinterItem {
  id: string;
  name: string;
  model: string;
  purchasePrice: number;
  powerKwh: number;
  nozzleCost: number;
  nozzleLifeGrams: number;
  nozzleUsedGrams: number;
  lifetimePrintedGrams: number;
  status: "Active" | "Inactive";
}

const MOCK_PRINTERS: PrinterItem[] = [
  {
    id: "1",
    name: "Printer 1",
    model: "Bambu X1C",
    purchasePrice: 15000,
    powerKwh: 0.4,
    nozzleCost: 35,
    nozzleLifeGrams: 1000,
    nozzleUsedGrams: 820,
    lifetimePrintedGrams: 12400,
    status: "Active",
  },
  {
    id: "2",
    name: "Printer 2",
    model: "Creality Ender 3 V3",
    purchasePrice: 4500,
    powerKwh: 0.25,
    nozzleCost: 15,
    nozzleLifeGrams: 800,
    nozzleUsedGrams: 160,
    lifetimePrintedGrams: 4800,
    status: "Active",
  },
  {
    id: "3",
    name: "Printer 3",
    model: "Prusa MK4",
    purchasePrice: 8000,
    powerKwh: 0.35,
    nozzleCost: 25,
    nozzleLifeGrams: 900,
    nozzleUsedGrams: 0,
    lifetimePrintedGrams: 0,
    status: "Inactive",
  },
];

const LIFETIME_MAX = 50000; // arbitrary max grams for lifetime progress bar

const emptyForm = {
  name: "",
  model: "",
  purchasePrice: "",
  powerKwh: "",
  nozzleCost: "",
  nozzleLifeGrams: "",
};

export function Printers() {
  const [printers, setPrinters] = useState<PrinterItem[]>(MOCK_PRINTERS);
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const selected = printers.find((p) => p.id === selectedId) ?? null;

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit() {
    if (!selected) return;
    setEditingId(selected.id);
    setForm({
      name: selected.name,
      model: selected.model,
      purchasePrice: String(selected.purchasePrice),
      powerKwh: String(selected.powerKwh),
      nozzleCost: String(selected.nozzleCost),
      nozzleLifeGrams: String(selected.nozzleLifeGrams),
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (editingId) {
      setPrinters((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name: form.name,
                model: form.model,
                purchasePrice: Number(form.purchasePrice),
                powerKwh: Number(form.powerKwh),
                nozzleCost: Number(form.nozzleCost),
                nozzleLifeGrams: Number(form.nozzleLifeGrams),
              }
            : p
        )
      );
    } else {
      const newPrinter: PrinterItem = {
        id: String(Date.now()),
        name: form.name,
        model: form.model,
        purchasePrice: Number(form.purchasePrice),
        powerKwh: Number(form.powerKwh),
        nozzleCost: Number(form.nozzleCost),
        nozzleLifeGrams: Number(form.nozzleLifeGrams),
        nozzleUsedGrams: 0,
        lifetimePrintedGrams: 0,
        status: "Active",
      };
      setPrinters((prev) => [...prev, newPrinter]);
      setSelectedId(newPrinter.id);
    }
    setShowDialog(false);
  }

  function handleResetNozzle() {
    if (!selectedId) return;
    setPrinters((prev) =>
      prev.map((p) =>
        p.id === selectedId ? { ...p, nozzleUsedGrams: 0 } : p
      )
    );
  }

  function calcDepreciation(p: PrinterItem) {
    if (p.lifetimePrintedGrams === 0) return 0;
    return p.purchasePrice / p.lifetimePrintedGrams;
  }

  function calcElectricity(p: PrinterItem) {
    return p.powerKwh * 0.45;
  }

  function calcNozzle(p: PrinterItem) {
    return p.nozzleCost / p.nozzleLifeGrams;
  }

  const nozzlePct = selected
    ? Math.min(100, (selected.nozzleUsedGrams / selected.nozzleLifeGrams) * 100)
    : 0;
  const lifetimePct = selected
    ? Math.min(100, (selected.lifetimePrintedGrams / LIFETIME_MAX) * 100)
    : 0;
  const nozzleWarning = nozzlePct > 80;

  return (
    <div className="flex h-full">
      {/* LEFT PANEL */}
      <div className="w-[360px] border-r bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Printer className="size-5" style={{ color: "#1e3a8a" }} />
            <span className="font-semibold text-base" style={{ color: "#0f172a" }}>
              Printers
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={openAdd} style={{ backgroundColor: "#1e3a8a" }}>
              <Plus />
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={openEdit} disabled={!selected}>
              <Pencil />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={handleResetNozzle} disabled={!selected}>
              <Wrench />
              Reset Nozzle
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
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
                  style={{
                    backgroundColor: selectedId === p.id ? "#eff6ff" : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{p.name}</td>
                  <td className="px-4 py-3" style={{ color: "#64748b" }}>{p.model}</td>
                  <td className="px-4 py-3 text-right" style={{ color: "#0f172a" }}>
                    {(p.lifetimePrintedGrams / 1000).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: p.status === "Active" ? "#dcfce7" : "#f1f5f9",
                        color: p.status === "Active" ? "#10b981" : "#64748b",
                        border: "none",
                      }}
                    >
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <CardTitle className="text-xl" style={{ color: "#0f172a" }}>
                      {selected.name}
                    </CardTitle>
                    <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{selected.model}</p>
                  </div>
                  <Badge
                    style={{
                      backgroundColor: selected.status === "Active" ? "#dcfce7" : "#f1f5f9",
                      color: selected.status === "Active" ? "#10b981" : "#64748b",
                      border: "none",
                    }}
                  >
                    {selected.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "#64748b" }}>
                      Purchase Price
                    </p>
                    <p className="text-base font-semibold" style={{ color: "#0f172a" }}>
                      EGP {selected.purchasePrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide mb-0.5" style={{ color: "#64748b" }}>
                      Power Consumption
                    </p>
                    <p className="text-base font-semibold" style={{ color: "#0f172a" }}>
                      {selected.powerKwh} kWh
                    </p>
                  </div>
                </div>

                {/* Mini cost cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#1e3a8a" }}>Depreciation/g</p>
                    <p className="text-sm font-bold" style={{ color: "#1e3a8a" }}>
                      {calcDepreciation(selected).toFixed(4)} EGP
                    </p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#10b981" }}>Electricity/g</p>
                    <p className="text-sm font-bold" style={{ color: "#10b981" }}>
                      {calcElectricity(selected).toFixed(4)} EGP
                    </p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "#7c3aed" }}>Nozzle/g</p>
                    <p className="text-sm font-bold" style={{ color: "#7c3aed" }}>
                      {calcNozzle(selected).toFixed(4)} EGP
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
                    Used: {selected.nozzleUsedGrams} g / {selected.nozzleLifeGrams} g life
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: nozzleWarning ? "#f59e0b" : "#0f172a" }}
                  >
                    {nozzlePct.toFixed(0)}%
                  </span>
                </div>
                {/* using raw div for colored progress since shadcn Progress uses CSS var --primary */}
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: "#e2e8f0" }}>
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${nozzlePct}%`,
                      backgroundColor: nozzleWarning ? "#f59e0b" : "#10b981",
                    }}
                  />
                </div>
                {nozzleWarning && (
                  <p className="text-xs font-medium" style={{ color: "#f59e0b" }}>
                    Warning: Nozzle wear exceeds 80% — consider replacement soon.
                  </p>
                )}
                <Button size="sm" variant="outline" onClick={handleResetNozzle}>
                  <Wrench />
                  Reset Nozzle
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
                    Total printed: {selected.lifetimePrintedGrams.toLocaleString()} g
                  </span>
                  <span className="font-semibold" style={{ color: "#0f172a" }}>
                    {lifetimePct.toFixed(1)}% of {(LIFETIME_MAX / 1000).toFixed(0)} kg max
                  </span>
                </div>
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: "#e2e8f0" }}>
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{ width: `${lifetimePct}%`, backgroundColor: "#1e3a8a" }}
                  />
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
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Printer 4" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Bambu X1C" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Purchase Price (EGP)</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="15000" />
              </div>
              <div className="space-y-1.5">
                <Label>Power (kWh)</Label>
                <Input type="number" value={form.powerKwh} onChange={(e) => setForm({ ...form, powerKwh: e.target.value })} placeholder="0.4" step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label>Nozzle Cost (EGP)</Label>
                <Input type="number" value={form.nozzleCost} onChange={(e) => setForm({ ...form, nozzleCost: e.target.value })} placeholder="35" />
              </div>
              <div className="space-y-1.5">
                <Label>Nozzle Life (g)</Label>
                <Input type="number" value={form.nozzleLifeGrams} onChange={(e) => setForm({ ...form, nozzleLifeGrams: e.target.value })} placeholder="1000" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} style={{ backgroundColor: "#1e3a8a" }}>
              {editingId ? "Save Changes" : "Add Printer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
