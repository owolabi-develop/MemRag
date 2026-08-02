// component/overview.tsx

import { Link, Navigate } from "react-router";
import { ArrowUpRight, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../shared/store/authStore";
import {
  useInvitedUsersCountQuery,
  useDepartmentsListQuery,
  useTenantDocumentCountQuery,
  useDepartmentDocumentCounts,
} from "../../shared/hooks/useOverviewData";

const CONNECTORS = [
  { name: "Google Drive", status: "Synced", lastSync: "12 min ago" },
  { name: "Amazon S3", status: "Synced", lastSync: "1 hr ago" },
  { name: "OneDrive", status: "Syncing", lastSync: "In progress" },
  { name: "DropBox", status: "Syncing", lastSync: "In progress" },
];

export default function Overview() {
  const token = useAuthStore((s) => s.accessToken);

  const {
    data: invitedUsers,
    isLoading: isUsersLoading,
  } = useInvitedUsersCountQuery();

  const {
    data: departments,
    isLoading: isDepartmentsLoading,
    isError: isDepartmentsError,
  } = useDepartmentsListQuery();

  const {
    data: tenantDocCount,
    isLoading: isTenantDocCountLoading,
  } = useTenantDocumentCountQuery();

  const departmentDocQueries = useDepartmentDocumentCounts(departments ?? []);
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isLoadingCore =
    isUsersLoading || isDepartmentsLoading || isTenantDocCountLoading;

  const totalDocuments = tenantDocCount?.total_documents ?? 0;


  const departmentCoverage = (departments ?? []).map((d, i) => {
    const docs = departmentDocQueries[i]?.data?.total_documents ?? 0;
    const share = totalDocuments > 0 ? Math.round((docs / totalDocuments) * 100) : 0;
    return { name: d.name, docs, share };
  });

  const STATS = [
    {
      label: "Users",
      value: String(invitedUsers?.length ?? 0),
      delta: null,
      note: `${invitedUsers?.filter((u) => u.status === "pending").length ?? 0} pending invites`,
    },
    {
      label: "Departments",
      value: String(departments?.length ?? 0),
      delta: null,
      note: "in this workspace",
    },
    {
      label: "Documents",
      value: String(totalDocuments),
      delta: null,
      note: "across all departments",
    },
    {
      label: "Connectors",
      value: String(CONNECTORS.length),
      delta: null,
      note: "all synced",
    },
  ];

  if (isLoadingCore) {
    return (
      <div className="flex items-center gap-2 p-10 text-sm text-neutral-500">
        <Loader2 size={16} className="animate-spin" />
        Loading overview…
      </div>
    );
  }

  if (isDepartmentsError) {
    return (
      <div className="m-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle size={16} />
        Couldn't load overview data.
      </div>
    );
  }

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
            {departmentCoverage.length === 0 && (
              <p className="text-sm text-neutral-500">No departments yet.</p>
            )}

            {departmentCoverage.map((d) => (
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
    </div>
  );
}