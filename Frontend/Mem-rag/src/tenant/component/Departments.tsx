import { useState } from "react";
import { Form } from "react-router";
import { Building2, Users, Plus, ChevronRight, UserMinus } from "lucide-react";

const DEPARTMENTS = [
  {
    id: "1",
    name: "Engineering",
    description: "Engineering documents",
    created: "02 Jul 2026",
    members: 12,
    memberList: [
      { id: "1", name: "John Doe", role: "Engineering Lead" },
      { id: "2", name: "Sarah Kim", role: "Backend Engineer" },
    ],
  },
  {
    id: "2",
    name: "Finance",
    description: "Financial reports",
    created: "29 Jun 2026",
    members: 5,
    memberList: [
      { id: "3", name: "Amaka Obi", role: "Financial Analyst" },
    ],
  },
];

const USERS = [
  {
    id: "1",
    name: "John Doe",
  },
  {
    id: "2",
    name: "Sarah Kim",
  },
  {
    id: "3",
    name: "Amaka Obi",
  },
];

export default function Departments() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<"assign" | "remove">("assign");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  function toggleDepartment(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  const selectedDepartment = DEPARTMENTS.find(
    (d) => d.id === selectedDepartmentId
  );

  // In "remove" mode, only that department's current members make sense
  // to show. In "assign" mode, show everyone.
  const usersForMode =
    assignMode === "remove" && selectedDepartment
      ? selectedDepartment.memberList
      : USERS;

  return (
    <div className="space-y-8">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold">
          Departments
        </h1>

        <p className="mt-2 text-neutral-500">
          Create departments and assign members.
        </p>
      </div>

      {/* Top */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Create */}

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Building2 size={18} />

            <h2 className="font-semibold">
              Create Department
            </h2>
          </div>

          <Form method="post" className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Department Name
              </label>

              <input
                name="name"
                className="h-11 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                name="description"
                rows={4}
                className="w-full rounded-xl border border-neutral-300 p-4 outline-none focus:border-black"
              />
            </div>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white"
            >
              <Plus size={16} />
              Create Department
            </button>
          </Form>
        </div>

        {/* Assign / Remove */}

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} />

              <h2 className="font-semibold">
                Manage Membership
              </h2>
            </div>

            {/* Segmented toggle */}
            <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-sm">
              <button
                type="button"
                onClick={() => setAssignMode("assign")}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  assignMode === "assign"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Assign
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("remove")}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  assignMode === "remove"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                Remove
              </button>
            </div>
          </div>

          <Form method="post" className="mt-6 space-y-5">
            {/* Tells the route action which operation to perform */}
            <input type="hidden" name="intent" value={assignMode} />

            <div>
              <label className="mb-2 block text-sm font-medium">
                Department
              </label>

              <select
                name="department_id"
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-300 px-4"
              >
                <option value="">Select department</option>

                {DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                User
              </label>

              <select
                name="user_id"
                disabled={assignMode === "remove" && !selectedDepartmentId}
                className="h-11 w-full rounded-xl border border-neutral-300 px-4 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
              >
                <option value="">
                  {assignMode === "remove" && !selectedDepartmentId
                    ? "Select a department first"
                    : assignMode === "remove"
                    ? "Select member to remove"
                    : "Select user"}
                </option>

                {usersForMode.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              {assignMode === "remove" &&
                selectedDepartment &&
                selectedDepartment.memberList.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-500">
                    This department has no members to remove.
                  </p>
                )}
            </div>

            {assignMode === "assign" ? (
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90"
              >
                <Plus size={16} />
                Assign User
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  !selectedDepartment ||
                  selectedDepartment.memberList.length === 0
                }
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-50"
              >
                <UserMinus size={16} />
                Remove User
              </button>
            )}
          </Form>
        </div>
      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="font-semibold">
            Existing Departments
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50">
              <tr className="text-left text-sm text-neutral-500">
                <th className="w-10 px-6 py-3" />
                <th className="px-2 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Members</th>
              </tr>
            </thead>

            <tbody>
              {DEPARTMENTS.map((d) => {
                const isExpanded = expandedId === d.id;

                return (
                  <>
                    <tr
                      key={d.id}
                      onClick={() => toggleDepartment(d.id)}
                      className="cursor-pointer border-t border-neutral-100 text-sm transition-colors hover:bg-neutral-50"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? "Collapse members" : "Expand members"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDepartment(d.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-all hover:border-neutral-900 hover:bg-neutral-900 hover:text-white"
                        >
                          <ChevronRight
                            size={14}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      </td>

                      <td className="px-2 py-4 font-medium">
                        {d.name}
                      </td>

                      <td className="px-6 py-4 text-neutral-600">
                        {d.description}
                      </td>

                      <td className="px-6 py-4 text-neutral-500">
                        {d.created}
                      </td>

                      <td className="px-6 py-4">
                        {d.members}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${d.id}-members`} className="border-t border-neutral-100 bg-neutral-50/60">
                        <td colSpan={5} className="px-6 py-4">
                          {d.memberList.length > 0 ? (
                            <ul className="space-y-2 pl-9">
                              {d.memberList.map((member) => (
                                <li
                                  key={member.id}
                                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm"
                                >
                                  <span className="font-medium">{member.name}</span>
                                  <span className="text-neutral-500">{member.role}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="pl-9 text-sm text-neutral-500">
                              No members assigned yet.
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}