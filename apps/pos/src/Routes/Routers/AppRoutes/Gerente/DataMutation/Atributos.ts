import { RouteObject } from "react-router";
import { createAtributoAction, deleteAtributoAction, alterarAtributoAction } from "../../../Actions/AtributosActions";

const AtributosMutationRoute: RouteObject[] = [
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
]

export default AtributosMutationRoute;
