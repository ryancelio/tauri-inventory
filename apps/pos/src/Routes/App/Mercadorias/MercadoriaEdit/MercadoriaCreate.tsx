import { ActionFunction, LoaderFunction, redirect } from "react-router";
import { MercadoriaEditPage } from "./MercadoriaEditPage";
import {
  getCategorias,
  getFabricantes,
  getGrupos,
  getSimilarMerc,
  getAtributos,
  createMercadoria,
} from "../../../../api/apiHelper";
import { userContext } from "../../../../context/contexts";
import {
  IMercadoria,
  MercadoriaDB,
  MercadoriaPhotosListing,
} from "@tauri-inventory/types";
import { formDataToMercadoria } from "../../../../Helpers/formDataHelper";
import { getIsOfflineModeActive } from "../../../../backend/backendHelper";

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const mercadoriaParams: Partial<MercadoriaDB> =
    Object.fromEntries(searchParams);

  const usuario = context.get(userContext);
  const isOfflineMode = getIsOfflineModeActive();

  if (!usuario) {
    throw new Error("Usuario nao autenticado");
  }


  const pageData = Promise.all([
    getFabricantes(),
    getGrupos(),
    getCategorias(),
    mercadoriaParams.key
      ? getSimilarMerc(Number(mercadoriaParams.key))
      : Promise.resolve([]),
    getAtributos(),
  ]).then(
    ([fabricantes, grupos, categorias, similarMercadoriasList, atributos]) => {
      // const mercGrupo = grupos.filter((g) => g.id == mercadoriaParams.grupoId);
      const mercCat = categorias.filter(
        (c) => c.id == mercadoriaParams.categoriaId,
      );
      const mercFab = fabricantes.filter(
        (f) => f.id == mercadoriaParams.fabricanteId,
      );

      // delete mercadoriaParams.grupoId;
      delete mercadoriaParams.categoriaId;
      delete mercadoriaParams.fabricanteId;

      const mercadoria: Partial<IMercadoria> = {
        ...mercadoriaParams,
        // grupo: mercGrupo[0],
        categoria: mercCat[0],
        fabricante: mercFab[0],
      };
      return {
        mercadoria,
        fabricantes,
        grupos,
        // categorias,
        similarMercadoriasList,
        atributos,
        mercPhotos: [] as MercadoriaPhotosListing[],
        keyPhotos: [] as MercadoriaPhotosListing[],
      };
    },
  );

  return {
    pageData,
    usuario,
    isOfflineMode,
  };
};

export const action: ActionFunction = async ({ request, context }) => {
  try {
    const user = context.get(userContext);
    if (user?.funcao === "vendedor") {
      return { ok: false, response: "Permissao insuficiente." };
    }

    const formData = await request.formData();
    const mercadoria = formDataToMercadoria(formData);

    console.log(mercadoria);

    // const response = await invoke<IMercadoria>("create_mercadoria", {
    //   mercadoria,
    // });

    const response = await createMercadoria(mercadoria);
    // return { ok: true, response: response.response };
    const msg = encodeURIComponent("Mercadoria criada com sucesso!");
    return redirect(
      `/mercadorias/${response.id}?success=true&action=created&msg=${msg}`,
    );
  } catch (e: any) {
    console.error(e);
    return { ok: false, response: e };
  }
};

export const Component = MercadoriaEditPage;
