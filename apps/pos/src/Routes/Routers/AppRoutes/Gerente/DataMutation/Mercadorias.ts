import { RouteObject, ActionFunctionArgs } from "react-router";
import { updateSimilarMerc } from "../../../../../api/apiMercadoria";
import { deleteKeyPhoto } from "../../../../../api/apiPhotos";
import { requireGerenteMiddleware } from "../../../../../middlewares/auth";
import { deleteMercadoriaAction } from "../../../Actions/MercadoriasActions/MercadoriasActions";
import { AddMercadoriaPhotoAction, DeleteMercadoriaPhotoAction } from "../../../Actions/MercadoriasActions/MercPhotosActions";
import { SimilarMercUpdate } from "@tauri-inventory/types";

const MercadoriaMutationRoute: RouteObject[] = [
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
                return {
                  ok: false,
                  response: e.message.response,
                };
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
            let response = {
              response: "Resposta desconhecida",
            };

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
                return {
                  ok: true,
                  response: response.response,
                };
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
    ],
  },
]

export default MercadoriaMutationRoute;
