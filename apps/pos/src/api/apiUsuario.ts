import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, CriarUsuarioPayload, UsuarioListing, UsuarioLogado } from "@tauri-inventory/types";

export async function getUserData() {
  return await invoke<UsuarioLogado | null>("get_user_data");
}

/**
 * Espelha `UsuarioListFilter` em `apps/pos/src-tauri/src/database/usuarios.rs`.
 * `localId` substitui o antigo `local` ("02"/"03"/"04") e `ativo` substitui
 * `active`, que nunca existiu como coluna.
 */
export interface UsuarioListFilter {
  localId?: number;
  ativo?: boolean;
}

export async function getUsuarios(getDeleted?: boolean, filter?: UsuarioListFilter) {
  return await invoke<UsuarioListing[]>("get_usuarios", { getDeleted, filter });
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

export async function deactivateUsuario(id: number) {
  return await invoke<ApiResponse>("desativar_usuario", { usuarioId: id });
}
