import { redirect, RouteObject } from "react-router";
import { requireGerenteMiddleware } from "../../../../middlewares/auth";
import GerenteDataMutationsRoute from "./GerenteDataMutationsRoute";
import LogsRoute from "./Logs/LogsRoute";
import LojasDataRoute from "./Lojas/LojasDataRoute";

// App Index '/gerente/'
const GerenteRoute: RouteObject[] = [
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
        lazy: () => import("../../../App/Gerente/UsuariosPage"),
      },
      ...LogsRoute,
      {
        path: "lojas",
        lazy: () => import("../../../App/Gerente/Lojas/LojasPage"),
        children: [
          ...LojasDataRoute
        ]
      },
      ...GerenteDataMutationsRoute
    ],
  },
]

export default GerenteRoute;
