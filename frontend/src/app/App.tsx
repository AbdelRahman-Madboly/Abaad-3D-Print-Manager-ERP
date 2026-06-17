import { useState } from "react";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Login } from "./components/Login";
import { SetupWizard } from "./components/SetupWizard";
import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./components/Dashboard";
import { Orders } from "./components/Orders";
import { Customers } from "./components/Customers";
import { Filament } from "./components/Filament";
import { Printers } from "./components/Printers";
import { Expenses } from "./components/Expenses";
import { Failures } from "./components/Failures";
import { Settings } from "./components/Settings";

type Screen = "login" | "setup" | "app";

function AppCore() {
  const { token } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");
  const [currentView, setCurrentView] = useState("dashboard");

  async function handleLogin() {
    try {
      const settings = await api.get<Record<string, string>>("/api/settings");
      const done = settings.setup_complete === "1" || settings.setup_complete === "true";
      setScreen(done ? "app" : "setup");
    } catch {
      setScreen("setup");
    }
  }

  function handleSetupComplete() {
    api.post("/api/settings", { setup_complete: "1" }).catch(() => {});
    setScreen("app");
  }

  function handleSetupSkip() {
    setScreen("app");
  }

  function renderView() {
    switch (currentView) {
      case "dashboard": return <Dashboard />;
      case "orders":    return <Orders />;
      case "customers": return <Customers />;
      case "filament":  return <Filament />;
      case "printers":  return <Printers />;
      case "expenses":  return <Expenses />;
      case "failures":  return <Failures />;
      case "settings":  return <Settings />;
      default:          return <Dashboard />;
    }
  }

  if (!token || screen === "login") {
    return <Login onLogin={handleLogin} />;
  }

  if (screen === "setup") {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: "#f8fafc" }}>
        <SetupWizard onComplete={handleSetupComplete} onSkip={handleSetupSkip} />
      </div>
    );
  }

  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppCore />
    </AuthProvider>
  );
}
