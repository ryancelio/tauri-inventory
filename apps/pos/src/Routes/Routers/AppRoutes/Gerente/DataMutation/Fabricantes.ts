import { RouteObject } from "react-router";
import { createFabricanteAction, deletarFabricanteAction, alterarFabricanteAction, deleteReasignFabricante } from "../../../Actions/FabricantesActions";

const FabricanteMutationRoute: RouteObject[] = [
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
            let res = await createFabricanteAction(formData);
            return { ok: true, response: res };
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
]

export default FabricanteMutationRoute;
