import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, GrupoDBSent, IGrupo } from "@tauri-inventory/types";

export async function getGrupos() {
  return await invoke<IGrupo[]>("get_grupos");
}

export async function createGrupo(nome: string) {
  const grupo = { id: null, nome: nome, updatedAt: null, createdAt: null };
  return await invoke<ApiResponse>("create_grupo", { grupo });
}

export async function deleteGrupo(id: number) {
  return await invoke<ApiResponse>("delete_grupo", { id });
}
export async function updateGrupo(id: number, grupo: GrupoDBSent) {
  return await invoke<ApiResponse>("update_grupo", { id, grupo });
}