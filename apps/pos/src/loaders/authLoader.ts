import { redirect } from "react-router";
import { getUserData } from "../api/apiHelper";
import { Funcao, UsuarioLogado } from "@tauri-inventory/types";

export async function requireAuthLoader(requiredRole: Funcao) {
  const usuario: UsuarioLogado | null = await getUserData();

  if (!usuario) return redirect("/");

  if (requiredRole && usuario.funcao !== requiredRole) {
    return redirect("/unauthorized");
  }

  return usuario;
}
