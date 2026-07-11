import { useState, type FormEvent } from "react";
import { Form } from "react-router";
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

// Replace with real tenant data from your loader
const TENANT = {
  name: "Acme Logistics",
  description: "Core workspace for Acme's operations and finance teams.",
  createdAt: "2026-03-14",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function Settings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errors, setErrors] = useState<PasswordErrors>({});
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const nextErrors: PasswordErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = "Enter your current password.";
    }

    if (newPassword.length < 8) {
      nextErrors.newPassword = "New password must be at least 8 characters.";
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = "New password must be different from the current one.";
    }

    if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords don't match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(false);

    if (!validate()) return;

    // Hand off to your route action / mutation here.
    // On success, reset the form and surface confirmation:
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSuccess(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-neutral-500">
          Manage your workspace details and account security.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Tenant details */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Building2 size={18} />
            <h2 className="font-semibold">Workspace Details</h2>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-neutral-500">Tenant Name</p>
              <p className="mt-1 text-base font-medium">{TENANT.name}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-neutral-500">Description</p>
              <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                {TENANT.description}
              </p>
            </div>

            <div className="flex items-center gap-2 border-t border-neutral-100 pt-5">
              <CalendarDays size={15} className="text-neutral-400" />
              <p className="text-sm text-neutral-500">
                Created on{" "}
                <span className="font-medium text-neutral-700">
                  {formatDate(TENANT.createdAt)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Update password */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Lock size={18} />
            <h2 className="font-semibold">Update Password</h2>
          </div>

          {success && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={16} />
              Password updated successfully.
            </div>
          )}

          <Form method="post" onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Current password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Current Password <span className="text-red-500">*</span>
              </label>

              <div
                className={`flex h-11 items-center rounded-xl border px-4 focus-within:border-black ${
                  errors.currentPassword ? "border-red-300" : "border-neutral-300"
                }`}
              >
                <input
                  type={showCurrent ? "text" : "password"}
                  name="current_password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full outline-none"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  tabIndex={-1}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errors.currentPassword && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.currentPassword}
                </div>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                New Password <span className="text-red-500">*</span>
              </label>

              <div
                className={`flex h-11 items-center rounded-xl border px-4 focus-within:border-black ${
                  errors.newPassword ? "border-red-300" : "border-neutral-300"
                }`}
              >
                <input
                  type={showNew ? "text" : "password"}
                  name="new_password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full outline-none"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  tabIndex={-1}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errors.newPassword && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.newPassword}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Confirm New Password <span className="text-red-500">*</span>
              </label>

              <div
                className={`flex h-11 items-center rounded-xl border px-4 focus-within:border-black ${
                  errors.confirmPassword ? "border-red-300" : "border-neutral-300"
                }`}
              >
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm_password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full outline-none"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  className="text-neutral-400 hover:text-neutral-700"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errors.confirmPassword && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90"
            >
              <Lock size={16} />
              Update Password
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}