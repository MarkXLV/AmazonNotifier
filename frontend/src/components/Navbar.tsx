import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Settings,
  Menu,
  X,
  Moon,
  Sun,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../theme";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-line backdrop-blur-lg"
      style={{ backgroundColor: "color-mix(in srgb, var(--paper) 82%, transparent)" }}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-primary text-primary-fg">
            <TrendingUp size={20} strokeWidth={2.4} />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-ink">
            PriceWatch
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary font-semibold text-primary-fg"
                    : "font-medium text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
          <div className="mx-2 h-6 w-px bg-line" />
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="rounded-lg p-2 text-muted hover:bg-surface-2"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-line bg-surface px-4 pb-4 pt-2 sm:hidden">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                  active ? "bg-primary text-primary-fg" : "text-muted"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
