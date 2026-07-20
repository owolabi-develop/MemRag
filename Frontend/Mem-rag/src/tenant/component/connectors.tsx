import { useEffect, useRef, useState } from "react";
import {
  HardDrive,
  Database,
  Box,
  CheckCircle2,
  Link2,
  Unlink,
  ChevronDown,
  Folder,
  FileText,
  Upload,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  useConnectMutation,
  useConnectorStatusQuery,
  useDisconnectMutation,
  useSyncDocumentsMutation,
  useConnectGoogleDriveMutation,
} from "../../shared/hooks/useConnectors";
import { useIngestStatusQuery } from "../../shared/hooks/useDocumentIngest";
import type { ConnectorId, RemoteItem } from "../../shared/api/connectors.api";

import { getDepartments } from "../../shared/api/department.api";
import { useAuthStore } from "../../shared/store/authStore";
import type { DepartmentOption } from "../../shared/types/department";
import {
  useLoaderData,
  redirect,
  type LoaderFunctionArgs,
} from "react-router";

interface CredentialField {
  name: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
}

interface ConnectorConfig {
  id: ConnectorId;
  name: string;
  description: string;
  icon: typeof HardDrive;
  accent: string;
  fields: CredentialField[];
  fileField?: {
    name: string;
    label: string;
    accept: string;
    helperText?: string;
  };
}

const CONNECTORS: ConnectorConfig[] = [
  {
    id: "amazon_s3",
    name: "Amazon S3",
    description: "Sync objects from an S3 bucket into a department.",
    icon: Database,
    accent: "orange",
    fields: [
      { name: "access_key_id", label: "Access Key ID" },
      { name: "secret_access_key", label: "Secret Access Key", type: "password" },
      { name: "bucket_name", label: "Bucket Name" },
      { name: "region", label: "Region", placeholder: "us-east-1" },
      { name: "endpoint_url", label: "Endpoint Url", placeholder: "optional.." },
    ],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Sync files from a connected Dropbox account.",
    icon: Box,
    accent: "indigo",
    fields: [
      { name: "access_token", label: "Access Token", type: "password", placeholder: "sl.xxxxxxxx" },
      { name: "folder_path", label: "Folder Path", placeholder: "/pdfs" },
    ],
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Sync documents shared with your service account on Google Drive.",
    icon: HardDrive,
    accent: "blue",
    fields: [],
    fileField: {
      name: "credentials_file",
      label: "Service Account JSON Key",
      accept: "application/json,.json",
      helperText:
        "The JSON key file downloaded when you created the service account. Make sure you've shared the relevant Drive folder with its client_email first.",
    },
  },
];

const ACCENT_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
};

function formatBytes(bytes: number | null) {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MultiSelectDropdown({
  options,
  selectedPaths,
  onChange,
  disabled,
}: {
  options: RemoteItem[];
  selectedPaths: string[];
  onChange: (paths: string[]) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOption(path: string) {
    onChange(
      selectedPaths.includes(path)
        ? selectedPaths.filter((existing) => existing !== path)
        : [...selectedPaths, path]
    );
  }

  const label =
    selectedPaths.length === 0
      ? "Select documents"
      : `${selectedPaths.length} document${selectedPaths.length > 1 ? "s" : ""} selected`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-left text-sm outline-none ${
          disabled
            ? "cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400"
            : "border-neutral-300 bg-white hover:border-neutral-400"
        }`}
      >
        <span className={selectedPaths.length === 0 ? "text-neutral-400" : ""}>{label}</span>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-neutral-500">No documents found.</p>
          ) : (
            options.map((item) => {
              const isFolder = item.type === "folder";
              const checked = selectedPaths.includes(item.path);

              return (
                <label
                  key={item.path}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                    isFolder ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-neutral-50"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isFolder}
                      onChange={() => toggleOption(item.path)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                    {isFolder ? (
                      <Folder size={15} className="flex-shrink-0 text-neutral-400" />
                    ) : (
                      <FileText size={15} className="flex-shrink-0 text-neutral-400" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="flex-shrink-0 text-xs text-neutral-400">
                    {isFolder ? "Folder" : formatBytes(item.size_bytes)}
                  </span>
                </label>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ---- Sync job progress (reuses the same status endpoint as document upload) ----

const STATUS_CONFIG = {
  queued: { label: "Queued", tone: "text-neutral-500", bg: "bg-neutral-50", border: "border-neutral-200", icon: Clock },
  in_progress: { label: "Processing", tone: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: Loader2 },
  complete: { label: "Complete", tone: "text-green-700", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2 },
  error: { label: "Failed", tone: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle },
} as const;

function SyncJobRow({ jobId, fileName }: { jobId: string; fileName: string }) {
  const { data } = useIngestStatusQuery(jobId);
  const status = (data?.status ?? "queued") as keyof typeof STATUS_CONFIG;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.queued;
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-between rounded-lg border ${config.border} ${config.bg} px-3 py-2 text-xs`}>
      <span className="flex min-w-0 items-center gap-2">
        <Icon size={13} className={`flex-shrink-0 ${config.tone} ${status === "in_progress" ? "animate-spin" : ""}`} />
        <span className="truncate font-medium text-neutral-700">{fileName}</span>
      </span>
      <span className={`flex-shrink-0 font-medium ${config.tone}`}>
        {status === "error" && data?.error ? data.error : config.label}
      </span>
    </div>
  );
}

