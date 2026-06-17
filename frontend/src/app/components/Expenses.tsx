import { useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

type ExpenseCategory =
  | "Rent"
  | "Utilities"
  | "Supplies"
  | "Maintenance"
  | "Salary"
  | "Marketing"
  | "Other";

interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  name: string;
  qty: number;
  unitPrice: number;
  notes: string;
}

const CATEGORIES: ExpenseCategory[] = [
  "Rent",
  "Utilities",
  "Supplies",
  "Maintenance",
  "Salary",
  "Marketing",
  "Other",
];

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; color: string }> = {
  Rent:        { bg: "#eff6ff", color: "#1e3a8a" },
  Utilities:   { bg: "#ecfdf5", color: "#10b981" },
  Supplies:    { bg: "#fdf4ff", color: "#7c3aed" },
  Maintenance: { bg: "#fff7ed", color: "#f59e0b" },
  Salary:      { bg: "#ffe4e6", color: "#ef4444" },
  Marketing:   { bg: "#e0f2fe", color: "#06b6d4" },
  Other:       { bg: "#f1f5f9", color: "#64748b" },
};

const MONTHS = [
  "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026",
];

const MONTH_KEYS: Record<string, string> = {
  "Jan 2026": "2026-01",
  "Feb 2026": "2026-02",
  "Mar 2026": "2026-03",
  "Apr 2026": "2026-04",
  "May 2026": "2026-05",
  "Jun 2026": "2026-06",
};

const MOCK_EXPENSES: Expense[] = [
  { id: "1",  date: "2026-06-01", category: "Rent",        name: "Monthly Rent",         qty: 1,  unitPrice: 3000, notes: "" },
  { id: "2",  date: "2026-06-01", category: "Utilities",   name: "Electricity Bill",      qty: 1,  unitPrice: 450,  notes: "High usage month" },
  { id: "3",  date: "2026-06-05", category: "Supplies",    name: "Isopropyl Alcohol",     qty: 5,  unitPrice: 45,   notes: "" },
  { id: "4",  date: "2026-06-07", category: "Supplies",    name: "Bed Adhesive",          qty: 3,  unitPrice: 60,   notes: "" },
  { id: "5",  date: "2026-06-08", category: "Maintenance", name: "Nozzle Replacement",    qty: 2,  unitPrice: 35,   notes: "Printers 1&2" },
  { id: "6",  date: "2026-06-10", category: "Marketing",   name: "Instagram Ads",         qty: 1,  unitPrice: 200,  notes: "" },
  { id: "7",  date: "2026-06-12", category: "Salary",      name: "Assistant Salary",      qty: 1,  unitPrice: 2500, notes: "" },
  { id: "8",  date: "2026-06-14", category: "Other",       name: "Shipping Supplies",     qty: 10, unitPrice: 15,   notes: "" },
  { id: "9",  date: "2026-06-15", category: "Utilities",   name: "Internet Bill",         qty: 1,  unitPrice: 180,  notes: "" },
  { id: "10", date: "2026-06-16", category: "Supplies",    name: "Filament - Black PLA",  qty: 2,  unitPrice: 180,  notes: "eSUN 1kg" },
];

const emptyForm = {
  date: "",
  category: "Supplies" as ExpenseCategory,
  name: "",
  qty: "1",
  unitPrice: "",
  notes: "",
};

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const catOk = filterCategory === "all" || e.category === filterCategory;
      const monthOk =
        filterMonth === "all" ||
        e.date.startsWith(MONTH_KEYS[filterMonth] ?? "");
      return catOk && monthOk;
    });
  }, [expenses, filterCategory, filterMonth]);

  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + e.qty * e.unitPrice, 0),
    [filtered]
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.qty * e.unitPrice;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [filtered]);

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
      date: exp.date,
      category: exp.category,
      name: exp.name,
      qty: String(exp.qty),
      unitPrice: String(exp.unitPrice),
      notes: exp.notes,
    });
    setShowDialog(true);
  }

  function handleDelete() {
    if (!selectedId) return;
    setExpenses((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
  }

  function handleSave() {
    if (editingId) {
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                date: form.date,
                category: form.category,
                name: form.name,
                qty: Number(form.qty),
                unitPrice: Number(form.unitPrice),
                notes: form.notes,
              }
            : e
        )
      );
    } else {
      const newExp: Expense = {
        id: String(Date.now()),
        date: form.date,
        category: form.category,
        name: form.name,
        qty: Number(form.qty),
        unitPrice: Number(form.unitPrice),
        notes: form.notes,
      };
      setExpenses((prev) => [...prev, newExp]);
      setSelectedId(newExp.id);
    }
    setShowDialog(false);
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
              <Plus /> Add
            </Button>
            <Button size="sm" variant="outline" onClick={openEdit} disabled={!selectedId}>
              <Pencil /> Edit
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
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
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
              <p className="text-xl font-bold" style={{ color: "#fff" }}>
                EGP {total.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          {byCategory.map(([cat, amt]) => {
            const col = CATEGORY_COLORS[cat as ExpenseCategory];
            return (
              <Card key={cat} style={{ backgroundColor: "#fff", borderColor: "#e2e8f0" }}>
                <CardContent className="p-4">
                  <p className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>{cat}</p>
                  <p className="text-lg font-bold" style={{ color: col.color }}>
                    EGP {amt.toLocaleString()}
                  </p>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: "#f8fafc" }}>
                  {["Date", "Category", "Name", "Qty", "Unit Price", "Total", "Notes"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#64748b" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const col = CATEGORY_COLORS[e.category];
                  const rowTotal = e.qty * e.unitPrice;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedId(e.id === selectedId ? null : e.id)}
                      className="border-b cursor-pointer hover:bg-slate-50 transition-colors"
                      style={{ backgroundColor: selectedId === e.id ? "#eff6ff" : undefined }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#64748b" }}>{e.date}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className="text-xs"
                          style={{ backgroundColor: col.bg, color: col.color, border: "none" }}
                        >
                          {e.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#0f172a" }}>{e.name}</td>
                      <td className="px-4 py-3" style={{ color: "#0f172a" }}>{e.qty}</td>
                      <td className="px-4 py-3" style={{ color: "#0f172a" }}>EGP {e.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: "#0f172a" }}>EGP {rowTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "#64748b" }}>{e.notes || "—"}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "#64748b" }}>
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Expense name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Qty</Label>
                <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} min="1" />
              </div>
              <div className="space-y-1.5">
                <Label>Unit Price (EGP)</Label>
                <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} style={{ backgroundColor: "#1e3a8a" }}>
              {editingId ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
