export type UpdateStatus = "idle" | "downloading" | "finished" | "error";

export type ProgressState = {
  status: UpdateStatus;
  downloaded: number;
  total: number | null;
  message?: string;
};

export interface UpdateMetadata {
  version: string;
  current_version: string;
  date: string | null;
  body: string | null;
}
