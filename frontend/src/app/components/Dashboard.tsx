import { useState } from "react";
import {
  LayoutDashboard,
  RefreshCw,
  Clock,
  CreditCard,
  Wrench,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// ── Mock data ────────────────────────────────────────────────────────────────

const revenueData = [
  { month: "Jan", revenue: 18000 },
  { month: "Feb", revenue: 21000 },
  { month: "Mar", revenue: 19500 },
  { month: "Apr", revenue: 24000 },
  { month: "May", revenue: 22000 },
  { month: "Jun", revenue: 24800 },
];

const filamentData = [
  { color: "Black", used: 840 },
  { color: "White", used: 620 },
  { color: "Blue", used: 390 },
  { color: "Red", used: 280 },
  { color: "Gray", used: 450 },
];

const orderStatusData = [
  { name: "Delivered", value: 28, fill: "#10b981" },
  { name: "In Progress", value: 11, fill: "#3b82f6" },
  { name: "Ready", value: 5, fill: "#10b981" },
  { name: "Cancelled", value: 3, fill: "#ef4444" },
];

const printers = [
  { name: "Printer 1", model: "Bambu X1C", lifetime: 73, nozzle: 82 },
  { name: "Printer 2", model: "Creality Ender 3", lifetime: 40, nozzle: 20 },
];

const topCustomers = [
  { name: "Ahmed Hassan", revenue: 5200 },
  { name: "Sara Khalil", revenue: 4100 },
  { name: "Mohamed Ali", revenue: 3850 },
  { name: "Nour Ibrahim", revenue: 3200 },
  { name: "Youssef Tarek", revenue: 2750 },
];

const expenseCategories = [
  { category: "Filament", amount: 6800, color: "#3b82f6" },
  { category: "Electricity", amount: 2400, color: "#f59e0b" },
  { category: "Maintenance", amount: 1200, color: "#ef4444" },
  { category: "Shipping", amount: 880, color: "#10b981" },
  { category: "Miscellaneous", amount: 400, color: "#64748b" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-widest text-[#64748b] uppercase mb-3">
      {children}
    </p>
  );
}

interface ActionAlertCardProps {
  borderColor: string;
  icon: React.ReactNode;
  count: string;
  label: string;
  description: string;
}

function ActionAlertCard({
  borderColor,
  icon,
  count,
  label,
  description,
}: ActionAlertCardProps) {
  return (
    <Card
      className="flex-1 border-l-4 shadow-sm"
      style={{ borderLeftColor: borderColor }}
    >
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

interface KpiCardProps {
  title: string;
  value: string;
  sub: string;
  subColor?: string;
}

function KpiCard({ title, value, sub, subColor = "#64748b" }: KpiCardProps) {
  return (
    <Card className="flex-1 shadow-sm">
      <CardContent className="py-5 px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b] mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
        <p className="text-xs mt-1 font-medium" style={{ color: subColor }}>
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function Dashboard() {
  const [period, setPeriod] = useState("this-month");

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
          <Button variant="ghost" size="icon" className="text-[#64748b] hover:text-[#0f172a]">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 2. Action Center */}
      <div>
        <SectionLabel>Action Center</SectionLabel>
        <div className="flex gap-4">
          <ActionAlertCard
            borderColor="#ef4444"
            icon={<Clock className="h-5 w-5" style={{ color: "#ef4444" }} />}
            label="Overdue Orders"
            count="3 orders"
            description="Need immediate attention"
          />
          <ActionAlertCard
            borderColor="#f59e0b"
            icon={<CreditCard className="h-5 w-5" style={{ color: "#f59e0b" }} />}
            label="Unpaid Orders"
            count="7 orders"
            description="Awaiting payment"
          />
          <ActionAlertCard
            borderColor="#06b6d4"
            icon={<Wrench className="h-5 w-5" style={{ color: "#06b6d4" }} />}
            label="Nozzle Alerts"
            count="1 printer"
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
            value="24,800 EGP"
            sub="↑ 18% vs last month"
            subColor="#10b981"
          />
          <KpiCard
            title="Profit"
            value="9,120 EGP"
            sub="36.8% margin"
            subColor="#10b981"
          />
          <KpiCard
            title="Orders"
            value="47 orders"
            sub="this month"
          />
          <KpiCard
            title="Filament"
            value="6 active spools"
            sub="3 colors"
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

              {/* Revenue chart */}
              <TabsContent value="revenue">
                <p className="text-sm font-medium text-[#64748b] mb-3">
                  Monthly Revenue (EGP) — Last 6 Months
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueData} barSize={32}>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v.toLocaleString()} EGP`, "Revenue"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              {/* Filament chart */}
              <TabsContent value="filament">
                <p className="text-sm font-medium text-[#64748b] mb-3">
                  Filament Used by Color (grams)
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={filamentData} barSize={32}>
                    <XAxis
                      dataKey="color"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v}g`, "Used"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="used" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              {/* Order status pie chart */}
              <TabsContent value="orders">
                <p className="text-sm font-medium text-[#64748b] mb-3">
                  Order Status Distribution
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={true}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => (
                        <span style={{ fontSize: 12, color: "#64748b" }}>{value}</span>
                      )}
                    />
                    <Tooltip
                      formatter={(v: number) => [v, "Orders"]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* 5. Printer Utilization */}
      <div>
        <SectionLabel>Printer Utilization</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          {printers.map((printer) => (
            <Card key={printer.name} className="shadow-sm">
              <CardHeader className="pb-2 pt-4 px-5">
                <CardTitle className="text-base font-semibold text-[#0f172a]">
                  {printer.name}
                </CardTitle>
                <p className="text-xs text-[#64748b]">{printer.model}</p>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                {/* Lifetime Usage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748b] font-medium">Lifetime Usage</span>
                    <span className="font-semibold text-[#0f172a]">{printer.lifetime}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${printer.lifetime}%`,
                        backgroundColor: "#1e3a8a",
                      }}
                    />
                  </div>
                </div>
                {/* Nozzle Wear */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#64748b] font-medium">Nozzle Wear</span>
                    <span
                      className="font-semibold"
                      style={{ color: printer.nozzle > 80 ? "#f59e0b" : "#0f172a" }}
                    >
                      {printer.nozzle}%
                      {printer.nozzle > 80 && (
                        <Badge
                          className="ml-1.5 text-[10px] px-1.5 py-0"
                          style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "none" }}
                        >
                          Replace soon
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${printer.nozzle}%`,
                        backgroundColor: printer.nozzle > 80 ? "#f59e0b" : "#10b981",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 6. Detailed Breakdowns */}
      <div>
        <SectionLabel>Detailed Breakdowns</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          {/* Revenue by Customer */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-[#0f172a]">
                Revenue by Customer
              </CardTitle>
              <p className="text-xs text-[#64748b]">Top 5 customers this period</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-0">
                {topCustomers.map((customer, i) => (
                  <div key={customer.name}>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eff6ff] text-[#1e3a8a] text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm text-[#0f172a]">{customer.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#0f172a]">
                        {customer.revenue.toLocaleString()} EGP
                      </span>
                    </div>
                    {i < topCustomers.length - 1 && (
                      <Separator className="bg-[#e2e8f0]" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm font-semibold text-[#0f172a]">
                Expenses by Category
              </CardTitle>
              <p className="text-xs text-[#64748b]">Total operational costs</p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-0">
                {expenseCategories.map((item, i) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-[#0f172a]">{item.category}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#0f172a]">
                        {item.amount.toLocaleString()} EGP
                      </span>
                    </div>
                    {i < expenseCategories.length - 1 && (
                      <Separator className="bg-[#e2e8f0]" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
