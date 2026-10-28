import { invoke } from "@tauri-apps/api/core"
import { ILoja } from "@tauri-inventory/types"
import { CreateLojaPayload } from "../../../../packages/types/database/Loja";

export async function getLojas() {
  return await invoke<ILoja[]>("get_lojas");
}

export async function getLojaEstoqueTotal(lojaId: number) {
  return await invoke<{count: number}>("get_loja_estoque_total", { lojaId });
}

export async function createLoja(createLojaPayload: CreateLojaPayload) {
  return await invoke<ILoja>("create_loja",{createLojaPayload});
}

export async function editLoja(editLojaPayload: CreateLojaPayload, lojaId: number) {
  return await invoke<ILoja>("edit_loja", { editLojaPayload, lojaId });
}

export async function deleteLoja(lojaId: number) {
  return await invoke<ILoja>("delete_loja", { lojaId });
}
