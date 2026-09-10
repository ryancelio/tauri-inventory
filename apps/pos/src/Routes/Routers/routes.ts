import { ActionFunctionArgs, createHashRouter, redirect } from "react-router";
import {
  requireAuthMiddleware,
  requireGerenteMiddleware,
} from "../../middlewares/auth";
import {
  criarUsuario,
  deleteGrupo,
  deleteKeyPhoto,
  deleteMercadoria,
  updateSimilarMerc,
} from "../../api/apiHelper";
import { formDataToMercadoria } from "../../Helpers/formDataHelper";
import { apiStatusMiddleware } from "../../middlewares/apiStatus";
import {
  ApiResponse,
  Funcao,
  Local,
  SimilarMercUpdate,
} from "@tauri-inventory/types";
import {
  alterarAtributoAction,
  createAtributoAction,
  deleteAtributoAction,
} from "./Actions/AtributosActions";
import {
  alterarCategoriaAction,
  criarCategoriaAction,
  deleteCategoriaAction,
} from "./Actions/CategoriasActions";
import {
  alterarFabricanteAction,
  createFabricanteAction,
  deletarFabricanteAction,
  deleteReasignFabricante,
} from "./Actions/FabricantesActions";
import {
  AddMercadoriaPhotoAction,
  DeleteMercadoriaPhotoAction,
} from "./Actions/MercadoriasActions/MercPhotosActions";
import { checkApiStatus } from "../../backend/backendHelper";
import {
  createGrupoAction,
  deleteGrupoAction,
  updateGrupo,
} from "./Actions/GruposActions";
import { deleteMercadoriaAction } from "./Actions/MercadoriasActions/MercadoriasActions";
import {
  createUsuarioAction,
  updateUsuarioAction,
} from "./Actions/UsuariosActions";
import { userContext } from "../../context/contexts";
import { invoke } from "@tauri-apps/api/core";
import LogsPage from "../App/Gerente/LogsPage/LogsPage";

export type ActionResponse<T> = {
  ok: boolean;
  response: string;
  errors?: T;
};

export interface ActionErrorData<T> {
  message: { response: string };
  errors?: T;
}

const app = [];

