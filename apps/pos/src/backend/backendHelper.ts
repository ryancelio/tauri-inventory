import { invoke } from "@tauri-apps/api/core";
import { ApiResponse } from "@tauri-inventory/types";
import { UpdateMetadata } from "../Routes/Routers/Init/UpdateTypes";

export type { UpdateMetadata };

export async function getLastBackupDate(raw?: boolean) {
  const date = (await invoke<string>("get_backup_date")).replace(/\"/g, "");
  if (raw) {
    return date;
  }
  return new Date(date).toLocaleDateString("pt-BR");
}

export async function checkApiStatus() {
  return await invoke<ApiResponse>("recheck_api_status");
}

export async function setOfflineMode(val: boolean) {
  await invoke("set_offline_mode", { val });
}

export async function getIsOfflineModeActive() {
  return await invoke<boolean>("get_offline_mode");
}

export async function getIsApiOnline() {
  return await invoke<boolean>("get_api_status");
}

export async function getApiStatusCheck() {
  return await invoke<{ isOnline: boolean; isChecking: boolean }>(
    "get_api_status_check",
  );
}

export async function getPrinters() {
  return await invoke<string[]>("get_printers");
}

export async function printPdf(printerName: string, pdfBytes: number[]) {
  return await invoke<ApiResponse>("print_pdf", { printerName, pdfBytes });
}
export async function getLastestBackup() {
  console.log("Baixando novo backup");

  return await invoke<ApiResponse>("get_latest_backup");
}

export async function checkLocalDbExists() {
  return await invoke<boolean>("check_db_exists");
}

export async function setLocalDbPassword(novaSenha: string) {
  return await invoke<ApiResponse>("set_db_pass", { pass: novaSenha });
}

// export async function setLocalDbPath(newPath: string) {
//   return await invoke<ApiResponse>("set_db_path", { newPath: newPath });
// }

export async function setApiUrl(newUrl: string) {
  return await invoke<ApiResponse>("change_api_url", {
    newUrl: newUrl,
  });
}

export async function automaticCheckUpdate(): Promise<UpdateMetadata | null> {
  return await invoke("automatic_update_check");
}

export async function forceUpdateCheck(): Promise<UpdateMetadata | null> {
  return await invoke("force_check_update");
}

export async function getPendingUpdate(): Promise<UpdateMetadata | null> {
  return await invoke("command_get_pending_update");
}

export async function startUpdate() {
  await invoke("start_update");
}
export async function getApiUrl() {
  return await invoke<string>("command_get_api_url");
}
