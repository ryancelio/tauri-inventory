import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, CriarUsuarioPayload, UsuarioLogado } from "@tauri-inventory/types";

export async function getUserData() {
  return await invoke<UsuarioLogado | null>("get_user_data");
}

export async function getUsuarios(getDeleted?: boolean) {
  return await invoke<UsuarioLogado[]>("get_usuarios", { getDeleted });
}

export async function criarUsuario(usuario: CriarUsuarioPayload) {
  return await invoke<ApiResponse>("criar_usuario", { payload: usuario });
}

export async function editarUsuario(
  usuario: Partial<CriarUsuarioPayload>,
  id: number,
) {
  return await invoke<ApiResponse>("update_usuario", { usuario, id });
}

export async function deletarUsuario(id: number) {
  return await invoke<ApiResponse>("deletar_usuario", { usuarioId: id });
}