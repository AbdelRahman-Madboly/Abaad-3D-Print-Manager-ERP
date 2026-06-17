import { useState } from "react";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  UserCircle2,
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
import { Separator } from "./ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Textarea } from "./ui/textarea";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  totalOrders: number;
  totalSpent: number;
}

interface OrderHistory {
  id: string;
  number: string;
  status: string;
  total: number;
  date: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const initialCustomers: Customer[] = [
  { id: "1", name: "Ahmed Hassan",  phone: "0101234567", email: "ahmed@example.com", address: "Cairo, Egypt",      notes: "VIP customer",         totalOrders: 12, totalSpent: 4800 },
  { id: "2", name: "Sara Mohamed",  phone: "0109876543", email: "sara@example.com",  address: "Giza, Egypt",       notes: "",                     totalOrders: 5,  totalSpent: 1200 },
  { id: "3", name: "Khaled Ali",    phone: "0111111111", email: "",                  address: "Alexandria, Egypt", notes: "Prefers black filament",totalOrders: 8,  totalSpent: 2400 },
  { id: "4", name: "Mona Youssef",  phone: "0122222222", email: "mona@example.com",  address: "Cairo, Egypt",      notes: "",                     totalOrders: 3,  totalSpent: 750  },
  { id: "5", name: "Hossam Ramzy",  phone: "0133333333", email: "hossam@example.com",address: "Mansoura, Egypt",   notes: "Bulk orders",          totalOrders: 20, totalSpent: 8500 },
  { id: "6", name: "Nour Ibrahim",  phone: "0144444444", email: "",                  address: "Cairo, Egypt",      notes: "",                     totalOrders: 2,  totalSpent: 380  },
];

const mockOrderHistory: OrderHistory[] = [
  { id: "o1", number: "ORD-001", status: "Delivered",   total: 350, date: "2024-05-10" },
  { id: "o2", number: "ORD-002", status: "In Progress", total: 210, date: "2024-06-01" },
  { id: "o3", number: "ORD-003", status: "Ready",       total: 480, date: "2024-06-14" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const statusColors: Record<string, string> = {
  Delivered:   "bg-[#10b981] text-white",
  "In Progress":"bg-[#06b6d4] text-white",
  Ready:       "bg-[#7c3aed] text-white",
  Cancelled:   "bg-[#ef4444] text-white",
};

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm: Omit<Customer, "id" | "totalOrders" | "totalSpent"> = {
  name: "", phone: "", email: "", address: "", notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Customers() {
  const [customers, setCustomers]         = useState<Customer[]>(initialCustomers);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [showDialog, setShowDialog]       = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setEditingCustomer(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit() {
    if (!selected) return;
    setEditingCustomer(selected);
    setForm({
      name:    selected.name,
      phone:   selected.phone,
      email:   selected.email,
      address: selected.address,
      notes:   selected.notes,
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => c.id === editingCustomer.id ? { ...c, ...form } : c)
      );
    } else {
      const newCustomer: Customer = {
        id: String(Date.now()),
        ...form,
        totalOrders: 0,
        totalSpent:  0,
      };
      setCustomers((prev) => [...prev, newCustomer]);
    }
    setShowDialog(false);
  }

  function handleDelete() {
    if (!selected) return;
    if (window.confirm(`Delete "${selected.name}"?`)) {
      setCustomers((prev) => prev.filter((c) => c.id !== selected.id));
      setSelectedId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full" style={{ background: "#f8fafc" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-col bg-white border-r"
        style={{ width: 380, borderColor: "#e2e8f0", minHeight: "100vh" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: "#e2e8f0" }}>
          <Users size={20} style={{ color: "#1e3a8a" }} />
          <span className="font-semibold text-base flex-1" style={{ color: "#0f172a" }}>
            Customers
          </span>
          <Button size="sm" onClick={openAdd} style={{ background: "#1e3a8a", color: "#fff", border: "none" }}>
            <Plus size={15} className="mr-1" /> Add
          </Button>
          <Button size="sm" variant="outline" onClick={openEdit} disabled={!selected}>
            <Pencil size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={!selected}
            style={selected ? { borderColor: "#ef4444", color: "#ef4444" } : {}}
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-2.5" style={{ color: "#64748b" }} />
            <Input
              placeholder="Search by name or phone…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Count */}
        <div className="px-4 pb-2 text-xs" style={{ color: "#64748b" }}>
          {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(c.id)}
                  style={
                    c.id === selectedId
                      ? { background: "#eff6ff" }
                      : undefined
                  }
                >
                  <TableCell className="font-medium py-2.5" style={{ color: "#0f172a" }}>
                    {c.name}
                  </TableCell>
                  <TableCell className="py-2.5" style={{ color: "#64748b" }}>
                    {c.phone}
                  </TableCell>
                  <TableCell className="text-right py-2.5" style={{ color: "#0f172a" }}>
                    {c.totalOrders}
                  </TableCell>
                  <TableCell className="text-right py-2.5" style={{ color: "#0f172a" }}>
                    {c.totalSpent.toLocaleString()} EGP
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8" style={{ color: "#64748b" }}>
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: "#64748b" }}>
            <UserCircle2 size={56} className="mb-3 opacity-30" />
            <p className="text-base">Select a customer to view details</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">

            {/* Identity card */}
            <Card>
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center rounded-full text-white font-bold text-xl shrink-0"
                    style={{ width: 64, height: 64, background: "#1e3a8a", fontSize: 22 }}
                  >
                    {getInitials(selected.name)}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <h2 className="text-xl font-semibold" style={{ color: "#0f172a" }}>
                      {selected.name}
                    </h2>
                    <p style={{ color: "#64748b" }}>{selected.phone}</p>
                    {selected.email && (
                      <p style={{ color: "#64748b" }}>{selected.email}</p>
                    )}
                    {selected.address && (
                      <p style={{ color: "#64748b" }}>{selected.address}</p>
                    )}
                    {selected.notes && (
                      <p className="text-sm mt-1 italic" style={{ color: "#7c3aed" }}>
                        {selected.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold" style={{ color: "#1e3a8a" }}>
                    {selected.totalOrders}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
                    {selected.totalSpent.toLocaleString()} <span className="text-sm font-normal">EGP</span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-xs font-medium" style={{ color: "#64748b" }}>
                    Avg per Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold" style={{ color: "#0f172a" }}>
                    {selected.totalOrders > 0
                      ? Math.round(selected.totalSpent / selected.totalOrders).toLocaleString()
                      : 0}{" "}
                    <span className="text-sm font-normal">EGP</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Order History */}
            <Card>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                  Order History
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrderHistory.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.number}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status] ?? "bg-gray-100 text-gray-700"}`}
                          >
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{o.total} EGP</TableCell>
                        <TableCell style={{ color: "#64748b" }}>{o.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        )}
      </div>

      {/* ── Add / Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone <span className="text-red-500">*</span></Label>
              <Input
                id="c-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-address">Address</Label>
              <Input
                id="c-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-notes">Notes</Label>
              <Textarea
                id="c-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special notes…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.phone.trim()}
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
