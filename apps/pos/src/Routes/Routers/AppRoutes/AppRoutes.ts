import { RouteObject } from "react-router";
import { requireAuthMiddleware, requireGerenteMiddleware } from "../../../middlewares/auth";
import { AppError } from "../../App/Errors/AppError";
import GerenteRoute from "./Gerente/GerenteRoute";

const AppRoutes: RouteObject[] = [
{
  id: "app-root",
  middleware: [requireAuthMiddleware],
  lazy: () => import("../../App/AppLayout"),
  children: [
    {
      // Captura erros de loaders/actions das rotas filhas dentro do
      // conteúdo, mantendo TitleBar e sidebar montados para que o modal
      // de modo offline apareça por cima.
      ErrorBoundary: AppError,
      children: [
        {
          path: "/unauthorized",
          lazy: () => import("../../HelperRoutes/NaoAutorizado"),
        },
        // LISTAR MERC
        {
          path: "/mercadorias",
          lazy: () =>
            import("../../App/Mercadorias/MercadoriasTable/MercadoriaPage"),
        },
        // EDITAR MERC
        {
          path: "/mercadorias/:id",
          middleware: [requireGerenteMiddleware],
          lazy: () =>
            import("../../App/Mercadorias/MercadoriaEdit/MercadoriaEdit"),
        },
        // CRIAR MERC
        {
          path: "/mercadorias/new",
          middleware: [requireGerenteMiddleware],
          lazy: () =>
            import("../../App/Mercadorias/MercadoriaEdit/MercadoriaCreate"),
        },
        {
          path: "/assistencias",
          lazy: () => import("../../App/Assistencia/AssistenciaPage"),
        },
        {
          path: "/fabricantes",
          lazy: () => import("../../App/Fabricantes/FabricantesPage"),
        },
        {
          path: "/categorias",
          lazy: () => import("../../App/Categorias/CategoriasPage"),
        },
        {
          path: "/atributos",
          lazy: () => import("../../App/Atributos/AtributosPage"),
        },
        // {
        //   path: "/photos",
        //   lazy: () => import("../App/Photos/PhotosPage"),
        // },
        ...GerenteRoute
      ],
    },
  ],
},
]

export default AppRoutes;
