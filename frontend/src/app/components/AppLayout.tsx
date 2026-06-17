import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  Layers,
  Printer,
  Receipt,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  view: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={18} />, view: "dashboard" },
  { label: "Orders", icon: <Package size={18} />, view: "orders" },
  { label: "Customers", icon: <Users size={18} />, view: "customers" },
  { label: "Filament", icon: <Layers size={18} />, view: "filament" },
  { label: "Printers", icon: <Printer size={18} />, view: "printers" },
  { label: "Expenses", icon: <Receipt size={18} />, view: "expenses" },
  { label: "Failures", icon: <AlertTriangle size={18} />, view: "failures" },
  { label: "Settings", icon: <Settings size={18} />, view: "settings" },
];

interface AppLayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: React.ReactNode;
  tenantName?: string;
  tenantSubtitle?: string;
}

export function AppLayout({
  currentView,
  onNavigate,
  children,
  tenantName = "Abaad 3D",
  tenantSubtitle = "3D Printing Services",
}: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? "w-16" : "w-64";

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col ${sidebarWidth} shrink-0 h-full transition-all duration-200`}
        style={{ backgroundColor: "#1e293b" }}
      >
        {/* Logo / Tenant area */}
        <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-8 rounded-md object-cover shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{tenantName}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>
                {tenantSubtitle}
              </p>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="mx-3 border-t" style={{ borderColor: "#334155" }} />

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center w-full rounded-md text-sm font-medium transition-colors text-left ${
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                }`}
                style={{
                  backgroundColor: isActive ? "#1e3a8a" : "transparent",
                  color: isActive ? "#ffffff" : "#cbd5e1",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#334155";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle + footer */}
        <div className="px-3 py-3 space-y-2">
          <div className="border-t" style={{ borderColor: "#334155" }} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`flex items-center w-full rounded-md px-3 py-2 text-xs transition-colors ${
              collapsed ? "justify-center" : "gap-2"
            }`}
            style={{ color: "#64748b" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#cbd5e1")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")
            }
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          {!collapsed && (
            <p className="px-3 text-xs" style={{ color: "#475569" }}>
              Abaad ERP
            </p>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: "#f8fafc" }}>
        {children}
      </main>
    </div>
  );
}
