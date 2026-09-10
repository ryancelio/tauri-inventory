import { CategoriaUpdate } from "@tauri-inventory/types";
import {
  alterarCategoria,
  criarCategoria,
  deletarCategoria,
} from "../../../api/apiHelper";

export async function alterarCategoriaAction(formData: FormData) {
  let nome = (formData.get("nome") as string) || undefined;
  if (nome) {
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  const id = Number(formData.get("id") as string) || undefined;
  const grupoId = Number(formData.get("grupoId") as string) || undefined;

  const catPayload: CategoriaUpdate = { nome, id, grupoId: grupoId };

  return await alterarCategoria(catPayload);
}

export async function criarCategoriaAction(formData: FormData) {
  let nome = (formData.get("nome") as string) || undefined;
  if (nome) {
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
  }
  const grupoId = Number(formData.get("grupoId") as string) || undefined;

  return await criarCategoria({ nome, grupoId });
}

export async function deleteCategoriaAction(formData: FormData) {
  const id = formData.get("id") as string;

  return await deletarCategoria(id);
}
