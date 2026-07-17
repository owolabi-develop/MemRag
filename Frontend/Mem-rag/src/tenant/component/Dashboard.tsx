import { NavLink, Outlet, useNavigate, Navigate, useLocation } from "react-router";
import {
  Plug,
  UserPlus,
  Building2,
  Upload,
  Settings,
  LayoutGrid,
  MessageSquare,
  LogOut,
} from "lucide-react";
import groundly_logo from "../../assets/images/Groundly-logo.png";

import { useAuthStore } from "../../shared/store/authStore";
import { useSTenantIDStore } from "../../shared/store/TenantStore";

const NAV_ITEMS = [
  {
    to: "/dashboard/overview",
    label: "Overview",
    icon: LayoutGrid,
    end: true,
  },
  {
    to: "/dashboard/members",
    label: "Invite user",
    icon: UserPlus,
  },
  {
    to: "/dashboard/departments",
    label: "departments",
    icon: Building2,
  },
  {
    to: "/chat",
    label: "chat",
    icon: MessageSquare,
  },

  {
    to: "/dashboard/documents",
    label: "Upload document",
    icon: Upload,
  },
  {
    to: "/dashboard/connectors",
    label: "Add connector",
    icon: Plug,
  },
  {
    to: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function TenantDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const clearID = useSTenantIDStore((s) => s.clearID)

  // No token → bounce to login, and remember where they were headed
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  function handleLogout() {
    clearAuth();
     clearID()
    navigate("/login", { replace: true });
  }

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="flex size-full">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-16 flex-col border-r border-neutral-200 bg-white transition-all duration-300 md:w-60">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-neutral-200 px-4 md:justify-start md:gap-2.5 md:px-5">
          <img
            src={groundly_logo}
            alt="Groundly"
            className="h-7 w-7 shrink-0"
          />

          <span className="hidden text-base font-semibold tracking-tight text-neutral-900 md:block">
            Groundly
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-2 py-4 md:px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                `flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors md:justify-start md:gap-2.5 ${
                  isActive
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />

              <span className="hidden md:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="flex items-center justify-center gap-2 border-t border-neutral-200 px-2 py-3.5 md:justify-start md:px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
            {initials}
          </div>

          <div className="hidden min-w-0 flex-1 md:block">
            <p className="truncate text-sm font-medium text-neutral-900">
              {user?.first_name || user?.last_name
                ? `${user.first_name} ${user.last_name}`.trim()
                : (user?.email ?? "Account")}
            </p>

            <p className="truncate text-xs text-neutral-500">
              {user?.email ?? ""}
            </p>
          </div>

          {/* Logout — sits next to the name, not in the nav list above */}
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="hidden shrink-0 items-center justify-center rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:flex"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col pl-16 transition-all duration-300 md:pl-60">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 md:px-8">
          <h1 className="text-base font-semibold text-neutral-900">
            Overview
          </h1>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}