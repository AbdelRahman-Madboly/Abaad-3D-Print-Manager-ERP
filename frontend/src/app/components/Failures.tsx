import { useState, useEffect, useMemo } from "react";
import { AlertTriangle, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PrintFailure {
  id: string;
  date: string;
  reason: string;
  source: string;
  order_id?: string;
  item_name?: string;
  filament_wasted_grams: number;
  time_wasted_minutes: number;
  total_loss: number;
  description: string;
}

const FAILURE_REASONS = [
  "Nozzle Clog", "Bed Adhesion", "Layer Shift", "Filament Tangle",
  "Power Outage", "Stringing/Blobs", "Warping", "Under Extrusion",
  "Over Extrusion", "Broken Part", "Wrong Settings", "Filament Ran Out",
  "Machine Error", "Other",
];

const FAILURE_SOURCES = [
  "Customer Order", "R&D Project", "Personal/Test", "Other",
];

const emptyForm = {
  date:                  new Date().toISOString().slice(0, 10),
  reason:                "Nozzle Clog",
  source:                "Other",
  order_id:              "",
  item_name:             "",
  filament_wasted_grams: "",
  time_wasted_minutes:   "",
  description:           "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Failures() {
  const [failures, setFailures]     = useState<PrintFailure[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterReason !== "all") params.set("reason", filterReason);
    if (filterSource !== "all") params.set("source", filterSource);
    const qs = params.toString() ? `?${params.toString()}` : "";
    api.get<PrintFailure[]>(`/api/failures${qs}`)
      .then(setFailures)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filterReason, filterSource]);

  const totalFilament = useMemo(() => failures.reduce((s, f) => s + f.filament_wasted_grams, 0), [failures]);
  const totalMinutes  = useMemo(() => failures.reduce((s, f) => s + f.time_wasted_minutes, 0), [failures]);

  async function handleDelete() {
    if (!selectedId) return;
    try {
      await api.delete(`/api/failures/${selectedId}`);
      setFailures((prev) => prev.filter((f) => f.id !== selectedId));
      setSelectedId(null);
    } catch {
      // silently fail
    }
  }

  function openAdd() {
    setForm(emptyForm);
    setShowDialog(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        date:                  form.date,
        reason:                form.reason,
        source:                form.source,
        order_id:              form.order_id,
        item_name:             form.item_name,
        filament_wasted_grams: Number(form.filament_wasted_grams),
        time_wasted_minutes:   Number(form.time_wasted_minutes),
        description:           form.description,
        color:                 "",
        spool_id:              "",
        printer_id:            "",
        printer_name:          "",
      };
      const created = await api.post<PrintFailure>("/api/failures", body);
      setFailures((prev) => [...prev, created]);
      setSelectedId(created.id);
      setShowDialog(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f8fafc" }}>
      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5" style={{ color: "#f59e0b" }} />
            <span className="font-semibold text-base" style={{ color: "#0f172a" }}>Print Failures</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={openAdd} style={{ backgroundColor: "#1e3a8a" }}>
              <Plus size={14} className="mr-1" /> Log Failure
            </Button>
            <Button
              size="sm" variant="outline" onClick={handleDelete} disabled={!selectedId}
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
            >
              <Trash2 size={14} className="mr-1" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mt-3 flex-wrap">
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {FAILURE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {FAILURE_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pt-5 pb-3">
        <div className="grid grid-cols-3 gap-3 max-w-xl">
          <Card style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa" }}>
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-1" style={{ color: "#f59e0b" }}>Total Failures</p>
              <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{failures.length}</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa" }}>
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-1" style={{ color: "#f59e0b" }}>Filament Lost</p>
              <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{totalFilament.toFixed(0)} g</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa" }}>
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-1" style={{ color: "#f59e0b" }}>Time Lost</p>
              <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                {(totalMinutes / 60).toFixed(1)} hrs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 pb-6 flex-1 overflow-auto">
        <Card style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
          <div className="overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin size-6" style={{ color: "#1e3a8a" }} />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ backgroundColor: "#f8fafc" }}>
                    {["Date", "Reason", "Source", "Filament Lost (g)", "Time (min)", "Est. Cost (EGP)", "Notes"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#64748b" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {failures.map((f) => (
                    <tr
                      key={f.id}
                      onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
                      className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                      style={{ backgroundColor: selectedId === f.id ? "#fffbeb" : undefined }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748b" }}>{f.date.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs" style={{ backgroundColor: "#fff7ed", color: "#f59e0b", border: "1px solid #fed7aa" }}>
                          {f.reason}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="text-xs" style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "none" }}>
                          {f.source}
                        </Badge>
                        {f.order_id && (
                          <span className="ml-1.5 text-xs" style={{ color: "#64748b" }}>{f.order_id}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{f.filament_wasted_grams.toFixed(0)}</td>
                      <td className="px-4 py-3" style={{ color: "#0f172a" }}>{f.time_wasted_minutes}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#ef4444" }}>
                        {(f.total_loss ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: "#64748b" }}>
                        {f.description || "—"}
                      </td>
                    </tr>
                  ))}
                  {failures.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "#64748b" }}>
                        No failures recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Log Failure Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Print Failure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FAILURE_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.source === "Customer Order" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Order ID</Label>
                  <Input value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} placeholder="Order ID" />
                </div>
                <div className="space-y-1.5">
                  <Label>Item Name</Label>
                  <Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Print item name" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FAILURE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Filament Lost (g)</Label>
                <Input type="number" value={form.filament_wasted_grams} onChange={(e) => setForm({ ...form, filament_wasted_grams: e.target.value })} placeholder="0" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Time Lost (min)</Label>
                <Input type="number" value={form.time_wasted_minutes} onChange={(e) => setForm({ ...form, time_wasted_minutes: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened?" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "#1e3a8a" }}>
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Log Failure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
