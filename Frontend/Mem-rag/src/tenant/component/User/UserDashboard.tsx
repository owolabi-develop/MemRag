// pages/UserDashboard.tsx

import { Link, redirect, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { MessageSquare, Building2 } from "lucide-react";
import groundly_logo from "../../../assets/images/Groundly-logo.png";
import { getDepartmentsForUser } from "../../../shared/api/department.api";
import type { Department } from "../../../shared/types/department";
import { useAuthStore } from "../../../shared/store/authStore";
import {
  useGeminiSettingsStore,
  GEMINI_MODELS,
  type GeminiModelId,
} from "../../../shared/store/geminiSettingsStore";
import { useCohereSettingsStore } from "../../../shared/store/cohereSettingsStore";
import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from "lucide-react";



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
      <main className="mx-auto max-w-3xl px-6 py-10 space-y-5">
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
        <GeminiSettingsSection />
        <CohereSettingsSection />
      </main>

    </div>
  );
}