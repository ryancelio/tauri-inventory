import { CriarUsuarioPayload, Funcao, Local } from "@tauri-inventory/types";
import {
  criarUsuario,
  deletarUsuario,
  editarUsuario,
} from "../../../api/apiHelper";
import { ActionErrorData } from "../routes";
import { UsuarioModalErrors } from "../../App/Gerente/UsuariosModal";

export async function createUsuarioAction(formData: FormData) {
  const nome = (formData.get("nome") as string) || undefined;
  const usuario = (formData.get("usuario") as string) || undefined;
  const senha = (formData.get("senha") as string) || undefined;
  const funcao = (formData.get("funcao") as Funcao) || undefined;
  const local = (formData.get("local") as Local) || undefined;

  if (!nome || !usuario || !senha) {
    throw { message: { response: "Dados incompletos!" } };
  }

  const usuarioPayload: CriarUsuarioPayload = {
    nome,
    usuario,
    senha,
    funcao,
    local,
  };
  console.log(usuarioPayload);

  if (!nome || !usuario || !senha || !funcao || !local) {
    throw { message: { response: "Dados incompletos" } };
  }
  return await criarUsuario(usuarioPayload);
}

export async function updateUsuarioAction(formData: FormData) {
  const id = (formData.get("id") as string) || undefined;
  const nome = (formData.get("nome") as string) || undefined;
  const local = (formData.get("local") as Local) || undefined;
  const funcao = (formData.get("funcao") as Funcao) || undefined;
  const senha = (formData.get("senha") as string) || undefined;
  const confirmarSenha =
    (formData.get("confirmarSenha") as string) || undefined;
  const usuario = (formData.get("usuario") as string) || undefined;

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
    local,
    funcao,
    usuario,
    senha,
  };

  return await editarUsuario(payload, Number(id));
}

export async function deleteUsuarioAction(formData: FormData) {
  const userId = Number(formData.get("id"));

  if (isNaN(userId)) {
    throw { message: { response: "Id invlaido" } };
  }

  return await deletarUsuario(userId);
}
