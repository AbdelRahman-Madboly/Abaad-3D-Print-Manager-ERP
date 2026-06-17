import { useState } from "react";
import {
  Layers,
  Plus,
  Palette,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FilamentSpool {
  id: string;
  color: string;
  colorHex: string;
  brand: string;
  type: string;
  totalWeight: number;
  remainingWeight: number;
  purchasePrice: number;
  notes: string;
  status: "Active" | "Trash";
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const initialSpools: FilamentSpool[] = [
  { id: "1", color: "Black",  colorHex: "#1f2937", brand: "eSUN",    type: "PLA",  totalWeight: 1000, remainingWeight: 870, purchasePrice: 180, notes: "",             status: "Active" },
  { id: "2", color: "White",  colorHex: "#f9fafb", brand: "eSUN",    type: "PLA",  totalWeight: 1000, remainingWeight: 620, purchasePrice: 180, notes: "",             status: "Active" },
  { id: "3", color: "Blue",   colorHex: "#3b82f6", brand: "Bambu",   type: "PLA",  totalWeight: 1000, remainingWeight: 110, purchasePrice: 220, notes: "Low stock",    status: "Active" },
  { id: "4", color: "Red",    colorHex: "#ef4444", brand: "eSUN",    type: "PETG", totalWeight: 1000, remainingWeight: 450, purchasePrice: 200, notes: "",             status: "Active" },
  { id: "5", color: "Gray",   colorHex: "#9ca3af", brand: "Generic", type: "PLA",  totalWeight: 1000, remainingWeight: 780, purchasePrice: 150, notes: "",             status: "Active" },
  { id: "6", color: "Yellow", colorHex: "#eab308", brand: "Bambu",   type: "PLA",  totalWeight: 1000, remainingWeight: 320, purchasePrice: 220, notes: "",             status: "Active" },
  { id: "7", color: "Orange", colorHex: "#f97316", brand: "eSUN",    type: "ABS",  totalWeight: 1000, remainingWeight: 55,  purchasePrice: 190, notes: "Almost empty", status: "Trash"  },
];

const MATERIAL_TYPES = ["PLA", "PETG", "ABS", "TPU", "ASA", "Other"];

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm: Omit<FilamentSpool, "id" | "status"> = {
  color: "",
  colorHex: "#000000",
  brand: "",
  type: "PLA",
  totalWeight: 1000,
  remainingWeight: 1000,
  purchasePrice: 0,
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Filament() {
  const [spools, setSpools]               = useState<FilamentSpool[]>(initialSpools);
  const [searchQuery, setSearchQuery]     = useState("");
  const [showFilter, setShowFilter]       = useState<"Active" | "Trash" | "All">("Active");
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [showDialog, setShowDialog]       = useState(false);
  const [editingSpool, setEditingSpool]   = useState<FilamentSpool | null>(null);
  const [form, setForm]                   = useState<Omit<FilamentSpool, "id" | "status">>(emptyForm);
  const [dialogMode, setDialogMode]       = useState<"standard" | "remaining">("standard");

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = spools.filter((s) => {
    const matchesFilter =
      showFilter === "All" ? true : s.status === showFilter;
    const matchesSearch =
      s.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalWeight     = filtered.reduce((sum, s) => sum + s.totalWeight, 0);
  const totalAvailable  = filtered.reduce((sum, s) => sum + s.remainingWeight, 0);
  const activeCount     = filtered.filter((s) => s.status === "Active").length;

  const selectedSpool = spools.find((s) => s.id === selectedId) ?? null;

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  function openStandardAdd() {
    setEditingSpool(null);
    setDialogMode("standard");
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openRemainingAdd() {
    setEditingSpool(null);
    setDialogMode("remaining");
    setForm({ ...emptyForm, totalWeight: 0 });
    setShowDialog(true);
  }

  function openEdit() {
    if (!selectedSpool) return;
    setEditingSpool(selectedSpool);
    setDialogMode("standard");
    setForm({
      color:           selectedSpool.color,
      colorHex:        selectedSpool.colorHex,
      brand:           selectedSpool.brand,
      type:            selectedSpool.type,
      totalWeight:     selectedSpool.totalWeight,
      remainingWeight: selectedSpool.remainingWeight,
      purchasePrice:   selectedSpool.purchasePrice,
      notes:           selectedSpool.notes,
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (!form.color.trim() || !form.brand.trim()) return;
    if (editingSpool) {
      setSpools((prev) =>
        prev.map((s) => s.id === editingSpool.id ? { ...s, ...form } : s)
      );
    } else {
      const newSpool: FilamentSpool = {
        id: String(Date.now()),
        ...form,
        status: "Active",
      };
      setSpools((prev) => [...prev, newSpool]);
    }
    setShowDialog(false);
  }

  function handleToggleTrash() {
    if (!selectedSpool) return;
    setSpools((prev) =>
      prev.map((s) =>
        s.id === selectedSpool.id
          ? { ...s, status: s.status === "Active" ? "Trash" : "Active" }
          : s
      )
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full p-5 gap-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── TOOLBAR ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Layers size={20} style={{ color: "#1e3a8a" }} />
          <span className="font-semibold text-base" style={{ color: "#0f172a" }}>
            Filament Inventory
          </span>
        </div>

        <Button
          size="sm"
          onClick={openStandardAdd}
          style={{ background: "#1e3a8a", color: "#fff", border: "none" }}
        >
          <Plus size={14} className="mr-1" /> Standard Spool
        </Button>
        <Button size="sm" variant="outline" onClick={openRemainingAdd}>
          <Plus size={14} className="mr-1" /> Remaining Spool
        </Button>
        <Button size="sm" variant="outline">
          <Palette size={14} className="mr-1" /> Colors
        </Button>
        <Button
          size="sm"
          variant={showFilter === "Trash" ? "default" : "outline"}
          onClick={() => setShowFilter(showFilter === "Trash" ? "Active" : "Trash")}
          style={showFilter === "Trash" ? { background: "#ef4444", color: "#fff", border: "none" } : {}}
        >
          <Trash2 size={14} className="mr-1" /> Trash
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={openEdit}
          disabled={!selectedSpool}
        >
          <Pencil size={14} className="mr-1" /> Edit
        </Button>
        <Button size="sm" variant="ghost">
          <RefreshCw size={14} />
        </Button>

        {/* Filter + Search (right side) */}
        <div className="ml-auto flex items-center gap-2">
          <Select
            value={showFilter}
            onValueChange={(v) => setShowFilter(v as "Active" | "Trash" | "All")}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Trash">Trash</SelectItem>
              <SelectItem value="All">All</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2" style={{ color: "#64748b" }} />
            <Input
              className="pl-8 h-8 text-xs w-52"
              placeholder="Search color, brand, type…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARDS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>
              Total Weight (shown)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>
              {totalWeight.toLocaleString()} <span className="text-sm font-normal">g</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>
              Available
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
              {totalAvailable.toLocaleString()} <span className="text-sm font-normal">g</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>
              Active Spools
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold" style={{ color: "#7c3aed" }}>
              {activeCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── TABLE ────────────────────────────────────────────────────────── */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Total (g)</TableHead>
                <TableHead className="text-right">Remaining (g)</TableHead>
                <TableHead style={{ minWidth: 160 }}>%</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, idx) => {
                const pct = s.totalWeight > 0
                  ? Math.round((s.remainingWeight / s.totalWeight) * 100)
                  : 0;
                const isLow = pct < 15;

                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                    style={
                      s.id === selectedId
                        ? { background: "#eff6ff" }
                        : idx % 2 === 1
                        ? { background: "#f8fafc" }
                        : undefined
                    }
                  >
                    {/* Color swatch + name */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded shrink-0"
                          style={{
                            width: 16,
                            height: 16,
                            background: s.colorHex,
                            border: "1px solid #e2e8f0",
                          }}
                        />
                        <span className="font-medium" style={{ color: "#0f172a" }}>
                          {s.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell style={{ color: "#64748b" }}>{s.brand}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "#e0e7ff", color: "#1e3a8a" }}
                      >
                        {s.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" style={{ color: "#0f172a" }}>
                      {s.totalWeight.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: "#0f172a" }}>
                      {s.remainingWeight.toLocaleString()}
                    </TableCell>
                    {/* Progress + % */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1" style={{ minWidth: 80 }}>
                          <Progress
                            value={pct}
                            className="h-2"
                            style={
                              isLow
                                ? { "--progress-fill": "#f59e0b" } as React.CSSProperties
                                : undefined
                            }
                          />
                        </div>
                        <span className="text-xs w-8 text-right" style={{ color: "#64748b" }}>
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                    {/* Status badge */}
                    <TableCell>
                      {isLow ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: "#fef3c7", color: "#92400e" }}
                        >
                          Low ⚠
                        </span>
                      ) : s.status === "Active" ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: "#d1fae5", color: "#065f46" }}
                        >
                          Active
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: "#fee2e2", color: "#991b1b" }}
                        >
                          Trash
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10" style={{ color: "#64748b" }}>
                    No spools found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Spool Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSpool
                ? "Edit Spool"
                : dialogMode === "remaining"
                ? "Add Remaining Spool"
                : "Add Standard Spool"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Color name + hex */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="f-color">Color Name <span className="text-red-500">*</span></Label>
                <Input
                  id="f-color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="e.g. Black"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-hex">Hex Color</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="f-hex"
                    value={form.colorHex}
                    onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                    className="w-9 h-9 rounded border cursor-pointer"
                    style={{ border: "1px solid #e2e8f0", padding: 2 }}
                  />
                  <Input
                    value={form.colorHex}
                    onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                    placeholder="#000000"
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Brand */}
            <div className="space-y-1.5">
              <Label htmlFor="f-brand">Brand <span className="text-red-500">*</span></Label>
              <Input
                id="f-brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. eSUN, Bambu"
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Material Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weights + price */}
            <div className="grid grid-cols-3 gap-3">
              {dialogMode === "standard" && (
                <div className="space-y-1.5">
                  <Label htmlFor="f-total">Total Weight (g)</Label>
                  <Input
                    id="f-total"
                    type="number"
                    min={0}
                    value={form.totalWeight}
                    onChange={(e) => setForm({ ...form, totalWeight: Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="f-remaining">Remaining (g)</Label>
                <Input
                  id="f-remaining"
                  type="number"
                  min={0}
                  value={form.remainingWeight}
                  onChange={(e) => setForm({ ...form, remainingWeight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-price">Price (EGP)</Label>
                <Input
                  id="f-price"
                  type="number"
                  min={0}
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="f-notes">Notes</Label>
              <Textarea
                id="f-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes…"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.color.trim() || !form.brand.trim()}
              style={{ background: "#1e3a8a", color: "#fff", border: "none" }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
