import { Link } from "react-router";
import { MessageSquare, Building2,Users } from "lucide-react";
import groundly_logo from "../../../assets/images/Groundly-logo.png";

type Department = {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  memberCount: number;
};

// Replace with real data from your loader — empty array shows the "no department" state
const DEPARTMENTS: Department[] = [
  {
    id: "eng",
    name: "Engineering",
    description: "Technical documentation, architecture decisions, and runbooks.",
    documentCount: 128,
    memberCount: 14,
  },
];

// Replace with real user data from your loader/auth context
const USER = { name: "John Doe", initials: "JD" };

export default function UserDashboard() {
  const hasDepartments = DEPARTMENTS.length > 0;

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
            {USER.initials}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Welcome back, {USER.name.split(" ")[0]}
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
            Your department{DEPARTMENTS.length !== 1 ? "s" : ""}
          </h2>

          {hasDepartments ? (
            <div className="mt-3 space-y-3">
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-xl border border-neutral-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                          <Building2 size={16} className="text-neutral-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-neutral-900">
                          {dept.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-5 text-neutral-500">
                        {dept.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                        <span>{dept.documentCount} documents</span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {dept.memberCount} members
                        </span>
                      </div>
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