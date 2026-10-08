import { redirect, RouteObject } from "react-router";
import LogsPage from "../../../../App/Gerente/LogsPage/LogsPage";

  // /gerente/logs
const LogsRoute: RouteObject[] = [
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
        lazy: () => import("../../../../App/Gerente/LogsPage/AllLogs"),
      },
      {
        path: "mercadorias",
        lazy: () => import("../../../../App/Gerente/LogsPage/MercadoriasLog"),
      },
      {
        path: "usuarios",
        lazy: () => import("../../../../App/Gerente/LogsPage/UsuarioLogs"),
      },
      {
        path: "fabricantes",
        lazy: () => import("../../../../App/Gerente/LogsPage/FabricanteLogs"),
      },
    ],
  },
];

export default LogsRoute;
