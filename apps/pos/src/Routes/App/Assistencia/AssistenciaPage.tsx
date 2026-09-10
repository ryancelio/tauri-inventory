import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { userContext } from "../../../context/contexts";
import { UsuarioLogado } from "../../../../../../packages/types/database/Usuario";
import { GerenteAssitencia } from "./GerenteAssistência";
import { AdminAssistencia } from "./AdminAssistencia";

export interface AssistenciaPageLoaderData {
  usuarioLogado: UsuarioLogado | null;
}

export function loader({
  context,
}: LoaderFunctionArgs): AssistenciaPageLoaderData {
  const usuarioLogado = context.get(userContext);

  return { usuarioLogado };
}

export function Component() {
  const { usuarioLogado } = useLoaderData<AssistenciaPageLoaderData>();
  if (usuarioLogado?.funcao === "admin") {
    return <AdminAssistencia />;
  } else {
    return <GerenteAssitencia />;
  }
}
