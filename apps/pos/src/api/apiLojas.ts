import { invoke } from "@tauri-apps/api/core"
import { ILoja } from "@tauri-inventory/types"

export async function getLojas() {
  return await invoke<ILoja[]>("get_lojas");
}
