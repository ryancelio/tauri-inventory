import { RouteObject } from "react-router";
import { criarCategoriaAction, deleteCategoriaAction, alterarCategoriaAction } from "../../../Actions/CategoriasActions";

const CategoriasMutationRoute: RouteObject[] = [
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
]

export default CategoriasMutationRoute;
