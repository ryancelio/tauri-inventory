import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, atributoCreate, atributoUpdate, IAtributo } from "@tauri-inventory/types";

export async function getAtributos() {
  return await invoke<IAtributo[]>("get_atributos");
}

export async function createAtributo(atributo: atributoCreate) {
  return await invoke<ApiResponse>("create_atributo", { atributo });
}
export async function deleteAtributo(id: number) {
  return await invoke<ApiResponse>("delete_atributo", { id });
}
export async function alterarAtributo(atributo: atributoUpdate) {
  return await invoke<ApiResponse>("update_atributo", {
    id: atributo.id,
    atributo: atributo,
  });
}
