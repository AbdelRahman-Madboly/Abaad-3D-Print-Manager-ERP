import { useState, useEffect } from "react";
import {
  Layers, Plus, Palette, Pencil, RefreshCw, Search, Trash2, Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FilamentSpool {
  id: string;
  name: string;
  color: string;
  brand: string;
  filament_type: string;
  category: string;
  status: string;
  initial_weight_grams: number;
  current_weight_grams: number;
  available_weight_grams: number;
  remaining_percent: number;
  purchase_price_egp: number;
  notes: string;
}

const MATERIAL_TYPES = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Other"];

const emptyForm = {
  color: "",
  brand: "",
  filament_type: "PLA+",
  category: "standard",
  initial_weight_grams: 1000,
  purchase_price_egp: 0,
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Filament() {
  const [spools, setSpools]             = useState<FilamentSpool[]>([]);
  const [searchQuery, setSearchQuery]   = useState("");
  const [showFilter, setShowFilter]     = useState<"active" | "trash" | "all">("active");
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [showDialog, setShowDialog]     = useState(false);
  const [editingSpool, setEditingSpool] = useState<FilamentSpool | null>(null);
  const [form, setForm]                 = useState(emptyForm);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);

  function load() {
    setLoading(true);
    api.get<FilamentSpool[]>("/api/filament")
      .then(setSpools)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = spools.filter((s) => {
    const matchFilter =
      showFilter === "all" ? true :
      showFilter === "trash" ? s.status === "trash" :
      s.status !== "trash";
    const matchSearch =
      s.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.filament_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalWeight    = filtered.reduce((sum, s) => sum + s.initial_weight_grams, 0);
  const totalAvailable = filtered.reduce((sum, s) => sum + s.available_weight_grams, 0);
  const activeCount    = filtered.filter((s) => s.status !== "trash").length;
  const selectedSpool  = spools.find((s) => s.id === selectedId) ?? null;

  function openAdd() {
    setEditingSpool(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit() {
    if (!selectedSpool) return;
    setEditingSpool(selectedSpool);
    setForm({
      color:                selectedSpool.color,
      brand:                selectedSpool.brand,
      filament_type:        selectedSpool.filament_type,
      category:             selectedSpool.category,
      initial_weight_grams: selectedSpool.initial_weight_grams,
      purchase_price_egp:   selectedSpool.purchase_price_egp,
      notes:                selectedSpool.notes,
    });
    setShowDialog(true);
  }

  async function handleSave() {
    if (!form.color.trim() || !form.brand.trim()) return;
    setSaving(true);
    try {
      if (editingSpool) {
        await api.put<FilamentSpool>(`/api/filament/${editingSpool.id}`, form);
      } else {
        await api.post<FilamentSpool>("/api/filament", form);
      }
      load();
      setShowDialog(false);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTrash() {
    if (!selectedSpool) return;
    try {
      if (selectedSpool.status === "trash") {
        await api.put(`/api/filament/${selectedSpool.id}`, {
          ...form,
          color: selectedSpool.color,
          brand: selectedSpool.brand,
          filament_type: selectedSpool.filament_type,
          category: selectedSpool.category,
          initial_weight_grams: selectedSpool.initial_weight_grams,
          purchase_price_egp: selectedSpool.purchase_price_egp,
          notes: selectedSpool.notes,
        });
      } else {
        await api.post(`/api/filament/${selectedSpool.id}/trash`, {});
      }
      load();
      setSelectedId(null);
    } catch {
      // silently fail
    }
  }

  return (
    <div className="flex flex-col h-full p-5 gap-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── TOOLBAR ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Layers size={20} style={{ color: "#1e3a8a" }} />
          <span className="font-semibold text-base" style={{ color: "#0f172a" }}>Filament Inventory</span>
        </div>

        <Button size="sm" onClick={openAdd} style={{ background: "#1e3a8a", color: "#fff", border: "none" }}>
          <Plus size={14} className="mr-1" /> Add Spool
        </Button>
        <Button
          size="sm"
          variant={showFilter === "trash" ? "default" : "outline"}
          onClick={() => setShowFilter(showFilter === "trash" ? "active" : "trash")}
          style={showFilter === "trash" ? { background: "#ef4444", color: "#fff", border: "none" } : {}}
        >
          <Trash2 size={14} className="mr-1" /> Trash
        </Button>
        <Button size="sm" variant="outline" onClick={openEdit} disabled={!selectedSpool}>
          <Pencil size={14} className="mr-1" /> Edit
        </Button>
        {selectedSpool && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleTrash}
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
          >
            <Trash2 size={14} className="mr-1" />
            {selectedSpool.status === "trash" ? "Restore" : "Move to Trash"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Select
            value={showFilter}
            onValueChange={(v) => setShowFilter(v as "active" | "trash" | "all")}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="trash">Trash</SelectItem>
              <SelectItem value="all">All</SelectItem>
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
            <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>Total Weight (shown)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>
              {totalWeight.toLocaleString()} <span className="text-sm font-normal">g</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>Available</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
              {totalAvailable.toLocaleString()} <span className="text-sm font-normal">g</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>Active Spools</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold" style={{ color: "#7c3aed" }}>{activeCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── TABLE ────────────────────────────────────────────────────────── */}
      <Card className="flex-1">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin size-6" style={{ color: "#1e3a8a" }} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total (g)</TableHead>
                  <TableHead className="text-right">Available (g)</TableHead>
                  <TableHead style={{ minWidth: 160 }}>%</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, idx) => {
                  const pct   = Math.round(s.remaining_percent ?? 0);
                  const isLow = pct < 15;
                  return (
                    <TableRow
                      key={s.id} className="cursor-pointer"
                      onClick={() => setSelectedId(s.id === selectedId ? null : s.id)}
                      style={
                        s.id === selectedId
                          ? { background: "#eff6ff" }
                          : idx % 2 === 1 ? { background: "#f8fafc" } : undefined
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="rounded shrink-0" style={{ width: 16, height: 16, background: "#64748b", border: "1px solid #e2e8f0" }} />
                          <span className="font-medium" style={{ color: "#0f172a" }}>{s.color}</span>
                        </div>
                      </TableCell>
                      <TableCell style={{ color: "#64748b" }}>{s.brand}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#e0e7ff", color: "#1e3a8a" }}>
                          {s.filament_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" style={{ color: "#0f172a" }}>{s.initial_weight_grams.toLocaleString()}</TableCell>
                      <TableCell className="text-right" style={{ color: "#0f172a" }}>{Math.round(s.available_weight_grams).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1" style={{ minWidth: 80 }}>
                            <Progress value={pct} className="h-2" />
                          </div>
                          <span className="text-xs w-8 text-right" style={{ color: "#64748b" }}>{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isLow ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#fef3c7", color: "#92400e" }}>Low ⚠</span>
                        ) : s.status === "trash" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#fee2e2", color: "#991b1b" }}>Trash</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#d1fae5", color: "#065f46" }}>Active</span>
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
          )}
        </CardContent>
      </Card>

      {/* ── Spool Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSpool ? "Edit Spool" : "Add Spool"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Color Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  placeholder="e.g. Black"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Brand <span className="text-red-500">*</span></Label>
                <Input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. eSUN, Bambu"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Material Type</Label>
              <Select
                value={form.filament_type}
                onValueChange={(v) => setForm({ ...form, filament_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MATERIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (new spool)</SelectItem>
                  <SelectItem value="remaining">Remaining (partial spool)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Initial Weight (g)</Label>
                <Input
                  type="number" min={0}
                  value={form.initial_weight_grams}
                  onChange={(e) => setForm({ ...form, initial_weight_grams: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Purchase Price (EGP)</Label>
                <Input
                  type="number" min={0}
                  value={form.purchase_price_egp}
                  onChange={(e) => setForm({ ...form, purchase_price_egp: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
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
              disabled={!form.color.trim() || !form.brand.trim() || saving}
              style={{ background: "#1e3a8a", color: "#fff", border: "none" }}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
