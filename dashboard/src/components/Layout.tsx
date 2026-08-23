import { useEffect, useState, type ReactNode } from "react";
import { Menu, Sun, Moon, LogOut } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../hooks/useAuth";

const THEME_KEY = "dashboard_theme";

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem(THEME_KEY) as "dark" | "light") ?? "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

export function Layout({ title, children }: { title: string; children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { admin, logout } = useAuth();

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 90 }}
        />
      )}

      <div className="main-area">
        <div className="topbar">
          <div className="flex-row">
            <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)} aria-label="القائمة">
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <h2>{title}</h2>
          </div>

          <div className="flex-row">
            <button className="theme-toggle" onClick={toggle} title="تبديل المظهر">
              {theme === "dark" ? <Sun size={17} strokeWidth={1.75} /> : <Moon size={17} strokeWidth={1.75} />}
            </button>
            <span className="text-secondary" style={{ marginInline: 4 }}>
              {admin?.username}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={logout}>
              <LogOut size={15} strokeWidth={1.75} />
              خروج
            </button>
          </div>
        </div>

        <div className="content-area">{children}</div>
      </div>
    </div>
  );
}
