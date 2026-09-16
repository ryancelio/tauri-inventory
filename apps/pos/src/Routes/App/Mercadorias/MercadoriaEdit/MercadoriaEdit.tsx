import { LoaderFunction, ActionFunction } from "react-router";
import {
  getAtributos,
  getCategorias,
  getFabricantes,
  getGrupos,
  getKeyPhotos,
  getMercPhotos,
  getSimilarMerc,
  getSingleMercadoria,
  updateMercadoria,
} from "../../../../api/apiHelper";
import { MercadoriaEditPage, MercEditLoader } from "./MercadoriaEditPage";
import { userContext } from "../../../../context/contexts";
import { formDataToMercadoria } from "../../../../Helpers/formDataHelper";
import { AppError } from "../../Errors/AppError";
import { getIsOfflineModeActive } from "../../../../backend/backendHelper";

export const loader: LoaderFunction = async ({
  params,
  context,
}): Promise<MercEditLoader> => {
  const id = Number(params.id);

  if (!id || Number.isNaN(id)) {
    throw new Error("Sem id");
  }

  const usuario = context.get(userContext);

  if (!usuario) {
    throw new Error("Usuario nao autenticado");
  }

  const isOfflineMode = await getIsOfflineModeActive();

  const pageData = Promise.all([
    getSingleMercadoria({ id: Number(id) }),
    getFabricantes(),
    getGrupos(),
    getCategorias(),
    getAtributos(),
    getMercPhotos(Number(id)),
  ]).then(
    async ([
      mercadoria,
      fabricantes,
      grupos,
      categorias,
      atributos,
      mercPhotos,
    ]) => {
      const similarMercadoriasList = await getSimilarMerc(mercadoria.key);
      const keyPhotos = await getKeyPhotos(mercadoria.key);
      // await timeout(10000);
      return {
        mercadoria,
        fabricantes,
        grupos,
        categorias,
        atributos,
        similarMercadoriasList,
        mercPhotos,
        keyPhotos,
      };
    },
  );

  return {
    pageData,
    usuario,
    isOfflineMode,
  };
};

export const ErrorBoundary = AppError;

export const action: ActionFunction = async ({ request, params }) => {
  try {
    let formData = await request.formData();
    let mercadoria = formDataToMercadoria(formData);

    console.log(mercadoria);

    let id = Number(params.id);
    let response = await updateMercadoria(mercadoria, id);

    return { ok: true, response: response.response };
  } catch (e: any) {
    console.error(e);
    if (e?.code && e?.message?.response) {
      if (e.code > 500) {
        throw new Response(e.message.response, { status: e.code });
      } else {
        return { ok: false, response: e.message.response };
      }
    }
  }
};

export const Component = MercadoriaEditPage;
