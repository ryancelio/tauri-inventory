import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, CategoriaUpdate, ICategoria } from "@tauri-inventory/types";

export async function getCategorias() {
  return await invoke<ICategoria[]>("get_categorias");
}
export async function alterarCategoria(categoria: CategoriaUpdate) {
  return await invoke<ApiResponse>("update_categoria", {
    id: categoria.id,
    categoria: categoria,
  });
}

export async function criarCategoria(categoria: CategoriaUpdate) {
  return await invoke<ApiResponse>("create_categoria", { categoria });
}

export async function deletarCategoria(id: string) {
  return await invoke<ApiResponse>("delete_categoria", { id: Number(id) });
}

export async function getCategoriaMercCount(catId: number) {
  return await invoke<number>("get_categoria_merc_count", { catId });
}

export async function reassignCategoria(oldCatId: number, newCatId: number) {
  return await invoke<ApiResponse>("reassign_categoria", {
    oldCatId,
    newCatId,
  });
}
