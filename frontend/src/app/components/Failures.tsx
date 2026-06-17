import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

type FailureReason =
  | "Nozzle Clog"
  | "Bed Adhesion"
  | "Layer Shift"
  | "Filament Tangle"
  | "Power Outage"
  | "Stringing"
  | "Warping"
  | "Under Extrusion"
  | "Over Extrusion"
  | "Broken Part"
  | "Wrong Settings"
  | "Filament Ran Out"
  | "Machine Error"
  | "Other";

interface PrintFailure {
  id: string;
  date: string;
  reason: FailureReason;
  source: "Manual" | "Order";
  orderId?: string;
  filamentLost: number;
  timeLost: number;
  estCost: number;
  notes: string;
}

const FAILURE_REASONS: FailureReason[] = [
  "Nozzle Clog",
  "Bed Adhesion",
  "Layer Shift",
  "Filament Tangle",
  "Power Outage",
  "Stringing",
  "Warping",
  "Under Extrusion",
  "Over Extrusion",
  "Broken Part",
  "Wrong Settings",
  "Filament Ran Out",
  "Machine Error",
  "Other",
];

const MOCK_FAILURES: PrintFailure[] = [
  { id: "1", date: "2026-06-01", reason: "Nozzle Clog",      source: "Order",  orderId: "ORD-001", filamentLost: 45,  timeLost: 90,  estCost: 22.5,  notes: "Partial print" },
  { id: "2", date: "2026-06-03", reason: "Bed Adhesion",     source: "Manual",                     filamentLost: 80,  timeLost: 120, estCost: 40,    notes: "Forgot bed leveling" },
  { id: "3", date: "2026-06-05", reason: "Layer Shift",      source: "Order",  orderId: "ORD-004", filamentLost: 120, timeLost: 180, estCost: 60,    notes: "Vibration issue" },
  { id: "4", date: "2026-06-07", reason: "Filament Tangle",  source: "Manual",                     filamentLost: 30,  timeLost: 60,  estCost: 15,    notes: "" },
  { id: "5", date: "2026-06-09", reason: "Warping",          source: "Order",  orderId: "ORD-007", filamentLost: 95,  timeLost: 150, estCost: 47.5,  notes: "ABS without enclosure" },
  { id: "6", date: "2026-06-11", reason: "Power Outage",     source: "Manual",                     filamentLost: 200, timeLost: 240, estCost: 100,   notes: "Grid outage 2h" },
  { id: "7", date: "2026-06-13", reason: "Wrong Settings",   source: "Order",  orderId: "ORD-010", filamentLost: 60,  timeLost: 90,  estCost: 30,    notes: "Wrong temp profile" },
  { id: "8", date: "2026-06-15", reason: "Under Extrusion",  source: "Manual",                     filamentLost: 50,  timeLost: 75,  estCost: 25,    notes: "Partial clog" },
];

const emptyForm = {
  date: "",
  reason: "Nozzle Clog" as FailureReason,
  source: "Manual" as "Manual" | "Order",
  orderId: "",
  filamentLost: "",
  timeLost: "",
  notes: "",
};

const COST_PER_GRAM = 1.2;

export function Failures() {
  const [failures, setFailures] = useState<PrintFailure[]>(MOCK_FAILURES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");

  const filtered = useMemo(() => {
    return failures.filter((f) => {
      const reasonOk = filterReason === "all" || f.reason === filterReason;
      const sourceOk = filterSource === "all" || f.source === filterSource;
      return reasonOk && sourceOk;
    });
  }, [failures, filterReason, filterSource]);

  const totalFilament = useMemo(() => filtered.reduce((s, f) => s + f.filamentLost, 0), [filtered]);
  const totalMinutes = useMemo(() => filtered.reduce((s, f) => s + f.timeLost, 0), [filtered]);

  function handleDelete() {
    if (!selectedId) return;
    setFailures((prev) => prev.filter((f) => f.id !== selectedId));
    setSelectedId(null);
  }

  function openAdd() {
    setForm(emptyForm);
    setShowDialog(true);
  }

  function handleSave() {
    const newFailure: PrintFailure = {
      id: String(Date.now()),
      date: form.date,
      reason: form.reason,
      source: form.source,
      orderId: form.source === "Order" ? form.orderId : undefined,
      filamentLost: Number(form.filamentLost),
      timeLost: Number(form.timeLost),
      estCost: Number(form.filamentLost) * COST_PER_GRAM,
      notes: form.notes,
    };
    setFailures((prev) => [...prev, newFailure]);
    setSelectedId(newFailure.id);
    setShowDialog(false);
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
              <Plus /> Log Failure
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={!selectedId}
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
            >
              <Trash2 /> Delete
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-3 flex-wrap">
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-48 h-8 text-sm">
              <SelectValue placeholder="All Reasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {FAILURE_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
              <SelectItem value="Order">Order</SelectItem>
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
              <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{filtered.length}</p>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa" }}>
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-1" style={{ color: "#f59e0b" }}>Filament Lost</p>
              <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>{totalFilament} g</p>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: "#f8fafc" }}>
                  {["Date", "Reason", "Source", "Filament Lost (g)", "Time (min)", "Est. Cost (EGP)", "Notes"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#64748b" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
                    className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                    style={{ backgroundColor: selectedId === f.id ? "#fffbeb" : undefined }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748b" }}>{f.date}</td>
                    <td className="px-4 py-3">
                      <Badge
                        className="text-xs"
                        style={{ backgroundColor: "#fff7ed", color: "#f59e0b", border: "1px solid #fed7aa" }}
                      >
                        {f.reason}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {f.source === "Order" ? (
                        <span className="flex items-center gap-1.5">
                          <Badge className="text-xs" style={{ backgroundColor: "#eff6ff", color: "#1e3a8a", border: "none" }}>
                            Order
                          </Badge>
                          {f.orderId && (
                            <span className="text-xs" style={{ color: "#64748b" }}>{f.orderId}</span>
                          )}
                        </span>
                      ) : (
                        <Badge className="text-xs" style={{ backgroundColor: "#f1f5f9", color: "#64748b", border: "none" }}>
                          Manual
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{f.filamentLost}</td>
                    <td className="px-4 py-3" style={{ color: "#0f172a" }}>{f.timeLost}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#ef4444" }}>{f.estCost.toFixed(2)}</td>
                    <td className="px-4 py-3 max-w-[180px] truncate" style={{ color: "#64748b" }}>{f.notes || "—"}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "#64748b" }}>
                      No failures recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v as "Manual" | "Order" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Order">Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.source === "Order" && (
              <div className="space-y-1.5">
                <Label>Order ID</Label>
                <Input value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} placeholder="ORD-001" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v as FailureReason })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAILURE_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Filament Lost (g)</Label>
                <Input type="number" value={form.filamentLost} onChange={(e) => setForm({ ...form, filamentLost: e.target.value })} placeholder="0" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Time Lost (min)</Label>
                <Input type="number" value={form.timeLost} onChange={(e) => setForm({ ...form, timeLost: e.target.value })} placeholder="0" min="0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What happened?" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} style={{ backgroundColor: "#1e3a8a" }}>
              Log Failure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