export const router = createHashRouter([
  {
    middleware: [apiStatusMiddleware],
    lazy: () => import("../Routers/Init/MainLayout"),
    children: [
      {
        path: "/",
        middleware: [apiStatusMiddleware],
        lazy: () => import("../Welcome/LoginLayout"),
      },
      {
        path: "/logout",
        lazy: () => import("../../context/logoutAction"),
      },
      {
        path: "/health-check",
        action: async () => {
          try {
            const res = await checkApiStatus();
            return { error: false, message: res.response };
          } catch (e: any) {
            return { error: true, message: e.message.response };
          }
        },
      },
      {
        id: "app-root",
        middleware: [requireAuthMiddleware, apiStatusMiddleware],
        lazy: () => import("../App/AppLayout"),
        children: [
          // LISTAR MERC
          {
            path: "/mercadorias",
            lazy: () =>
              import("../App/Mercadorias/MercadoriasTable/MercadoriaPage"),
          },
          // EDITAR MERC
          {
            path: "/mercadorias/:id",
            middleware: [requireGerenteMiddleware],
            lazy: () =>
              import("../App/Mercadorias/MercadoriaEdit/MercadoriaEdit"),
          },
          // CRIAR MERC
          {
            path: "/mercadorias/new",
            middleware: [requireGerenteMiddleware],
            lazy: () =>
              import("../App/Mercadorias/MercadoriaEdit/MercadoriaCreate"),
          },
          {
            path: "/assistencias",
            lazy: () => import("../App/Assistencia/AssistenciaPage"),
          },
          {
            path: "/fabricantes",
            lazy: () => import("../App/Fabricantes/FabricantesPage"),
          },
          {
            path: "/categorias",
            lazy: () => import("../App/Categorias/CategoriasPage"),
          },
          {
            path: "/atributos",
            lazy: () => import("../App/Atributos/AtributosPage"),
          },
          // {
          //   path: "/photos",
          //   lazy: () => import("../App/Photos/PhotosPage"),
          // },
          {
            path: "/unauthorized",
            lazy: () => import("../HelperRoutes/NaoAutorizado"),
          },
          {
            path: "/gerente",
            middleware: [requireGerenteMiddleware],
            children: [
              {
                index: true,
                loader: () => redirect("usuarios"),
              },
              {
                path: "usuarios",
                lazy: () => import("../App/Gerente/UsuariosPage"),
              },
              {
                path: "logs",
                // lazy: () => import("../App/Gerente/LogsPage/LogsPage"),
                Component: LogsPage.Component,
                ErrorBoundary: LogsPage.ErrorBoundary,
                HydrateFallback: LogsPage.HydrateFallback,
                children: [
                  {
                    index: true,
                    loader: () => redirect("all"),
                  },
                  {
                    path: "all",
                    lazy: () => import("../App/Gerente/LogsPage/AllLogs"),
                  },
                  {
                    path: "mercadorias",
                    lazy: () =>
                      import("../App/Gerente/LogsPage/MercadoriasLog"),
                  },
                  {
                    path: "usuarios",
                    lazy: () => import("../App/Gerente/LogsPage/UsuarioLogs"),
                  },
                  {
                    path: "fabricantes",
                    lazy: () =>
                      import("../App/Gerente/LogsPage/FabricanteLogs"),
                  },
                ],
              },
              {
                path: "fabricantes",
                action: async ({ request }) => {
                  try {
                    console.log("action reached");
                    const method = request.method;
                    const formData = await request.formData();
                    let response = { response: "Resposta desconhecida" };
                    switch (method) {
                      case "POST":
                        response = await createFabricanteAction(formData);
                        break;
                      case "DELETE":
                        response = await deletarFabricanteAction(formData);
                        break;
                      case "PUT":
                        response = await alterarFabricanteAction(formData);
                        break;
                    }
                    return { ok: true, response: response?.response };
                  } catch (e: any) {
                    console.error(e);
                    return {
                      ok: false,
                      response: e.message.response,
                    };
                  }
                },
                children: [
                  {
                    path: "reassign",
                    action: async ({ request }) => {
                      try {
                        const res = await deleteReasignFabricante(
                          await request.formData(),
                        );
                        return { ok: true, response: res.response };
                      } catch (e: any) {
                        console.error(e);
                        return {
                          ok: false,
                          response: e.message.response,
                        };
                      }
                    },
                  },
                ],
              },
              {
                path: "atributos",
                action: async ({ request }) => {
                  try {
                    const method = request.method;
                    const formData = await request.formData();
                    let response = { response: "Resposta desconhecida" };
                    switch (method) {
                      case "POST":
                        response = await createAtributoAction(formData);
                        break;
                      case "DELETE":
                        response = await deleteAtributoAction(formData);
                        break;
                      case "PUT":
                        response = await alterarAtributoAction(formData);
                        break;
                    }
                    return { ok: true, response: response?.response };
                  } catch (e: any) {
                    console.error(e);
                    return {
                      ok: false,
                      response: e.message.response,
                    };
                  }
                },
              },
              {
                path: "categorias",
                action: async ({ request }) => {
                  // console.log(
                  //   Object.fromEntries((await request.formData()).entries()),
                  // );
                  try {
                    const method = request.method;
                    const formData = await request.formData();
                    let response = { response: "Resposta desconhecida" };
                    switch (method) {
                      case "POST":
                        response = await criarCategoriaAction(formData);
                        break;
                      case "DELETE":
                        response = await deleteCategoriaAction(formData);
                        break;
                      case "PUT":
                        response = await alterarCategoriaAction(formData);
                        break;
                    }
                    return { ok: true, response: response?.response };
                  } catch (e: any) {
                    console.error(e);
                    return {
                      ok: false,
                      response: e.message.response,
                    };
                  }
                },
              },
              {
                path: "mercadorias",
                action: async ({ request }) => {
                  try {
                    const formData = await request.formData();
                    const method = request.method;
                    let response = "Erro desconhecido";
                    switch (method) {
                      case "DELETE":
                        return deleteMercadoriaAction(formData);
                    }
                    return { ok: true, response };
                  } catch (e: any) {
                    console.error(e);
                    if (e?.code && e?.message?.response) {
                      if (e.code >= 500) {
                        throw new Response(e.message.response, {
                          status: e.code,
                        });
                      } else {
                        return { ok: false, response: e.message.response };
                      }
                    }
                  }
                },
                children: [
                  {
                    path: "update-precos",
                    middleware: [requireGerenteMiddleware],
                    action: async ({ request }: ActionFunctionArgs) => {
                      try {
                        const formData = await request.formData();
                        const key = formData.get("key")?.toString();

                        if (!key) {
                          return {
                            ok: false,
                            response:
                              "Key é necessária para atualizar as mercadorias.",
                          };
                        }
                        const selectedIds = formData.get(
                          "selectedIds",
                        ) as string;
                        formData.delete("selectedIds");

                        // const mercadoria = formDataToMercadoria(formData);
                        const mercadoria: SimilarMercUpdate = {
                          // caracteristicas: formData.get("caracteristicas")?.toString() || undefined,
                          precoCusto: Number(
                            formData.get("precoCusto")?.toString(),
                          ),
                          precoVenda: Number(
                            formData.get("precoVenda")?.toString(),
                          ),
                        };

                        const selectedIdsArray = selectedIds.split(",");

                        const res = await updateSimilarMerc({
                          key: Number(key),
                          mercadoria,
                          selectedIds:
                            selectedIdsArray && selectedIdsArray.length > 0
                              ? selectedIdsArray
                              : undefined,
                        });

                        return { ok: true, response: res?.response };
                      } catch (e: any) {
                        console.error(e);
                        if (e?.code && e?.message?.response) {
                          if (e.code >= 500) {
                            throw new Response(e.message.response, {
                              status: e.code,
                            });
                          } else {
                            return { ok: false, response: e.message.response };
                          }
                        }
                      }
                    },
                  },
                  {
                    path: "photos",
                    action: async ({ request }) => {
                      try {
                        // const formData = await request.formData();
                        const data = await request.json();
                        const method = request.method;
                        let response = { response: "Resposta desconhecida" };

                        switch (method) {
                          case "POST":
                            response = await AddMercadoriaPhotoAction(
                              data.images,
                              data.id,
                            );
                            break;
                          case "DELETE":
                            response = await DeleteMercadoriaPhotoAction(
                              data.id,
                            );
                            break;
                        }

                        return { ok: true, response: response.response };
                      } catch (e: any) {
                        console.error(e);
                        return { ok: false, response: e.message.response };
                      }
                    },
                    children: [
                      {
                        path: "key",
                        action: async ({ request }) => {
                          try {
                            const { id } = await request.json();
                            const response = await deleteKeyPhoto(id);
                            return { ok: true, response: response.response };
                          } catch (e: any) {
                            console.error(e);
                            return { ok: false, response: e.message.response };
                          }
                        },
                      },
                    ],
                  },
                ],
              },
              {
                path: "grupos",
                action: async ({ request }) => {
                  try {
                    const method = request.method;

                    let response = { response: "Resposta desconhecida" };

                    let formData = await request.formData();

                    switch (method) {
                      case "POST":
                        response = await createGrupoAction(formData);
                        break;
                      case "PUT":
                        response = await updateGrupo(formData);
                        break;
                      case "DELETE":
                        response = await deleteGrupoAction(formData);
                        break;
                    }

                    return { ok: true, response: response.response };
                  } catch (e: any) {
                    return {
                      ok: false,
                      response: e?.message?.response || "Erro desconhecido",
                    };
                  }
                },
              },
            ],
          },
        ],
      },
    ],
  },
]);
