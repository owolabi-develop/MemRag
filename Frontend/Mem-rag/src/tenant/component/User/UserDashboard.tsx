// pages/UserDashboard.tsx

import { Link, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { MessageSquare, Building2 } from "lucide-react";
import groundly_logo from "../../../assets/images/Groundly-logo.png";
import { getDepartmentsForUser } from "../../../shared/api/department.api";
import type { Department } from "../../../shared/types/department";
import { useAuthStore } from "../../../shared/store/authStore";

export async function userDashboardLoader({}: LoaderFunctionArgs) {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return redirect("/login");
  }

  const departments = await getDepartmentsForUser();
  return { departments };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UserDashboard() {
  const { departments } = useLoaderData() as { departments:  Department[] };
  const user = useAuthStore((s) => s.user);

  const hasDepartments = departments.length > 0;
  const displayName = user?.first_name || "there";
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "??";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <img src={groundly_logo} alt="Groundly" className="h-7 w-7" />
            <span className="text-base font-semibold tracking-tight text-neutral-900">
              Groundly
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white">
            {initials}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Welcome back, {displayName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {hasDepartments
              ? "Here's what you have access to"
              : "Here's the status of your workspace access"}
          </p>
        </div>

        {/* Departments */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-neutral-900">
            Your department{departments.length !== 1 ? "s" : ""}
          </h2>

          {hasDepartments ? (
            <div className="mt-3 space-y-3">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                      <Building2 size={16} className="text-neutral-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {dept.name}
                      </h3>
                      <p className="mt-0.5 text-xs text-neutral-400">
                        Added {formatDate(dept.created_at)}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/chat`}
                    className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    <MessageSquare size={15} />
                    Chat with {dept.name} documents
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
                <Building2 size={18} className="text-neutral-400" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-neutral-900">
                You haven't been added to a department yet
              </h3>
              <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
                Once your workspace admin adds you to a department, you'll be
                able to chat with the documents you have access to from here.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}