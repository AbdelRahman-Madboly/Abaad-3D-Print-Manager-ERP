import { useState, useMemo, useEffect } from "react";
import {
  Package, Plus, Search, Edit2, Trash2, FileText, Receipt, Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { ItemDialog, PrintItem } from "./ItemDialog";
import { api, downloadFile } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type OrderStatus =
  | "Draft" | "Quote" | "Confirmed" | "In Progress"
  | "Ready" | "Delivered" | "Cancelled";

interface Order {
  id: string;
  number: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  items: PrintItem[];
  discount: number;
  payment: string;
  shipping: number;
  received: number;
  isRnD: boolean;
  createdAt: string;
  notes: string;
  apiTotal?: number;
}

// ── Adapters ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiToUiOrder(o: Record<string, any>): Order {
  return {
    id:           o.id,
    number:       `#${String(o.order_number).padStart(3, "0")}`,
    customerName:  o.customer_name  ?? "",
    customerPhone: o.customer_phone ?? "",
    status:        o.status         ?? "Draft",
    items:         (o.items ?? []).map(apiToUiItem),
    discount:      o.order_discount_percent ?? 0,
    payment:       o.payment_method  ?? "Cash",
    shipping:      o.shipping_cost   ?? 0,
    received:      o.amount_received ?? 0,
    isRnD:         o.is_rd_project   ?? false,
    createdAt:     (o.created_date   ?? "").slice(0, 10),
    notes:         o.notes           ?? "",
    apiTotal:      o.total           ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiToUiItem(i: Record<string, any>): PrintItem {
  const totalMin = i.estimated_time_minutes ?? 0;
  return {
    id:               i.id ?? crypto.randomUUID(),
    name:             i.name  ?? "",
    color:            i.color ?? "Black",
    weight:           i.estimated_weight_grams ?? 0,
    infill:           i.infill_density ?? 20,
    supports:         (i.support_type ?? "None") !== "None",
    printTimeHours:   Math.floor(totalMin / 60),
    printTimeMinutes: totalMin % 60,
    costOverride:     undefined,
  };
}

function uiToApiOrder(order: Order) {
  return {
    customer_name:          order.customerName,
    customer_phone:         order.customerPhone,
    status:                 order.status,
    items:                  order.items.map(uiToApiItem),
    order_discount_percent: order.discount,
    payment_method:         order.payment,
    shipping_cost:          order.shipping,
    amount_received:        order.received,
    is_rd_project:          order.isRnD,
    notes:                  order.notes,
  };
}

function uiToApiItem(item: PrintItem) {
  return {
    id:                     item.id,
    name:                   item.name,
    estimated_weight_grams: item.weight,
    color:                  item.color,
    estimated_time_minutes: item.printTimeHours * 60 + item.printTimeMinutes,
    infill_density:         item.infill,
    support_type:           item.supports ? "Normal" : "None",
    rate_per_gram:          4.0,
    quantity:               1,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PRICE_PER_GRAM = 4;

function calcBaseTotal(items: PrintItem[]) {
  return items.reduce((sum, it) => sum + (it.costOverride ?? it.weight * PRICE_PER_GRAM), 0);
}

function calcTotal(order: Order) {
  const base          = calcBaseTotal(order.items);
  const afterDiscount = base * (1 - order.discount / 100);
  return afterDiscount + order.shipping;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string }> = {
  Draft:         { bg: "#f1f5f9", color: "#64748b" },
  Quote:         { bg: "#fef3c7", color: "#92400e" },
  Confirmed:     { bg: "#cffafe", color: "#0e7490" },
  "In Progress": { bg: "#dbeafe", color: "#1d4ed8" },
  Ready:         { bg: "#d1fae5", color: "#065f46" },
  Delivered:     { bg: "#bbf7d0", color: "#14532d" },
  Cancelled:     { bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status] ?? { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

const ALL_STATUSES: OrderStatus[] = [
  "Draft", "Quote", "Confirmed", "In Progress", "Ready", "Delivered", "Cancelled",
];
const PAYMENT_OPTIONS = ["Cash", "Vodafone Cash", "InstaPay", "Card", "Bank Transfer"];

function emptyOrder(): Order {
  return {
    id: crypto.randomUUID(),
    number: "New",
    customerName: "",
    customerPhone: "",
    status: "Draft",
    items: [],
    discount: 0,
    payment: "Cash",
    shipping: 0,
    received: 0,
    isRnD: false,
    createdAt: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export function Orders() {
  const [orders, setOrders]                   = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isCreating, setIsCreating]           = useState(false);
  const [editingOrder, setEditingOrder]       = useState<Order | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState(false);

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem]       = useState<PrintItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");

  function load() {
    setLoading(true);
    api.get<Record<string, unknown>[]>("/api/orders")
      .then((data) => setOrders(data.map(apiToUiOrder)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        search.trim() === "" ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.number.includes(search);
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const selectedItem = useMemo(
    () => editingOrder?.items.find((i) => i.id === selectedItemId) ?? null,
    [editingOrder, selectedItemId]
  );

  function handleSelectOrder(id: string) {
    const order = orders.find((o) => o.id === id) ?? null;
    setSelectedOrderId(id);
    setIsCreating(false);
    setEditingOrder(order ? { ...order, items: [...order.items] } : null);
    setSelectedItemId(null);
  }

  function handleNewOrder() {
    setIsCreating(true);
    setSelectedOrderId(null);
    setEditingOrder(emptyOrder());
    setSelectedItemId(null);
  }

  function handleFieldChange<K extends keyof Order>(key: K, value: Order[K]) {
    setEditingOrder((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSaveOrder() {
    if (!editingOrder) return;
    setSaving(true);
    try {
      const payload = uiToApiOrder(editingOrder);
      const saved = isCreating
        ? await api.post<Record<string, unknown>>("/api/orders", payload)
        : await api.put<Record<string, unknown>>(`/api/orders/${editingOrder.id}`, payload);
      const uiOrder = apiToUiOrder(saved);
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === uiOrder.id);
        return exists ? prev.map((o) => o.id === uiOrder.id ? uiOrder : o) : [...prev, uiOrder];
      });
      setSelectedOrderId(uiOrder.id);
      setIsCreating(false);
      setEditingOrder({ ...uiOrder, items: [...uiOrder.items] });
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOrder() {
    if (!editingOrder || isCreating) return;
    if (!window.confirm(`Delete order ${editingOrder.number}?`)) return;
    try {
      await api.delete(`/api/orders/${editingOrder.id}`);
      setOrders((prev) => prev.filter((o) => o.id !== editingOrder.id));
      setSelectedOrderId(null);
      setIsCreating(false);
      setEditingOrder(null);
    } catch {
      // silently fail
    }
  }

  async function handleDownloadPdf(type: "quote" | "receipt") {
    if (!editingOrder || isCreating) return;
    try {
      await downloadFile(
        `/api/orders/${editingOrder.id}/pdf/${type}`,
        `${type}_${editingOrder.number.replace("#", "")}.pdf`
      );
    } catch {
      // silently fail
    }
  }

  function handleAddItem()  { setEditingItem(null); setShowItemDialog(true); }
  function handleEditItem() {
    if (!selectedItem) return;
    setEditingItem(selectedItem);
    setShowItemDialog(true);
  }
  function handleRemoveItem() {
    if (!selectedItemId || !editingOrder) return;
    setEditingOrder({ ...editingOrder, items: editingOrder.items.filter((i) => i.id !== selectedItemId) });
    setSelectedItemId(null);
  }
  function handleSaveItem(item: PrintItem) {
    if (!editingOrder) return;
    const exists   = editingOrder.items.some((i) => i.id === item.id);
    const newItems = exists
      ? editingOrder.items.map((i) => (i.id === item.id ? item : i))
      : [...editingOrder.items, item];
    setEditingOrder({ ...editingOrder, items: newItems });
    setSelectedItemId(item.id);
  }

  const baseTotal      = editingOrder ? calcBaseTotal(editingOrder.items) : 0;
  const afterDiscount  = editingOrder ? baseTotal * (1 - editingOrder.discount / 100) : 0;
  const total          = editingOrder ? afterDiscount + (editingOrder.shipping ?? 0) : 0;
  const balance        = editingOrder ? total - editingOrder.received : 0;
  const showForm       = isCreating || selectedOrderId !== null;

  return (
    <div className="flex h-full" style={{ backgroundColor: "#f8fafc" }}>
      {/* ── LEFT PANEL ── */}
      <div
        className="flex flex-col border-r"
        style={{ width: 400, minWidth: 400, maxWidth: 400, backgroundColor: "#fff", borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#e2e8f0" }}>
          <div className="flex items-center gap-2">
            <Package size={18} style={{ color: "#1e3a8a" }} />
            <span className="font-semibold text-base" style={{ color: "#0f172a" }}>Orders</span>
          </div>
          <Button size="sm" onClick={handleNewOrder} style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
            <Plus size={14} className="mr-1" /> New Order
          </Button>
        </div>

        <div className="px-3 pt-3 pb-2 relative">
          <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#64748b" }} />
          <Input
            placeholder="Search orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-sm"
            style={{ borderColor: "#e2e8f0" }}
          />
        </div>

        <div className="px-3 pb-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "All" | OrderStatus)}>
            <SelectTrigger className="text-sm" style={{ borderColor: "#e2e8f0" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="px-4 pb-1">
          <span className="text-xs" style={{ color: "#64748b" }}>
            {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin size-5" style={{ color: "#1e3a8a" }} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm" style={{ color: "#64748b" }}>
              No orders found
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected    = selectedOrderId === order.id && !isCreating;
              const displayTotal  = order.apiTotal ?? calcTotal(order);
              return (
                <div
                  key={order.id}
                  onClick={() => handleSelectOrder(order.id)}
                  className="px-4 py-3 cursor-pointer border-b transition-colors"
                  style={{
                    borderColor: "#e2e8f0",
                    backgroundColor: isSelected ? "#eff6ff" : "#fff",
                    borderLeft: isSelected ? "3px solid #1e3a8a" : "3px solid transparent",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold" style={{ color: "#0f172a" }}>{order.number}</span>
                      {order.isRnD && (
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "#f3e8ff", color: "#7e22ce" }}>R&D</span>
                      )}
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-sm font-medium mb-1" style={{ color: "#0f172a" }}>{order.customerName || "—"}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#64748b" }}>{order.createdAt}</span>
                    <span className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>{displayTotal.toFixed(0)} EGP</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 overflow-auto p-6">
        {!showForm ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Package size={48} style={{ color: "#e2e8f0" }} />
            <p className="text-base" style={{ color: "#64748b" }}>Select an order or create a new one</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* CUSTOMER */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>Customer</h2>
              <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Name</Label>
                    <Input value={editingOrder?.customerName ?? ""} onChange={(e) => handleFieldChange("customerName", e.target.value)} placeholder="Customer name" style={{ borderColor: "#e2e8f0" }} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Phone</Label>
                    <Input value={editingOrder?.customerPhone ?? ""} onChange={(e) => handleFieldChange("customerPhone", e.target.value)} placeholder="01xxxxxxxxx" style={{ borderColor: "#e2e8f0" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Status</Label>
                    <Select value={editingOrder?.status ?? "Draft"} onValueChange={(v) => handleFieldChange("status", v as OrderStatus)}>
                      <SelectTrigger style={{ borderColor: "#e2e8f0" }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <Checkbox id="rnd-check" checked={editingOrder?.isRnD ?? false} onCheckedChange={(v) => handleFieldChange("isRnD", Boolean(v))} />
                    <Label htmlFor="rnd-check" className="cursor-pointer" style={{ color: "#0f172a" }}>R&D Order</Label>
                  </div>
                </div>
              </div>
            </section>

            {/* PRINT ITEMS */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>Print Items</h2>
              <div className="rounded-lg" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#e2e8f0" }}>
                  <Button size="sm" onClick={handleAddItem} style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
                    <Plus size={13} className="mr-1" /> Add Item
                  </Button>
                  <Button size="sm" variant="outline" disabled={!selectedItemId} onClick={handleEditItem} style={{ borderColor: "#e2e8f0" }}>
                    <Edit2 size={13} className="mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" disabled={!selectedItemId} onClick={handleRemoveItem} style={{ borderColor: "#e2e8f0", color: selectedItemId ? "#ef4444" : undefined }}>
                    <Trash2 size={13} className="mr-1" /> Remove
                  </Button>
                </div>

                {(editingOrder?.items ?? []).length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-sm" style={{ color: "#64748b" }}>
                    No items added yet. Click "Add Item" to begin.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow style={{ borderColor: "#e2e8f0" }}>
                        <TableHead style={{ color: "#64748b" }}>Name</TableHead>
                        <TableHead style={{ color: "#64748b" }}>Color</TableHead>
                        <TableHead style={{ color: "#64748b" }}>Weight (g)</TableHead>
                        <TableHead style={{ color: "#64748b" }}>Time</TableHead>
                        <TableHead className="text-right" style={{ color: "#64748b" }}>Base Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(editingOrder?.items ?? []).map((item) => {
                        const cost         = item.costOverride ?? item.weight * PRICE_PER_GRAM;
                        const isRowSelected = item.id === selectedItemId;
                        return (
                          <TableRow
                            key={item.id}
                            onClick={() => setSelectedItemId(isRowSelected ? null : item.id)}
                            className="cursor-pointer"
                            style={{ borderColor: "#e2e8f0", backgroundColor: isRowSelected ? "#eff6ff" : undefined }}
                          >
                            <TableCell className="font-medium" style={{ color: "#0f172a" }}>{item.name}</TableCell>
                            <TableCell style={{ color: "#64748b" }}>{item.color}</TableCell>
                            <TableCell style={{ color: "#64748b" }}>{item.weight}</TableCell>
                            <TableCell style={{ color: "#64748b" }}>{item.printTimeHours}h {item.printTimeMinutes}m</TableCell>
                            <TableCell className="text-right font-semibold" style={{ color: "#1e3a8a" }}>{cost} EGP</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </section>

            {/* PAYMENT & TOTALS */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#64748b" }}>Payment & Totals</h2>
              <div className="rounded-lg p-4 space-y-4" style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}>
                <div className="rounded-md px-4 py-3 grid grid-cols-3 gap-4" style={{ backgroundColor: "#f8fafc" }}>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>Base Total</p>
                    <p className="text-base font-semibold" style={{ color: "#0f172a" }}>{baseTotal.toFixed(0)} EGP</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>Total</p>
                    <p className="text-base font-semibold" style={{ color: "#1e3a8a" }}>{total.toFixed(0)} EGP</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "#64748b" }}>Balance</p>
                    <p className="text-base font-semibold" style={{ color: balance <= 0 ? "#10b981" : "#ef4444" }}>
                      {balance > 0 ? `${balance.toFixed(0)} EGP due` : balance < 0 ? `${Math.abs(balance).toFixed(0)} EGP over` : "Settled"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Discount %</Label>
                    <Input type="number" min={0} max={100} value={editingOrder?.discount ?? 0} onChange={(e) => handleFieldChange("discount", Number(e.target.value))} style={{ borderColor: "#e2e8f0" }} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Payment Method</Label>
                    <Select value={editingOrder?.payment ?? "Cash"} onValueChange={(v) => handleFieldChange("payment", v)}>
                      <SelectTrigger style={{ borderColor: "#e2e8f0" }}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Shipping (EGP)</Label>
                    <Input type="number" min={0} value={editingOrder?.shipping ?? 0} onChange={(e) => handleFieldChange("shipping", Number(e.target.value))} style={{ borderColor: "#e2e8f0" }} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label style={{ color: "#0f172a" }}>Amount Received (EGP)</Label>
                    <Input type="number" min={0} value={editingOrder?.received ?? 0} onChange={(e) => handleFieldChange("received", Number(e.target.value))} style={{ borderColor: "#e2e8f0" }} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label style={{ color: "#0f172a" }}>Notes</Label>
                  <Textarea rows={2} value={editingOrder?.notes ?? ""} onChange={(e) => handleFieldChange("notes", e.target.value)} placeholder="Order notes…" style={{ borderColor: "#e2e8f0", resize: "none" }} />
                </div>

                <Separator style={{ backgroundColor: "#e2e8f0" }} />

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" style={{ color: "#64748b" }} disabled={isCreating} onClick={() => handleDownloadPdf("quote")}>
                      <FileText size={14} className="mr-1" /> Quote PDF
                    </Button>
                    <Button variant="ghost" size="sm" style={{ color: "#64748b" }} disabled={isCreating} onClick={() => handleDownloadPdf("receipt")}>
                      <Receipt size={14} className="mr-1" /> Receipt PDF
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    {!isCreating && selectedOrderId && (
                      <Button size="sm" variant="outline" onClick={handleDeleteOrder} style={{ borderColor: "#ef4444", color: "#ef4444" }}>
                        <Trash2 size={14} className="mr-1" /> Delete
                      </Button>
                    )}
                    <Button size="sm" onClick={handleSaveOrder} disabled={saving} style={{ backgroundColor: "#1e3a8a", color: "#fff" }}>
                      {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null}
                      Save Order
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* ── Item Dialog ── */}
      <ItemDialog
        open={showItemDialog}
        onClose={() => { setShowItemDialog(false); setEditingItem(null); }}
        onSave={handleSaveItem}
        item={editingItem}
      />
    </div>
  );
}
