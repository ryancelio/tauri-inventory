import { invoke } from "@tauri-apps/api/core";
import {
  criarFabricante,
  deletarFabricante,
  editarFabricante,
  fabricanteCascadeDelete,
} from "../../../api/apiHelper";
import { ApiResponse } from "../../../../../../packages/types/database/ApiResponses";

export async function createFabricanteAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  return await criarFabricante({ nome: nome });
}
export async function alterarFabricanteAction(formData: FormData) {
  const id = Number(formData.get("id") as string);
  const nome = formData.get("nome") as string;

  return await editarFabricante({ id, nome });
}
export async function deletarFabricanteAction(formData: FormData) {
  const id = Number(formData.get("id") as string);
  const cascade = formData.get("cascade") === "true";

  if (cascade) {
    return await fabricanteCascadeDelete(id);
  } else {
    return await deletarFabricante(id);
  }
}

export async function deleteReasignFabricante(formData: FormData) {
  const oldFabId = Number(formData.get("oldFabId"));
  const newFabId = Number(formData.get("newFabId"));
  if (!oldFabId || isNaN(oldFabId) || !newFabId || isNaN(newFabId)) {
    throw { code: 400, message: { response: "Dados incompletos" } };
  }

  return await invoke<ApiResponse>("reassign_fabricante", {
    oldFabId,
    newFabId,
  });
}
