import { AtributoTypesType } from "@tauri-inventory/types";
import {
  alterarAtributo,
  createAtributo,
  deleteAtributo,
} from "../../../api/apiHelper";

export async function createAtributoAction(formData: FormData) {
  const nome = formData.get("nome") as string;
  const tipo = formData.get("tipo") as AtributoTypesType;

  return await createAtributo({ nome, tipo });
}

export async function deleteAtributoAction(formData: FormData) {
  const id = formData.get("id") as string;
  return await deleteAtributo(Number(id));
}

export async function alterarAtributoAction(formData: FormData) {
  const id = Number(formData.get("id") as string);
  const nome = formData.get("nome") as string;
  const tipo = formData.get("tipo") as string as AtributoTypesType;

  return await alterarAtributo({ id, nome, tipo });
}
