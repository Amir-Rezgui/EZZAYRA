import { NavLink, Route, Routes } from "react-router-dom";
import {
  Map,
  Mic2,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  LogOut,
  Leaf,
} from "lucide-react";
import clsx from "clsx";

import MapPage from "./pages/MapPage";
import ChatbotPage from "./pages/ChatbotPage";
import AnalysesPage from "./pages/AnalysesPage";
import AnomaliesPage from "./pages/AnomaliesPage";
import ZoneAnalysisPage from "./pages/ZoneAnalysisPage";
import DemoPage from "./pages/DemoPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

const navItems = [
  { to: "/", label: "Carte", icon: Map },
  { to: "/chatbot", label: "Chatbot", icon: Mic2 },
  { to: "/analyses", label: "Analyses", icon: ClipboardList },
  { to: "/anomalies", label: "Anomalies", icon: AlertTriangle },
  { to: "/demo", label: "Demo", icon: Sparkles },
];

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 flex-col gap-6 border-r border-white/60 bg-white/70 p-6 shadow-olive backdrop-blur md:flex">
          {/* Brand */}
          <div className="rounded-3xl bg-gradient-to-br from-olive-mid/80 to-olive-dark/90 p-6 text-sand shadow-olive">
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-sand/80" />
              <p className="text-sm uppercase tracking-[0.35em]">EZZAYRA</p>
            </div>
            <h1 className="mt-3 text-3xl">Analyse intelligente</h1>
            <p className="mt-3 text-sm text-sand/90">
              Carte, NDVI, chatbot vocal et demo jury, dans une seule app.
            </p>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "bg-olive-mid text-white shadow-olive"
                        : "bg-white/70 text-olive-dark hover:bg-white"
                    )
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User card + logout */}
          <div className="mt-auto flex flex-col gap-3">
            {user && (
              <div className="rounded-3xl border border-olive-mid/20 bg-white/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-olive-mid to-olive-dark text-sm font-bold text-sand">
                    {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-olive-dark">
                      {user.displayName ?? "Utilisateur"}
                    </p>
                    <p className="truncate text-xs text-olive-dark/50">{user.email}</p>
                  </div>
                </div>
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-olive-mid/20 py-2 text-xs font-semibold text-olive-dark/70 transition hover:bg-olive-mid/10 hover:text-olive-dark"
                >
                  <LogOut size={14} />
                  Se déconnecter
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-olive-mid/20 bg-white/70 p-5 text-sm">
              <p className="font-semibold text-olive-dark">Mode demo</p>
              <p className="mt-2 text-olive-dark/70">
                Active les donnees prechargees pour impressionner le jury en 45 secondes.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-5 pb-24 pt-8 md:px-10 md:pb-10">
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MapPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/analyses" element={<AnalysesPage />} />
              <Route path="/anomalies" element={<AnomaliesPage />} />
              <Route path="/anomalies/zone/:id" element={<ZoneAnalysisPage />} />
              <Route path="/demo" element={<DemoPage />} />
            </Route>
          </Routes>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between gap-2 rounded-3xl border border-white/70 bg-white/80 p-2 shadow-olive backdrop-blur md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold",
                  isActive ? "bg-olive-mid text-white" : "text-olive-dark"
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
        {user && (
          <button
            onClick={logout}
            className="flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-olive-dark"
          >
            <LogOut size={18} />
            Sortir
          </button>
        )}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
