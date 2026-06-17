import { useState, useEffect, useMemo } from "react";
import { CreditCard, Plus, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";
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

type ExpenseCategory =
  | "Bills" | "Engineer" | "Tools" | "Consumables" | "Maintenance"
  | "Filament" | "Packaging" | "Shipping" | "Software" | "Other";

interface Expense {
  id: string;
  date: string;
  category: string;
  name: string;
  description: string;
  amount: number;
  quantity: number;
  total_cost: number;
  supplier: string;
}

const CATEGORIES: ExpenseCategory[] = [
  "Bills", "Engineer", "Tools", "Consumables", "Maintenance",
  "Filament", "Packaging", "Shipping", "Software", "Other",
];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Bills:       { bg: "#eff6ff", color: "#1e3a8a" },
  Engineer:    { bg: "#fdf4ff", color: "#7c3aed" },
  Tools:       { bg: "#ecfdf5", color: "#10b981" },
  Consumables: { bg: "#fff7ed", color: "#f59e0b" },
  Maintenance: { bg: "#fff1f2", color: "#e11d48" },
  Filament:    { bg: "#e0f2fe", color: "#0369a1" },
  Packaging:   { bg: "#f0fdf4", color: "#15803d" },
  Shipping:    { bg: "#fef3c7", color: "#92400e" },
  Software:    { bg: "#fdf2f8", color: "#9d174d" },
  Other:       { bg: "#f1f5f9", color: "#64748b" },
};

const emptyForm = {
  date:        new Date().toISOString().slice(0, 10),
  category:    "Other" as ExpenseCategory,
  name:        "",
  description: "",
  amount:      "",
  quantity:    "1",
  supplier:    "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Expenses() {
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

  function load() {
    setLoading(true);
    const params = filterCategory !== "all" ? `?category=${encodeURIComponent(filterCategory)}` : "";
    api.get<Expense[]>(`/api/expenses${params}`)
      .then(setExpenses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filterCategory]);

  const total = useMemo(() => expenses.reduce((sum, e) => sum + (e.total_cost ?? e.amount * e.quantity), 0), [expenses]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + (e.total_cost ?? e.amount * e.quantity); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [expenses]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit() {
    const exp = expenses.find((e) => e.id === selectedId);
    if (!exp) return;
    setEditingId(exp.id);
    setForm({
      date:        exp.date.slice(0, 10),
      category:    exp.category as ExpenseCategory,
      name:        exp.name,
      description: exp.description,
      amount:      String(exp.amount),
      quantity:    String(exp.quantity),
      supplier:    exp.supplier,
    });
    setShowDialog(true);
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      await api.delete(`/api/expenses/${selectedId}`);
      setExpenses((prev) => prev.filter((e) => e.id !== selectedId));
      setSelectedId(null);
    } catch {
      // silently fail
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.amount) return;
    setSaving(true);
    try {
      const body = {
        date:        form.date,
        category:    form.category,
        name:        form.name,
        description: form.description,
        amount:      Number(form.amount),
        quantity:    Number(form.quantity),
        supplier:    form.supplier,
      };
      if (editingId) {
        await api.put<Expense>(`/api/expenses/${editingId}`, body);
      } else {
        await api.post<Expense>("/api/expenses", body);
      }
      load();
      setShowDialog(false);
      setSelectedId(null);
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
            <CreditCard className="size-5" style={{ color: "#1e3a8a" }} />
            <span className="font-semibold text-base" style={{ color: "#0f172a" }}>Expenses</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={openAdd} style={{ backgroundColor: "#1e3a8a" }}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
            <Button size="sm" variant="outline" onClick={openEdit} disabled={!selectedId}>
              <Pencil size={14} className="mr-1" /> Edit
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pt-5 pb-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card style={{ backgroundColor: "#1e3a8a", border: "none" }}>
            <CardContent className="p-4">
              <p className="text-xs font-medium mb-1" style={{ color: "#bfdbfe" }}>Total</p>
              <p className="text-xl font-bold" style={{ color: "#fff" }}>EGP {total.toLocaleString()}</p>
            </CardContent>
          </Card>
          {byCategory.map(([cat, amt]) => {
            const col = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other;
            return (
              <Card key={cat} style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{cat}</p>
                  <p className="text-lg font-bold" style={{ color: col.color }}>EGP {amt.toLocaleString()}</p>
                </CardContent>
              </Card>
            );
          })}
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
                    {["Date", "Category", "Name", "Qty", "Unit Price", "Total", "Notes"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#64748b" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => {
                    const col      = CATEGORY_COLORS[e.category] ?? CATEGORY_COLORS.Other;
                    const rowTotal = e.total_cost ?? e.amount * e.quantity;
                    return (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedId(e.id === selectedId ? null : e.id)}
                        className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                        style={{ backgroundColor: selectedId === e.id ? "#eff6ff" : undefined }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748b" }}>{e.date.slice(0, 10)}</td>
                        <td className="px-4 py-3">
                          <Badge className="text-xs" style={{ backgroundColor: col.bg, color: col.color, border: "none" }}>
                            {e.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{e.name}</td>
                        <td className="px-4 py-3" style={{ color: "#0f172a" }}>{e.quantity}</td>
                        <td className="px-4 py-3" style={{ color: "#0f172a" }}>EGP {e.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "#0f172a" }}>EGP {rowTotal.toLocaleString()}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "#64748b" }}>{e.description || "—"}</td>
                      </tr>
                    );
                  })}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "#64748b" }}>No expenses found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Expense name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Qty</Label>
                <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit Price (EGP) <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.amount || saving}
              style={{ backgroundColor: "#1e3a8a" }}
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
              {editingId ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
