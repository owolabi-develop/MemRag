// pages/DocumentUpload.tsx

import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  Loader2,
  Clock,
} from "lucide-react";
import { uploadDocument } from "../../shared/api/document.api";
import { getDepartments } from "../../shared/api/department.api";
import { useIngestStatusQuery } from "../../shared/hooks/useDocumentIngest";
import {
  addTrackedJob,
  getTrackedJobs,
  removeTrackedJob,
  type TrackedJob,
} from "../../shared/utils/ingestJobsStorage";
import type { DepartmentOption } from "../../shared/types/department";
import { ApiError } from "../../shared/api/httpClient"; // adjust to match your actual path
import { useAuthStore } from "../../shared/store/authStore";

const ACCEPTED_EXTENSIONS = ["pdf"];
const MAX_FILE_SIZE_MB = 10;

function getFileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ extension }: { extension: string }) {
  if (extension === "csv") {
    return <FileSpreadsheet size={20} className="text-neutral-500" />;
  }
  return <FileText size={20} className="text-neutral-500" />;
}

// ---- Loader ----

export async function documentUploadLoader({}: LoaderFunctionArgs) {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    return redirect("/login");
  }

  const departments = await getDepartments();
  return { departments };
}

// ---- Action ----

interface ActionData {
  error?: string;
  jobId?: string;
}

export async function documentUploadAction({
  request,
}: ActionFunctionArgs): Promise<ActionData> {
  const formData = await request.formData();

  const file = formData.get("file");
  const departmentId = formData.get("department_id");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a file to upload." };
  }

  if (!departmentId) {
    return { error: "Please select a department." };
  }

  try {
    const response = await uploadDocument(formData);
    return { jobId: response.job_id };
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Failed to upload document. Please try again." };
  }
}

// ---- Progress UI ----

const STATUS_CONFIG = {
  queued: {
    label: "Queued",
    description: "Waiting for a worker to pick this up…",
    icon: Clock,
    tone: "text-neutral-500",
    bg: "bg-neutral-50",
    border: "border-neutral-200",
  },
  in_progress: {
    label: "Processing",
    description: "Extracting, chunking, and embedding your document…",
    icon: Loader2,
    tone: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  complete: {
    label: "Complete",
    description: "Document ingested and ready to search.",
    icon: CheckCircle2,
    tone: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  error: {
    label: "Failed",
    description: "Something went wrong while processing this document.",
    icon: AlertCircle,
    tone: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
} as const;

function IngestProgressCard({
  job,
  onDismiss,
}: {
  job: TrackedJob;
  onDismiss: () => void;
}) {
  const { data, isLoading } = useIngestStatusQuery(job.jobId);
  const status = data?.status ?? "queued";
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isTerminal = status === "complete" || status === "error";

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white ${config.tone}`}
        >
          <Icon
            size={16}
            className={status === "in_progress" || (isLoading && !data) ? "animate-spin" : ""}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm font-semibold ${config.tone}`}>{config.label}</p>
            {isTerminal && (
              <button
                type="button"
                onClick={onDismiss}
                className="flex-shrink-0 text-xs font-medium text-neutral-400 hover:text-neutral-700"
              >
                Dismiss
              </button>
            )}
          </div>

          <p className="mt-0.5 truncate text-xs text-neutral-500">{job.fileName}</p>

          <p
            className={`mt-2 text-xs leading-5 ${
              status === "error" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            {status === "error" && data?.error ? data.error : config.description}
          </p>

          {status !== "error" && (
            <div className="mt-3 flex items-center gap-1.5">
              {(["queued", "in_progress", "complete"] as const).map((step) => {
                const stepIndex = ["queued", "in_progress", "complete"].indexOf(status);
                const thisIndex = ["queued", "in_progress", "complete"].indexOf(step);
                const isActive = thisIndex <= stepIndex;
                return (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      isActive ? "bg-neutral-900" : "bg-neutral-200"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Component ----

export default function DocumentUpload() {
  const { departments } = useLoaderData() as { departments: DepartmentOption[] };
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);

  // Restored from localStorage on mount — this is what makes progress
  // survive navigation away and back, or a full page refresh.
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);

  useEffect(() => {
    setTrackedJobs(getTrackedJobs());
  }, []);

  // New job from a fresh upload → persist it and add it to the visible list.
  useEffect(() => {
    if (actionData?.jobId && file && departmentId) {
      const job: TrackedJob = {
        jobId: actionData.jobId,
        fileName: file.name,
        departmentId,
        startedAt: new Date().toISOString(),
      };
      addTrackedJob(job);
      setTrackedJobs((prev) => [...prev, job]);

      setFile(null);
      setDepartmentId("");
      setFileError(null);
      setDepartmentError(null);
      if (inputRef.current) inputRef.current.value = "";
      formRef.current?.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData]);

  function handleDismiss(jobId: string) {
    removeTrackedJob(jobId);
    setTrackedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  }

  function validateAndSetFile(candidate: File | undefined) {
    if (!candidate) return;

    const extension = getFileExtension(candidate.name);

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileError("Only PDF files are supported.");
      setFile(null);
      return;
    }

    if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError(`File must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      setFile(null);
      return;
    }

    setFileError(null);
    setFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0]);
  }

  function handleRemoveFile() {
    setFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    let hasError = false;

    if (!file) {
      setFileError("Please select a file to upload.");
      hasError = true;
    }

    if (!departmentId) {
      setDepartmentError("Please select a department.");
      hasError = true;
    }

    if (hasError) {
      event.preventDefault();
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <UploadCloud size={18} />
        <h2 className="font-semibold">Upload Document</h2>
      </div>

      {actionData?.error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {actionData.error}
        </div>
      )}

      {trackedJobs.length > 0 && (
        <div className="mt-4 space-y-3">
          {trackedJobs.map((job) => (
            <IngestProgressCard
              key={job.jobId}
              job={job}
              onDismiss={() => handleDismiss(job.jobId)}
            />
          ))}
        </div>
      )}

      <Form
        ref={formRef}
        method="post"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >
        {/* Dropzone */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            File <span className="text-red-500">*</span>
          </label>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? "border-neutral-900 bg-neutral-50"
                : fileError
                  ? "border-red-300 bg-red-50/40"
                  : "border-neutral-300 bg-neutral-50/50 hover:border-neutral-400 hover:bg-neutral-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              name="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => validateAndSetFile(e.target.files?.[0])}
            />

            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                isDragging
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-500 group-hover:border-neutral-400"
              }`}
            >
              <UploadCloud size={20} />
            </div>

            <p className="mt-4 text-sm font-medium">
              {isDragging ? "Drop your file here" : "Drag & drop your file here"}
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              or <span className="font-medium underline">click to browse</span>
            </p>

            <p className="mt-3 text-xs text-neutral-400">
              PDF — up to {MAX_FILE_SIZE_MB}MB
            </p>
          </div>

          {/* Selected file preview */}
          {file && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileTypeIcon extension={getFileExtension(file.name)} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-neutral-500">{formatBytes(file.size)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                aria-label="Remove file"
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {fileError && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} />
              {fileError}
            </div>
          )}
        </div>

        {/* Department */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Department <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            <FolderKanban
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />

            <select
              name="department_id"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                if (e.target.value) setDepartmentError(null);
              }}
              className={`h-11 w-full rounded-xl border px-4 pl-10 outline-none focus:border-black ${
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
          </div>

          {departmentError && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} />
              {departmentError}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UploadCloud size={16} />
          {isSubmitting ? "Uploading…" : "Upload Document"}
        </button>
      </Form>
    </div>
  );
}