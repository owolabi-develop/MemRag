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
} from "lucide-react";
import { uploadDocument } from "../../shared/api/document.api";
import { getDepartments } from "../../shared/api/department.api";
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
  success?: boolean;
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
    // formData already contains exactly "file" and "department_id",
    // matching the curl example, so it can be sent as-is.
    await uploadDocument(formData);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.message };
    }
    return { error: "Failed to upload document. Please try again." };
  }
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

  // Reset the form after a successful upload — the action doesn't redirect,
  // so nothing clears the inputs automatically.
  useEffect(() => {
    if (actionData?.success) {
      setFile(null);
      setDepartmentId("");
      setFileError(null);
      setDepartmentError(null);
      if (inputRef.current) inputRef.current.value = "";
      formRef.current?.reset();
    }
  }, [actionData]);

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

      {actionData?.success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={16} />
          Document uploaded successfully.
        </div>
      )}

      {actionData?.error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {actionData.error}
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
                  <p className="text-xs text-neutral-500">
                    {formatBytes(file.size)}
                  </p>
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