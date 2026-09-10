import { invoke } from "@tauri-apps/api/core";
import {
  ApiResponse,
  GrupoDB,
  GrupoDBSent,
  IGrupo,
} from "@tauri-inventory/types";
import {
  createGrupo,
  deleteGrupo,
  updateGrupo as apiUpdateGrupo,
} from "../../../api/apiHelper";

export async function createGrupoAction(formData: FormData) {
  //   console.log("called action");
  //   return { response: nome };
  let nome = formData.get("nome") as string;
  nome = nome.charAt(0).toUpperCase() + nome.slice(1);
  return await createGrupo(nome);
}

export async function deleteGrupoAction(formData: FormData) {
  const id = formData.get("id") as string;
  return await deleteGrupo(Number(id));
}

export async function updateGrupo(formData: FormData) {
  const id = Number(formData.get("id") as string);
  let nome = (formData.get("nome") as string) || undefined;
  if (nome) {
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  let grupo: GrupoDBSent = {
    nome,
  };
  console.log(grupo);
  return await apiUpdateGrupo(id, grupo);
}
