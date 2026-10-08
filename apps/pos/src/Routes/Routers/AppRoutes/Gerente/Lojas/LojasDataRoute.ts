import { LoaderFunctionArgs, RouteObject } from "react-router";
import { getUsuarios } from "../../../../../api/apiUsuario";
import { getMercadorias } from "../../../../../api/apiMercadoria";

// /gerente/lojas/
const LojasDataRoute: RouteObject[] = [
  {
    path: "get-data",
    loader: getDataLoader
  }
]
export async function getDataLoader({request}: LoaderFunctionArgs){
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const lojaIdString = searchParams.get("lojaId");

  if (!lojaIdString) {
    throw new Error("Loja id nao disponivel.")
  }

  const lojaId = parseInt(lojaIdString, 10);

  if (isNaN(lojaId)) {
    throw new Error("Id da loja inválido.")
  }

  const funcionariosAtivos = await getUsuarios(false, {localId: lojaId,ativo: true});
  const funcionariosInativos = await getUsuarios(false, { localId: lojaId, ativo: false });

  return {funcionariosAtivos,funcionariosInativos}
}

export default LojasDataRoute;
