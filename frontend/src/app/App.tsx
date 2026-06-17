import { useState } from "react";

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

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [currentView, setCurrentView] = useState("dashboard");

  function handleLogin() {
    setScreen("setup");
  }

  function handleSetupComplete() {
    setScreen("app");
  }

  function handleSetupSkip() {
    setScreen("app");
  }

  function renderView() {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "orders":
        return <Orders />;
      case "customers":
        return <Customers />;
      case "filament":
        return <Filament />;
      case "printers":
        return <Printers />;
      case "expenses":
        return <Expenses />;
      case "failures":
        return <Failures />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  }

  if (screen === "login") {
    return <Login onLogin={handleLogin} />;
  }

  if (screen === "setup") {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: "#f8fafc" }}>
        <SetupWizard onComplete={handleSetupComplete} onSkip={handleSetupSkip} />
      </div>
    );
  }

  // screen === "app"
  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </AppLayout>
  );
}
