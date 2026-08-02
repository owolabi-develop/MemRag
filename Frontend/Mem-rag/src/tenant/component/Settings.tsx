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
  Loader2,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useTenantQuery } from "../../shared/hooks/useTenant";
import { useUpdatePasswordMutation } from "../../shared/hooks/useUpdatePassword";
import { ApiError } from "../../shared/api/httpClient"; // adjust to match your actual path
import {
  useGeminiSettingsStore,
  GEMINI_MODELS,
  type GeminiModelId,
} from "../../shared/store/geminiSettingsStore";
import { useCohereSettingsStore } from "../../shared/store/cohereSettingsStore";

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
  form?: string;
}

function GeminiSettingsSection() {
  const { apiKey, model, setGeminiSettings, clearGeminiSettings } = useGeminiSettingsStore();

  const [apiKeyInput, setApiKeyInput] = useState(apiKey ?? "");
  const [modelInput, setModelInput] = useState<GeminiModelId>(model);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!apiKeyInput.trim()) {
      setError("Enter your Gemini API key.");
      return;
    }

    setError(null);
    setGeminiSettings(apiKeyInput.trim(), modelInput);
  }

  function handleRemove() {
    clearGeminiSettings();
    setApiKeyInput("");
    setModelInput("gemini-2.5-flash");
    setError(null);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 xl:col-span-2">
      <div className="flex items-center gap-3">
        <Sparkles size={18} />
        <h2 className="font-semibold">Gemini API Key</h2>
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        Add your own Gemini API key and select a model to use for chat. Stored only in this
        browser not sent to our servers.
      </p>

      {apiKey && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} />
          Gemini key saved — using{" "}
          {GEMINI_MODELS.find((m) => m.id === model)?.label ?? model}.
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
        {/* API key */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            API Key <span className="text-red-500">*</span>
          </label>

          <div className="flex h-11 items-center rounded-xl border border-neutral-300 px-4 focus-within:border-black">
            <KeyRound size={15} className="mr-2 flex-shrink-0 text-neutral-400" />
            <input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIza..."
              className="w-full min-w-0 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              tabIndex={-1}
              className="ml-2 flex-shrink-0 text-neutral-400 hover:text-neutral-700"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Model select */}
        <div>
          <label className="mb-2 block text-sm font-medium">Model</label>
          <select
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value as GeminiModelId)}
            className="h-11 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-black"
          >
            <optgroup label="Gemini 3">
              {GEMINI_MODELS.filter((m) => m.tier === "Gemini 3").map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Gemini 2.5">
              {GEMINI_MODELS.filter((m) => m.tier === "Gemini 2.5").map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90"
          >
            <KeyRound size={16} />
            {apiKey ? "Update key" : "Save key"}
          </button>

          {apiKey && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function CohereSettingsSection() {
  const { cohere, setApiKey, clearApiKey } = useCohereSettingsStore();

  const [cohereApiKeyInput, setCohereApiKeyInput] = useState(cohere ?? "");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cohereApiKeyInput.trim()) {
      setError("Enter your Cohere API key.");
      return;
    }

    setError(null);
    setApiKey(cohereApiKeyInput.trim());
  }

  function handleRemove() {
    clearApiKey();
    setCohereApiKeyInput("");
    setError(null);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 xl:col-span-2">
      <div className="flex items-center gap-3">
        <Sparkles size={18} />
        <h2 className="font-semibold">Cohere API Key</h2>
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        Add your Cohere API key for reranking. Stored only in this browser not sent to our
        servers.
      </p>

      {cohereApiKeyInput && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} />
          Cohere key saved.
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* API key */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            API Key <span className="text-red-500">*</span>
          </label>

          <div className="flex h-11 items-center rounded-xl border border-neutral-300 px-4 focus-within:border-black">
            <KeyRound size={15} className="mr-2 flex-shrink-0 text-neutral-400" />
            <input
              type={showKey ? "text" : "password"}
              value={cohereApiKeyInput}
              onChange={(e) =>  setCohereApiKeyInput(e.target.value)}
              placeholder="Enter your Cohere API key"
              className="w-full min-w-0 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              tabIndex={-1}
              className="ml-2 flex-shrink-0 text-neutral-400 hover:text-neutral-700"
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90"
          >
            <KeyRound size={16} />
            {cohereApiKeyInput ? "Update key" : "Save key"}
          </button>

          {cohereApiKeyInput && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 px-5 text-sm font-medium text-neutral-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function Settings() {
  const { data: tenant, isLoading: isTenantLoading, isError: isTenantError } =
    useTenantQuery();

  const updatePasswordMutation = useUpdatePasswordMutation();

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
    setErrors((prev) => ({ ...prev, form: undefined }));

    if (!validate()) return;

    updatePasswordMutation.mutate(
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setSuccess(true);
        },
        onError: (err) => {
          const message =
            err instanceof ApiError
              ? err.message
              : "Failed to update password. Please try again.";
          setErrors((prev) => ({ ...prev, form: message }));
        },
      }
    );
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

          {isTenantLoading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
              <Loader2 size={15} className="animate-spin" />
              Loading workspace details…
            </div>
          )}

          {isTenantError && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              Couldn't load workspace details.
            </div>
          )}

          {tenant && (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm font-medium text-neutral-500">Tenant Name</p>
                <p className="mt-1 text-base font-medium">{tenant.name}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-500">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-neutral-700">
                  {tenant.description || "No description"}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-neutral-100 pt-5">
                <CalendarDays size={15} className="text-neutral-400" />
                <p className="text-sm text-neutral-500">
                  Created on{" "}
                  <span className="font-medium text-neutral-700">
                    {formatDate(tenant.created_at)}
                  </span>
                </p>
              </div>
            </div>
          )}
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

          {errors.form && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} />
              {errors.form}
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
              disabled={updatePasswordMutation.isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatePasswordMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Lock size={16} />
              )}
              {updatePasswordMutation.isPending ? "Updating…" : "Update Password"}
            </button>
          </Form>
        </div>

        <GeminiSettingsSection />
        <CohereSettingsSection />
      </div>
    </div>
  );
}