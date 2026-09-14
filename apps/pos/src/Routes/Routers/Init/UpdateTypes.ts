export type UpdateStatus = "idle" | "downloading" | "finished" | "error";

export type ProgressState = {
  status: UpdateStatus;
  downloaded: number;
  total: number | null;
  message?: string;
};