import { Form } from "react-router";
import { Mail, User, Shield, ArrowRight } from "lucide-react";

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

const INVITED_USERS = [
  {
    id: 1,
    name: "John Doe",
    email: "john@company.com",
    role: "Administrator",
    status: "Accepted",
    invited: "Jul 10, 2026",
  },
  {
    id: 2,
    name: "Sarah Kim",
    email: "sarah@company.com",
    role: "Manager",
    status: "Pending",
    invited: "Jul 9, 2026",
  },
  {
    id: 3,
    name: "Mike Ross",
    email: "mike@company.com",
    role: "Employee",
    status: "Pending",
    invited: "Jul 8, 2026",
  },
];

export default function InviteUser() {
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

          <Form method="post" className="mt-8 space-y-6">
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
                    <option
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}

            <button
              type="submit"
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 font-medium text-white transition hover:bg-black"
            >
              Send Invitation

              <ArrowRight
                size={17}
                className="transition group-hover:translate-x-1"
              />
            </button>
          </Form>
        </div>

        {/* Right */}

        <div className="rounded-2xl border border-neutral-200 bg-white p-8">
          <h2 className="text-lg font-semibold">
            What happens next?
          </h2>

          <div className="mt-6 space-y-5 text-sm text-neutral-600">
            <div>
              <p className="font-medium text-neutral-900">
                1. Invitation Email
              </p>

              <p className="mt-1">
                Groundly sends an invitation link to the user's email.
              </p>
            </div>

            <div>
              <p className="font-medium text-neutral-900">
                2. Account Activation
              </p>

              <p className="mt-1">
                The user accepts the invitation and sets a new password.
              </p>
            </div>

            <div>
              <p className="font-medium text-neutral-900">
                3. Workspace Access
              </p>

              <p className="mt-1">
                Permissions are automatically assigned based on the selected
                role.
              </p>
            </div>
          </div>
        </div>

         {/* Invited Users */}

<div className="rounded-xl border border-neutral-200 bg-white p-6">
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
        {INVITED_USERS.map((user) => (
          <tr
            key={user.id}
            className="border-b border-neutral-100 last:border-0"
          >
            <td className="py-4">
              <div>
                <p className="font-medium text-neutral-900">
                  {user.name}
                </p>

                <p className="text-sm text-neutral-500">
                  {user.email}
                </p>
              </div>
            </td>

            <td className="py-4 text-sm text-neutral-700">
              {user.role}
            </td>

            <td className="py-4">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  user.status === "Accepted"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {user.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      </div>
     
    </div>
  );
}