import { LoaderFunctionArgs, RouteObject } from "react-router";
import { getUsuarios } from "../../../../../api/apiUsuario";
import { getMercadorias } from "../../../../../api/apiMercadoria";
import { getLojaEstoqueTotal } from "../../../../../api/apiLojas";
import { timeout } from "../../../../../Helpers/delay";

// /gerente/lojas/
const LojasDataRoute: RouteObject[] = [
  {
    path: "get-data",
    loader: getDataLoader,
  },
];
export async function getDataLoader({ request }: LoaderFunctionArgs) {
  // await timeout(2000);
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const lojaIdString = searchParams.get("lojaId");

  if (!lojaIdString) {
    throw new Error("Loja id nao disponivel.");
  }

  const lojaId = parseInt(lojaIdString, 10);

  if (isNaN(lojaId)) {
    throw new Error("Id da loja inválido.");
  }

  const funcionariosAtivos = await getUsuarios(false, {
    localId: lojaId,
    ativo: true,
  });
  const funcionariosInativos = await getUsuarios(false, {
    localId: lojaId,
    ativo: false,
  });
  const mercadoriasPrincipais = await getMercadorias({
    filter: {
      estoque: {
        [lojaId]: { gte: 1 },
      },
    },
    limit: 5,
    sortBy: `estoque.${lojaId}`,
    sortOrder: "DESC",
  });

  const lojaEstoqueTotal = await getLojaEstoqueTotal(lojaId);

  return {
    funcionariosAtivos,
    funcionariosInativos,
    mercadoriasPrincipais,
    lojaEstoqueTotal: lojaEstoqueTotal.count,
  };
}

export default LojasDataRoute;
