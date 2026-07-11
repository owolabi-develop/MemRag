import { Link } from "react-router";
import {
  Upload,
  Building2,
  Mail,
  Plug,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";

// Replace with real data from your loader
const STATS = [
  { label: "Users", value: "24", delta: "+3", note: "8 pending invites" },
  { label: "Departments", value: "6", delta: "+1", note: "this month" },
  { label: "Documents", value: "312", delta: "+18", note: "this week" },
  { label: "Connectors", value: "3", delta: null, note: "all synced" },
];

// Replace with real data from your loader
const DEPARTMENTS = [
  { name: "Engineering", docs: 128, share: 41 },
  { name: "Sales", docs: 74, share: 24 },
  { name: "People", docs: 52, share: 17 },
  { name: "Finance", docs: 34, share: 11 },
  { name: "Legal", docs: 24, share: 7 },
];

// Replace with real data from your loader
const CONNECTORS = [
  { name: "Google Drive", status: "Synced", lastSync: "12 min ago" },
  { name: "Amazon S3", status: "Synced", lastSync: "1 hr ago" },
  { name: "OneDrive", status: "Syncing", lastSync: "In progress" },
];

// Replace with real data from your loader
const ACTIVITY = [
  {
    icon: Upload,
    label: "Sarah Kim uploaded",
    detail: "security-policy.pdf",
    time: "2h ago",
  },
  {
    icon: Building2,
    label: "Department created",
    detail: "Engineering",
    time: "5h ago",
  },
  {
    icon: Mail,
    label: "Invite sent",
    detail: "mike@company.com",
    time: "1d ago",
  },
  {
    icon: Plug,
    label: "Connector added",
    detail: "Google Drive",
    time: "2d ago",
  },
];

export default function Overview() {
  return (
    <div className="space-y-10 p-5">
      {/* Stat strip */}
      <div className="grid grid-cols-2 divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        {STATS.map((s) => (
          <div key={s.label} className="px-5 py-4">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              {s.label}
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">
                {s.value}
              </span>
              {s.delta && (
                <span className="flex items-center text-xs font-medium text-neutral-500">
                  <ArrowUpRight size={12} />
                  {s.delta}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Department coverage */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Documents by department
            </h2>
            <Link
              to="/dashboard/departments"
              className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="mt-5 space-y-3.5">
            {DEPARTMENTS.map((d) => (
              <div key={d.name}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-neutral-800">
                    {d.name}
                  </span>
                  <span className="tabular-nums text-neutral-400">
                    {d.docs} docs
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-100">
                  <div
                    className="h-1.5 rounded-full bg-neutral-900"
                    style={{ width: `${d.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connectors */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              Connectors
            </h2>
            <Link
              to="/dashboard/connectors"
              className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              Manage
              <ArrowRight size={12} />
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-neutral-100">
            {CONNECTORS.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-medium text-neutral-800">{c.name}</span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      c.status === "Synced" ? "bg-neutral-900" : "bg-neutral-300"
                    }`}
                  />
                  {c.lastSync}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">
          Recent activity
        </h2>

        <ul className="mt-4">
          {ACTIVITY.map((a, i) => {
            const Icon = a.icon;
            const isLast = i === ACTIVITY.length - 1;
            return (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white">
                    <Icon size={13} className="text-neutral-500" />
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-neutral-100" />
                  )}
                </div>
                <div className={`flex-1 ${isLast ? "pb-0" : "pb-5"}`}>
                  <p className="text-sm text-neutral-800">
                    {a.label}{" "}
                    <span className="font-medium text-neutral-900">
                      {a.detail}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">{a.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}