import { createHashRouter } from "react-router";
import { checkApiStatus } from "../../backend/backendHelper";
import UpdateProgress, {
  updateProgressLoader,
} from "./Init/UpdateDownloadModal";
import AppRoutes from "./AppRoutes/AppRoutes";

export type ActionResponse<T> = {
  ok: boolean;
  response: string;
  errors?: T;
};

export interface ActionErrorData<T> {
  message: { response: string };
  errors?: T;
}

// const app = [];

export const router = createHashRouter([
  {
    // Separate, minimal route used by the dedicated update-progress window.
    // Avoids MainLayout chrome (TitleBar, middlewares) in the tiny window.
    path: "/update-progress",
    loader: updateProgressLoader,
    Component: UpdateProgress,
  },
  {
    // A verificação inicial de conexão é disparada pelo front em MainLayout.
    lazy: () => import("../Routers/Init/MainLayout"),
    children: [
      {
        path: "/",
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
     ...AppRoutes
    ],
  },
]);
