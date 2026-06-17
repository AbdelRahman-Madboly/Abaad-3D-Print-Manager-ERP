import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  RefreshCw,
  Clock,
  CreditCard,
  Wrench,
  Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  period: string;
  kpi: {
    revenue: number;
    gross_profit: number;
    profit_margin: number;
    total_orders: number;
    active_spools: number;
    total_expenses: number;
    failure_cost: number;
  };
  alerts: {
    overdue_count: number;
    unpaid_count: number;
    nozzle_alert_count: number;
    nozzle_alerts: Array<Record<string, unknown>>;
  };
  charts: {
    monthly_revenue: Array<{ month: string; revenue: number; profit: number }>;
    order_status: Array<{ status: string; count: number }>;
    filament_by_color: Array<{ color: string; grams: number }>;
    expenses_by_cat: Array<{ category: string; total: number }>;
  };
  inventory: {
    active_spools: number;
    total_weight_g: number;
    available_weight_g: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  Draft:        "#94a3b8",
  Quote:        "#f59e0b",
  Confirmed:    "#06b6d4",
  "In Progress":"#3b82f6",
  Ready:        "#10b981",
  Delivered:    "#22c55e",
  Cancelled:    "#ef4444",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-3">
      {children}
    </p>
  );
}

function ActionAlertCard({
  borderColor, icon, count, label, description,
}: {
  borderColor: string;
  icon: React.ReactNode;
  count: string;
  label: string;
  description: string;
}) {
  return (
    <Card className="flex-1 border-l-4 shadow-sm" style={{ borderLeftColor: borderColor }}>
      <CardContent className="flex items-center gap-4 py-4 px-5">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
          style={{ backgroundColor: `${borderColor}18` }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#0f172a]">{label}</p>
          <p className="text-2xl font-bold text-[#0f172a] leading-tight">{count}</p>
          <p className="text-xs text-[#64748b] mt-0.5">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function KpiCard({ title, value, sub, subColor = "#64748b" }: {
  title: string; value: string; sub: string; subColor?: string;
}) {
  return (
    <Card className="flex-1 shadow-sm">
      <CardContent className="py-5 px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b] mb-1">{title}</p>
        <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>{sub}</p>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Dashboard() {
  const [period, setPeriod]   = useState("this-month");
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get<DashboardData>(`/api/dashboard/summary?period=${period}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [period]);

  const kpi     = data?.kpi;
  const alerts  = data?.alerts;
  const charts  = data?.charts;

  // Shape chart data for recharts
  const revenueData = (charts?.monthly_revenue ?? []).map((m) => ({
    month: m.month.slice(5), // "2026-01" → "01" or keep last 2 chars as label
    revenue: m.revenue,
  }));

  const filamentData = (charts?.filament_by_color ?? []).map((f) => ({
    color: f.color,
    used: f.grams,
  }));

  const orderStatusData = (charts?.order_status ?? []).map((s) => ({
    name: s.status,
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  const expensesData = (charts?.expenses_by_cat ?? []).map((e) => ({
    category: e.category,
    amount: e.total,
  }));

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 space-y-6">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-[#1e3a8a]" />
          <h1 className="text-2xl font-bold text-[#0f172a]">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 bg-white border-[#e2e8f0] text-[#0f172a] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost" size="icon"
            className="text-[#64748b] hover:text-[#0f172a]"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-[#1e3a8a]" />
        </div>
      ) : (
        <>
          {/* 2. Action Center */}
          <div>
            <SectionLabel>Action Center</SectionLabel>
            <div className="flex gap-4">
              <ActionAlertCard
                borderColor="#ef4444"
                icon={<Clock className="h-5 w-5" style={{ color: "#ef4444" }} />}
                label="Overdue Orders"
                count={`${alerts?.overdue_count ?? 0} order${(alerts?.overdue_count ?? 0) !== 1 ? "s" : ""}`}
                description="Need immediate attention"
              />
              <ActionAlertCard
                borderColor="#f59e0b"
                icon={<CreditCard className="h-5 w-5" style={{ color: "#f59e0b" }} />}
                label="Unpaid Orders"
                count={`${alerts?.unpaid_count ?? 0} order${(alerts?.unpaid_count ?? 0) !== 1 ? "s" : ""}`}
                description="Awaiting payment"
              />
              <ActionAlertCard
                borderColor="#06b6d4"
                icon={<Wrench className="h-5 w-5" style={{ color: "#06b6d4" }} />}
                label="Nozzle Alerts"
                count={`${alerts?.nozzle_alert_count ?? 0} printer${(alerts?.nozzle_alert_count ?? 0) !== 1 ? "s" : ""}`}
                description="Nozzle wear > 80%"
              />
            </div>
          </div>

          {/* 3. KPI Overview */}
          <div>
            <SectionLabel>Overview</SectionLabel>
            <div className="flex gap-4">
              <KpiCard
                title="Revenue"
                value={`${(kpi?.revenue ?? 0).toLocaleString()} EGP`}
                sub={`${(kpi?.profit_margin ?? 0).toFixed(1)}% margin`}
                subColor="#10b981"
              />
              <KpiCard
                title="Profit"
                value={`${(kpi?.gross_profit ?? 0).toLocaleString()} EGP`}
                sub="gross profit"
                subColor="#10b981"
              />
              <KpiCard
                title="Orders"
                value={`${kpi?.total_orders ?? 0} orders`}
                sub="all time"
              />
              <KpiCard
                title="Filament"
                value={`${kpi?.active_spools ?? 0} active spools`}
                sub="in inventory"
              />
            </div>
          </div>

          {/* 4. Charts */}
          <div>
            <SectionLabel>Analytics</SectionLabel>
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-6 px-5">
                <Tabs defaultValue="revenue">
                  <TabsList className="mb-4">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="filament">Filament Usage</TabsTrigger>
                    <TabsTrigger value="orders">Order Status</TabsTrigger>
                  </TabsList>

                  <TabsContent value="revenue">
                    <p className="text-sm font-medium text-[#64748b] mb-3">
                      Monthly Revenue (EGP)
                    </p>
                    {revenueData.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-[#64748b] text-sm">
                        No revenue data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={revenueData} barSize={32}>
                          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(v: number) => [`${v.toLocaleString()} EGP`, "Revenue"]}
                            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                          />
                          <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>

                  <TabsContent value="filament">
                    <p className="text-sm font-medium text-[#64748b] mb-3">
                      Filament Used by Color (grams)
                    </p>
                    {filamentData.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-[#64748b] text-sm">
                        No filament usage data yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={filamentData} barSize={32}>
                          <XAxis dataKey="color" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                          <Tooltip
                            formatter={(v: number) => [`${v}g`, "Used"]}
                            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                          />
                          <Bar dataKey="used" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>

                  <TabsContent value="orders">
                    <p className="text-sm font-medium text-[#64748b] mb-3">
                      Order Status Distribution
                    </p>
                    {orderStatusData.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-[#64748b] text-sm">
                        No orders yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%" cy="50%"
                            outerRadius={90}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                            labelLine
                          >
                            {orderStatusData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Legend
                            iconType="circle" iconSize={10}
                            formatter={(value) => <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>}
                          />
                          <Tooltip
                            formatter={(v: number) => [v, "Orders"]}
                            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* 5. Expenses by Category */}
          {expensesData.length > 0 && (
            <div>
              <SectionLabel>Detailed Breakdowns</SectionLabel>
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-[#0f172a]">
                    Expenses by Category
                  </CardTitle>
                  <p className="text-xs text-[#64748b]">Total operational costs</p>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="space-y-0">
                    {expensesData.map((item, i) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-[#0f172a]">{item.category}</span>
                          <span className="text-sm font-semibold text-[#0f172a]">
                            {item.amount.toLocaleString()} EGP
                          </span>
                        </div>
                        {i < expensesData.length - 1 && <Separator className="bg-[#e2e8f0]" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Nozzle alerts detail */}
          {(alerts?.nozzle_alerts ?? []).length > 0 && (
            <div>
              <SectionLabel>Maintenance Required</SectionLabel>
              <div className="flex flex-wrap gap-3">
                {(alerts!.nozzle_alerts as Array<{ name: string; model: string; nozzle_usage_percent: number }>).map((p) => (
                  <Card key={String(p.name)} className="shadow-sm flex-1 min-w-[200px]">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#0f172a]">{String(p.name)}</p>
                          <p className="text-xs text-[#64748b]">{String(p.model)}</p>
                        </div>
                        <Badge style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "none" }}>
                          {Number(p.nozzle_usage_percent).toFixed(0)}% worn
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
