import { invoke } from "@tauri-apps/api/core";
import { check } from "@tauri-apps/plugin-updater";
import { ApiResponse } from "@tauri-inventory/types";

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

export async function setLocalDbPath(newPath: string) {
  return await invoke<ApiResponse>("set_db_path", { newPath: newPath });
}

export async function setApiUrl(newUrl: string) {
  return await invoke<ApiResponse>("change_api_url", {
    newUrl: newUrl,
  });
}

export async function checkUpdate() {
  const update = await check();

  if(update){
    console.log(`Update ${update.version} encontrado, data ${update.date} com notas: ${update.body}`);
    
  }
}