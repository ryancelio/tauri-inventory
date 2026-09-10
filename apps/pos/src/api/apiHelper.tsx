import { invoke } from "@tauri-apps/api/core";
import type {
 IUsuario,
 UsuarioLogado,
} from "@tauri-inventory/types";

export interface RustApiError {
  message: {
    response: string;
  };
}

export async function apiLogin(usuario: string, senha: string) {
  return await invoke<UsuarioLogado>("login", { usuario, senha });
}

export async function apiLogOut() {
  await invoke("logout");
}

export * from "./apiAtributos"
export * from "./apiCategorias"
export * from "./apiFabricante"
export * from "./apiGrupos"
export * from "./apiLogs"
export * from "./apiMercadoria"
export * from "./apiPhotos"
export * from "./apiUsuario"