
const STORAGE_KEY = "groundly:activeIngestJobs";

export interface TrackedJob {
  jobId: string;
  fileName: string;
  departmentId: string;
  startedAt: string; 
}

function readAll(): TrackedJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedJob[]) : [];
  } catch {
    return [];
  }
}

function writeAll(jobs: TrackedJob[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
  }
}

export function addTrackedJob(job: TrackedJob): void {
  const jobs = readAll();
  writeAll([...jobs, job]);
}

export function removeTrackedJob(jobId: string): void {
  writeAll(readAll().filter((j) => j.jobId !== jobId));
}

export function getTrackedJobs(): TrackedJob[] {
  return readAll();
}