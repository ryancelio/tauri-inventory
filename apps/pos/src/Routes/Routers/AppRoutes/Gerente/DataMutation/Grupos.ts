import { RouteObject } from "react-router";
import { createGrupoAction, updateGrupo, deleteGrupoAction } from "../../../Actions/GruposActions";

const GruposMutationRoute: RouteObject[] = [
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
]

export default GruposMutationRoute;