export async function ConnectorsDepartmentLoader({}: LoaderFunctionArgs) {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return redirect("/login");
  }

  const departments = await getDepartments();
  return { departments };
}

function ConnectorCard({ config }: { config: ConnectorConfig }) {
  const { departments } = useLoaderData() as { departments: DepartmentOption[] };
  const Icon = config.icon;
  const accent = ACCENT_CLASSES[config.accent];

  const statusQuery = useConnectorStatusQuery(config.id);
  const connectMutation = useConnectMutation(config.id);
  const disconnectMutation = useDisconnectMutation(config.id);
  const syncMutation = useSyncDocumentsMutation();
  const connectGoogleDriveMutation = useConnectGoogleDriveMutation();

  const [departmentId, setDepartmentId] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Credentials captured at connect time so the same values can be
  // resent to /connectors/sync later — matches the "no server storage,
  // client resends credentials" model established earlier for connectors.
  const [savedCredentials, setSavedCredentials] = useState<Record<string, string>>({});

  const [localConnected, setLocalConnected] = useState<{
    status: "connected";
    items: RemoteItem[];
  } | null>(null);

  // Jobs from the most recent sync — each paired with the file name it
  // came from (matched by array position, since /connectors/sync returns
  // job ids in the same order file_paths were sent).
  const [syncJobs, setSyncJobs] = useState<{ jobId: string; fileName: string }[]>([]);

  const isConnected =
    localConnected !== null || statusQuery.data?.status === "connected";
  const items = localConnected?.items ?? statusQuery.data?.items ?? [];

  function handleConnect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFileError(null);
    const formData = new FormData(event.currentTarget);

    if (config.fileField) {
      const file = formData.get(config.fileField.name) as File | null;
      if (!file || file.size === 0) {
        setFileError("Please select a file.");
        return;
      }
      const body = new FormData();
      body.append(config.fileField.name, file);
      connectGoogleDriveMutation.mutate(body, {
        onSuccess: (data) => {
          setLocalConnected({ status: "connected", items: data.items ?? [] });
        },
      });
      return;
    }

    const credentials = Object.fromEntries(
      config.fields.map((field) => [field.name, String(formData.get(field.name) ?? "")])
    );
    setSavedCredentials(credentials);
    connectMutation.mutate(credentials, {
      onSuccess: (data) => {
        setLocalConnected({ status: "connected", items: data.items ?? [] });
      },
    });
  }

  function handleDisconnect() {
    setDepartmentId("");
    setSelectedPaths([]);
    setSelectedFileName(null);
    setLocalConnected(null);
    setSyncJobs([]);
    setSavedCredentials({});
    syncMutation.reset();
    disconnectMutation.mutate();
  }

  function handleSyncSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    syncMutation.reset();

    let hasError = false;
    if (!departmentId) {
      setDepartmentError("Please select a department.");
      hasError = true;
    } else {
      setDepartmentError(null);
    }

    if (selectedPaths.length === 0) {
      setDocumentError("Select at least one document to sync.");
      hasError = true;
    } else {
      setDocumentError(null);
    }

    if (hasError) return;

    // Credentials for connect-file connectors (Google Drive) can't be
    // resent this way — only the JSON key upload was captured, not raw
    // field values. If Google Drive sync needs to hit the same
    // credential-resend model, its form/credential shape would need
    // rethinking; flagging rather than guessing at a fix here.
    syncMutation.mutate(
      {
        connectorId: config.id,
        credentials: savedCredentials,
        departmentId,
        filePaths: selectedPaths,
      },
      {
        onSuccess: (jobs) => {
          const paths = selectedPaths;
          setSyncJobs(
            jobs.map((job, i) => ({
              jobId: job.job_id,
              fileName: items.find((it) => it.path === paths[i])?.name ?? paths[i],
            }))
          );
          setSelectedPaths([]);
        },
      }
    );
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
        <Loader2 size={18} className="animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${accent.border} ${accent.bg}`}
          >
            <Icon size={18} className={accent.text} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{config.name}</h3>
              {isConnected && (
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 size={12} />
                  Connected
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-500">{config.description}</p>
          </div>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Unlink size={13} />
            {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
          </button>
        )}
      </div>

      {/* Connect form — text-field variant (S3, Dropbox) */}
      {!isConnected && !config.fileField && (
        <form onSubmit={handleConnect} className="mt-5 space-y-4 border-t border-neutral-100 pt-5">
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm font-medium">{field.label}</label>
              <input
                name={field.name}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                className="h-11 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-black"
              />
            </div>
          ))}

          {connectMutation.isError && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} />
              {(connectMutation.error as Error).message}
            </div>
          )}

          <button
            type="submit"
            disabled={connectMutation.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {connectMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 size={16} />
                Connect {config.name}
              </>
            )}
          </button>
        </form>
      )}

      {/* Connect form — file-upload variant (Google Drive) */}
      {!isConnected && config.fileField && (
        <form onSubmit={handleConnect} className="mt-5 space-y-4 border-t border-neutral-100 pt-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {config.fileField.label}
            </label>

            <label
              className={`flex h-24 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 text-center transition-colors ${
                fileError
                  ? "border-red-300 bg-red-50/40"
                  : "border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 hover:bg-neutral-50"
              }`}
            >
              <input
                name={config.fileField.name}
                type="file"
                accept={config.fileField.accept}
                className="hidden"
                onChange={(e) => {
                  setSelectedFileName(e.target.files?.[0]?.name ?? null);
                  setFileError(null);
                }}
              />
              <Upload size={18} className="text-neutral-400" />
              <span className="text-sm text-neutral-600">
                {selectedFileName ?? (
                  <>
                    <span className="font-medium underline">Click to upload</span> your key file
                  </>
                )}
              </span>
            </label>

            {config.fileField.helperText && (
              <p className="mt-1.5 text-xs text-neutral-400">{config.fileField.helperText}</p>
            )}

            {fileError && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={14} />
                {fileError}
              </div>
            )}
          </div>

          {connectGoogleDriveMutation.isError && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} />
              {(connectGoogleDriveMutation.error as Error).message}
            </div>
          )}

          <button
            type="submit"
            disabled={connectGoogleDriveMutation.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {connectGoogleDriveMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 size={16} />
                Connect {config.name}
              </>
            )}
          </button>
        </form>
      )}

      {isConnected && (
        <form onSubmit={handleSyncSubmit} className="mt-5 space-y-4 border-t border-neutral-100 pt-5">
          {syncMutation.isError && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} />
              {(syncMutation.error as Error).message}
            </div>
          )}

          {syncJobs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500">
                Sync progress ({syncJobs.length} file{syncJobs.length > 1 ? "s" : ""})
              </p>
              {syncJobs.map((job) => (
                <SyncJobRow key={job.jobId} jobId={job.jobId} fileName={job.fileName} />
              ))}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              name="department_id"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                if (e.target.value) setDepartmentError(null);
              }}
              className={`h-11 w-full rounded-xl border px-4 outline-none focus:border-black ${
                departmentError ? "border-red-300" : "border-neutral-300"
              }`}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {departmentError && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={14} />
                {departmentError}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Documents <span className="text-red-500">*</span>
            </label>
            <MultiSelectDropdown
              options={items}
              selectedPaths={selectedPaths}
              onChange={(paths) => {
                setSelectedPaths(paths);
                if (paths.length > 0) setDocumentError(null);
              }}
            />
            {documentError && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle size={14} />
                {documentError}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={syncMutation.isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Sync Documents
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function Connectors() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Connectors</h1>
          <p className="mt-2 text-neutral-500">
            Connect a storage provider and sync documents into a department.
          </p>
        </div>

        
         < a href="/dashboard/connectors"
          className="text-sm font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-900"
        >
          Manage
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {CONNECTORS.map((config) => (
          <ConnectorCard key={config.id} config={config} />
        ))}
      </div>
    </div>
  );
}