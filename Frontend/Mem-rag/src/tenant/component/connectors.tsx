import { useEffect, useRef, useState } from "react";
import {
  HardDrive,
  Database,
  CloudCog,
  Box,
  CheckCircle2,
  Link2,
  Unlink,
  ChevronDown,
  Folder,
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useConnectMutation,
  useConnectorStatusQuery,
  useDisconnectMutation,
  useSyncDocumentsMutation,
} from "../../shared/hooks/useConnectors";
import type { ConnectorId, RemoteItem } from "../../shared/api/connectors.api";

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
}

const DEPARTMENTS = [
  { id: "1", name: "Engineering" },
  { id: "2", name: "Finance" },
];

const CONNECTORS: ConnectorConfig[] = [
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Sync documents stored in your organization's Google Drive.",
    icon: HardDrive,
    accent: "blue",
    fields: [
      { name: "client_email", label: "Service Account Email" },
      { name: "private_key", label: "Private Key", type: "password" },
    ],
  },
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
    ],
  },
  {
    id: "onedrive",
    name: "OneDrive",
    description: "Sync files from a connected OneDrive / SharePoint account.",
    icon: CloudCog,
    accent: "sky",
    fields: [
      { name: "client_id", label: "Client ID" },
      { name: "client_secret", label: "Client Secret", type: "password" },
      { name: "tenant_id", label: "Tenant ID" },
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

/** Flat checkbox-list dropdown, keyed by path. Folder rows are shown but disabled. */
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

function ConnectorCard({ config }: { config: ConnectorConfig }) {
  const Icon = config.icon;
  const accent = ACCENT_CLASSES[config.accent];

  const statusQuery = useConnectorStatusQuery(config.id);
  const connectMutation = useConnectMutation(config.id);
  const disconnectMutation = useDisconnectMutation(config.id);
  const syncMutation = useSyncDocumentsMutation();

  const [departmentId, setDepartmentId] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const isConnected = statusQuery.data?.status === "connected";
  const items = statusQuery.data?.items ?? [];

  function handleConnect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const credentials = Object.fromEntries(
      config.fields.map((field) => [field.name, String(formData.get(field.name) ?? "")])
    );
    connectMutation.mutate(credentials);
  }

  function handleDisconnect() {
    setDepartmentId("");
    setSelectedPaths([]);
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

    syncMutation.mutate(
      { connectorId: config.id, departmentId, filePaths: selectedPaths },
      { onSuccess: () => setSelectedPaths([]) }
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

      {!isConnected && (
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

      {isConnected && (
        <form onSubmit={handleSyncSubmit} className="mt-5 space-y-4 border-t border-neutral-100 pt-5">
          {syncMutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 size={16} />
              {syncMutation.data.message}
            </div>
          )}

          {syncMutation.isError && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} />
              {(syncMutation.error as Error).message}
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
              {DEPARTMENTS.map((d) => (
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

        
          <a href="/dashboard/connectors"
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