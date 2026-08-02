// pages/Departments.tsx

import { useState, type FormEvent } from "react";
import { Form } from "react-router";
import {
  Building2,
  Users,
  Plus,
  ChevronRight,
  UserMinus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "../../shared/store/authStore";
import { useTenantQuery } from "../../shared/hooks/useTenant";
import {
  useDepartmentsQuery,
  useCreateDepartmentMutation,
  useAddUserToDepartmentMutation,
  useRemoveUserFromDepartmentMutation,
} from "../../shared/hooks/useDepartments";
import { useInvitedUsersQuery } from "../../shared/hooks/Useinvitedusers";
import { ApiError } from "../../shared/api/httpClient"; 
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Departments() {
  const role = useAuthStore((s) => s.user?.role);
  console.log(`roles ${role}`)
  const isAdmin = role === "admin";

  const {
    data: tenant,
    isLoading: isTenantLoading,
    isError: isTenantError,
  } = useTenantQuery();

  const {isLoading: isDepartmentsLoading } =
    useDepartmentsQuery();

  const { data: invitedUsers, isLoading: isUsersLoading } =
    useInvitedUsersQuery();

  const createDepartmentMutation = useCreateDepartmentMutation();
  const addUserMutation = useAddUserToDepartmentMutation();
  const removeUserMutation = useRemoveUserFromDepartmentMutation();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assignMode, setAssignMode] = useState<"assign" | "remove">("assign");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [createError, setCreateError] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [membershipSuccess, setMembershipSuccess] = useState<string | null>(
    null
  );

  function toggleDepartment(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  const departments = tenant?.departments ?? [];

  const selectedDepartment = departments.find(
    (d) => d.id === selectedDepartmentId
  );

  // Assign mode: show tenant users not already in this department.
  // Remove mode: show only that department's current members.
  const usersForMode =
    assignMode === "remove"
      ? (selectedDepartment?.users ?? [])
      : (invitedUsers ?? []).filter(
          (u) => !selectedDepartment?.users.some((m) => m.id === u.id)
        );

  function handleCreateDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    if (!name) {
      setCreateError("Department name is required.");
      return;
    }

    createDepartmentMutation.mutate(name, {
      onSuccess: () => {
        event.currentTarget.reset();
      },
      onError: (err) => {
        setCreateError(
          err instanceof ApiError
            ? err.message
            : "Failed to create department. Please try again."
        );
      },
    });
  }

  function handleMembershipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMembershipError(null);
    setMembershipSuccess(null);

    if (!selectedDepartmentId || !selectedUserId) {
      setMembershipError("Select both a department and a user.");
      return;
    }

    const mutation =
      assignMode === "assign" ? addUserMutation : removeUserMutation;

    mutation.mutate(
      { departmentId: selectedDepartmentId, userId: selectedUserId },
      {
        onSuccess: () => {
          setSelectedUserId("");
          setMembershipSuccess(
            assignMode === "assign"
              ? "User assigned to department."
              : "User removed from department."
          );
        },
        onError: (err) => {
          setMembershipError(
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again."
          );
        },
      }
    );
  }

  if (isTenantLoading || isDepartmentsLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-neutral-500">
        <Loader2 size={16} className="animate-spin" />
        Loading departments…
      </div>
    );
  }

  if (isTenantError) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle size={16} />
        Couldn't load department data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="mt-2 text-neutral-500">
          {isAdmin
            ? "Create departments and assign members."
            : "View your organization's departments."}
        </p>
      </div>

      {/* Top — admin only */}
      {isAdmin && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Create */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center gap-3">
              <Building2 size={18} />
              <h2 className="font-semibold">Create Department</h2>
            </div>

            {createError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={14} />
                {createError}
              </div>
            )}

            <Form
              method="post"
              onSubmit={handleCreateDepartment}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Department Name
                </label>
                <input
                  name="name"
                  className="h-11 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                disabled={createDepartmentMutation.isPending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createDepartmentMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {createDepartmentMutation.isPending
                  ? "Creating…"
                  : "Create Department"}
              </button>
            </Form>
          </div>

          {/* Assign / Remove */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={18} />
                <h2 className="font-semibold">Manage Membership</h2>
              </div>

              {/* Segmented toggle */}
              <div className="flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setAssignMode("assign");
                    setSelectedUserId("");
                    setMembershipError(null);
                    setMembershipSuccess(null);
                  }}
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
                  onClick={() => {
                    setAssignMode("remove");
                    setSelectedUserId("");
                    setMembershipError(null);
                    setMembershipSuccess(null);
                  }}
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

            {membershipSuccess && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {membershipSuccess}
              </div>
            )}

            {membershipError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={14} />
                {membershipError}
              </div>
            )}

            <Form
              method="post"
              onSubmit={handleMembershipSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Department
                </label>
                <select
                  name="department_id"
                  value={selectedDepartmentId}
                  onChange={(e) => {
                    setSelectedDepartmentId(e.target.value);
                    setSelectedUserId("");
                  }}
                  className="h-11 w-full rounded-xl border border-neutral-300 px-4"
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
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
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={!selectedDepartmentId || isUsersLoading}
                  className="h-11 w-full rounded-xl border border-neutral-300 px-4 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400"
                >
                  <option value="">
                    {!selectedDepartmentId
                      ? "Select a department first"
                      : assignMode === "remove"
                        ? "Select member to remove"
                        : "Select user"}
                  </option>
                  {usersForMode.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.role})
                    </option>
                  ))}
                </select>

                {selectedDepartmentId && usersForMode.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-500">
                    {assignMode === "remove"
                      ? "This department has no members to remove."
                      : "All tenant users are already in this department."}
                  </p>
                )}
              </div>

              {assignMode === "assign" ? (
                <button
                  type="submit"
                  disabled={addUserMutation.isPending || !selectedUserId}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addUserMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  {addUserMutation.isPending ? "Assigning…" : "Assign User"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={removeUserMutation.isPending || !selectedUserId}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-50"
                >
                  {removeUserMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserMinus size={16} />
                  )}
                  {removeUserMutation.isPending
                    ? "Removing…"
                    : "Remove User"}
                </button>
              )}
            </Form>
          </div>
        </div>
      )}

      {/* Table — visible to everyone */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="font-semibold">Existing Departments</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50">
              <tr className="text-left text-sm text-neutral-500">
                <th className="w-10 px-6 py-3" />
                <th className="px-2 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 font-medium">Members</th>
              </tr>
            </thead>

            <tbody>
              {departments.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-neutral-500"
                  >
                    No departments yet.
                  </td>
                </tr>
              )}

              {departments.map((d) => {
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
                          aria-label={
                            isExpanded ? "Collapse members" : "Expand members"
                          }
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

                      <td className="px-2 py-4 font-medium">{d.name}</td>

                      <td className="px-6 py-4 text-neutral-500">
                        {formatDate(d.created_at)}
                      </td>

                      <td className="px-6 py-4">{d.users.length}</td>
                    </tr>

                    {isExpanded && (
                      <tr
                        key={`${d.id}-members`}
                        className="border-t border-neutral-100 bg-neutral-50/60"
                      >
                        <td colSpan={4} className="px-6 py-4">
                          {d.users.length > 0 ? (
                            <ul className="space-y-2 pl-9">
                              {d.users.map((member) => (
                                <li
                                  key={member.id}
                                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm"
                                >
                                  <span className="font-medium">
                                    {member.first_name} {member.last_name}
                                  </span>
                                  <span className="text-neutral-500">
                                    {member.email}
                                  </span>
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