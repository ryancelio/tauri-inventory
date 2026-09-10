import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, IFabricante } from "@tauri-inventory/types";


export async function getFabricantes(getDeleted?: boolean) {
  return await invoke<IFabricante[]>("get_fabricantes", { getDeleted });
}

export async function criarFabricante(fabricante: { nome: string }) {
  return await invoke<ApiResponse>("criar_fabricante", { fabricante });
}

export async function editarFabricante(fabricante: {
  id: number;
  nome: string;
}) {
  return await invoke<ApiResponse>("editar_fabricante", {
    id: fabricante.id,
    fabricante,
  });
}

export async function deletarFabricante(id: number) {
  return await invoke<ApiResponse>("deletar_fabricante", { id });
}


export async function getFabricanteMercCount(id: number) {
  return await invoke<number>("get_fabricante_mercadoria_count", { id });
}

export async function reassignFabricante(oldFabId: number, newFabId: number) {
  return await invoke<ApiResponse>("reassign_fabricante", {
    oldFabId,
    newFabId,
  });
}

export async function fabricanteCascadeDelete(fabId: number) {
  return await invoke<ApiResponse>("cascade_delete_fab", { fabId });
}


