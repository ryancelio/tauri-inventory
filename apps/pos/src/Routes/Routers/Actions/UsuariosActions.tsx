import { CriarUsuarioPayload, Funcao } from "@tauri-inventory/types";
import {
  criarUsuario,
  deactivateUsuario,
  editarUsuario,
} from "../../../api/apiHelper";
import { ActionErrorData } from "../routes";
import { UsuarioModalErrors } from "../../App/Gerente/UsuariosModal";

export async function createUsuarioAction(formData: FormData) {
  const nome = (formData.get("nome") as string) || undefined;
  const usuario = (formData.get("usuario") as string) || undefined;
  const senha = (formData.get("senha") as string) || undefined;
  const funcao = (formData.get("funcao") as Funcao) || undefined;
  // O `UsuariosModal` manda `<input type="hidden" name="lojaId">`, não `local`:
  // a loja é uma entidade e o payload espera o id (mesmo campo do
  // `createUsuarioSchema` que valida no servidor).
  const lojaId = Number(formData.get("lojaId")) || undefined;

  if (!nome || !usuario || !senha) {
    throw { message: { response: "Dados incompletos!" } };
  }

  if (!funcao || !lojaId) {
    throw { message: { response: "Dados incompletos" } };
  }

  const usuarioPayload: CriarUsuarioPayload = {
    nome,
    usuario,
    senha,
    funcao,
    lojaId,
  };

  return await criarUsuario(usuarioPayload);
}

export async function updateUsuarioAction(formData: FormData) {
  const id = (formData.get("id") as string) || undefined;
  const nome = (formData.get("nome") as string) || undefined;
  // Mesmo campo do create: `lojaId`, conforme o input hidden do `UsuariosModal`.
  const lojaId = Number(formData.get("lojaId")) || undefined;
  const funcao = (formData.get("funcao") as Funcao) || undefined;
  const senha = (formData.get("senha") as string) || undefined;
  const confirmarSenha =
    (formData.get("confirmarSenha") as string) || undefined;
  const usuario = (formData.get("usuario") as string) || undefined;
  const ativoString = (formData.get("ativo") as string) || undefined;
  let ativo;
  switch (ativoString) {
    case "true":
      ativo = true;
      break;
    case "false":
      ativo = false;
      break;
    default:
      ativo = undefined;
      break;
  }

console.log(ativoString)

  //   console.log(Object.fromEntries(formData.entries()));
  if (senha && confirmarSenha) {
    if (senha !== confirmarSenha) {
      const response: ActionErrorData<UsuarioModalErrors> = {
        message: { response: "Senhas não coincidem." },
        errors: { novaSenha: "Senhas nao coincidem" },
      };
      throw response;
    }
  }
  const payload: Partial<CriarUsuarioPayload> = {
    // id: Number(id),
    nome,
    lojaId,
    funcao,
    usuario,
    senha,
    ativo,
  };

  return await editarUsuario(payload, Number(id));
}

export async function deactivateUsuarioAction(formData: FormData) {
  const userId = Number(formData.get("id"));

  if (isNaN(userId)) {
    throw { message: { response: "Id invlaido" } };
  }

  return await deactivateUsuario(userId);
}
