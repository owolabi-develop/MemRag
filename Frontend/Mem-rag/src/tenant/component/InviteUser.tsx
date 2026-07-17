import { useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Mail, User, Shield, ArrowRight,CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../../shared/store/authStore";
import { useInvitedUsersQuery, useInviteUserMutation } from "../../shared/hooks/Useinvitedusers";
import type { InviteUsers } from "../../shared/types/InviteUser";

const ROLES = [
  {
    value: "admin",
    label: "Administrator",
  },
  {
    value: "manager",
    label: "Manager",
  },
  {
    value: "employee",
    label: "Employee",
  },
];



export default function InviteUser() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  const {
    data: inviteUsers,
    isLoading,
    isError,
    error,
  } = useInvitedUsersQuery();

  const inviteMutation = useInviteUserMutation();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    inviteMutation.mutate(
      {
        email: String(formData.get("email") ?? "").trim(),
        first_name: String(formData.get("first_name") ?? "").trim(),
        last_name: String(formData.get("last_name") ?? "").trim(),
        role: String(formData.get("role") ?? "employee"),
      },
      {
        onSuccess: () => {
          formRef.current?.reset();
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* Form */}

        <div className="rounded-xl border border-neutral-200 bg-white p-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Invite User
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Invite a new team member to your Groundly workspace.
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-6">
            {inviteMutation.isError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {inviteMutation.error?.message ?? "Couldn't send the invitation. Please try again."}
              </div>
            )}

            {inviteMutation.isSuccess && (
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={16} />
             Invitation sent
            </div>
            )}

            {/* Email */}

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@company.com"
                  className="h-12 w-full rounded-xl border border-neutral-300 pl-11 pr-4 outline-none transition focus:border-black"
                />
              </div>
            </div>

            {/* First + Last */}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  First Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />

                  <input
                    type="text"
                    name="first_name"
                    required
                    placeholder="John"
                    className="h-12 w-full rounded-xl border border-neutral-300 pl-11 pr-4 outline-none transition focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Last Name
                </label>

                <input
                  type="text"
                  name="last_name"
                  required
                  placeholder="Doe"
                  className="h-12 w-full rounded-xl border border-neutral-300 px-4 outline-none transition focus:border-black"
                />
              </div>
            </div>

            {/* Role */}

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Role
              </label>

              <div className="relative">
                <Shield
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <select
                  name="role"
                  defaultValue="employee"
                  className="h-12 w-full appearance-none rounded-xl border border-neutral-300 bg-white pl-11 pr-4 outline-none transition focus:border-black"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {inviteMutation.isPending ? "Sending…" : "Send Invitation"}
              {!inviteMutation.isPending && (
                <ArrowRight
                  size={17}
                  className="transition group-hover:translate-x-1"
                />
              )}
            </button>
          </form>
        </div>

        {/* Right */}

        <div className="rounded-2xl border border-neutral-200 bg-white p-8">
          <h2 className="text-lg font-semibold">What happens next?</h2>

          <div className="mt-6 space-y-5 text-sm text-neutral-600">
            <div>
              <p className="font-medium text-neutral-900">1. Invitation Email</p>
              <p className="mt-1">
                Groundly sends an invitation link to the user's email.
              </p>
            </div>

            <div>
              <p className="font-medium text-neutral-900">2. Account Activation</p>
              <p className="mt-1">
                The user accepts the invitation and sets a new password.
              </p>
            </div>

            <div>
              <p className="font-medium text-neutral-900">3. Workspace Access</p>
              <p className="mt-1">
                Permissions are automatically assigned based on the selected role.
              </p>
            </div>
          </div>
        </div>

        {/* Invited Users */}

        <div className="rounded-xl border border-neutral-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Invited Users
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Track invitation status.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-100 last:border-0">
                      <td className="py-4" colSpan={3}>
                        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
                      </td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-sm text-red-600">
                      {error?.message ?? "Couldn't load invited users. Please try again."}
                    </td>
                  </tr>
                ) : !inviteUsers || inviteUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-sm text-neutral-400">
                      No users invited yet.
                    </td>
                  </tr>
                ) : (
                  inviteUsers.filter(user => user.status==="pending" || user.status==="accepted").map((user: InviteUsers) => (
                    <tr
                      key={user.id}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {user.first_name}
                          </p>
                          <p className="text-sm text-neutral-500">{user.email}</p>
                        </div>
                      </td>

                      <td className="py-4 text-sm text-neutral-700">{user.role}</td>

                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            user.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}