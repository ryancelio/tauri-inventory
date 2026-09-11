import { ActionFunction, LoaderFunction, LoaderFunctionArgs, redirect } from "react-router";
import { apiLogin } from "../../api/apiHelper";
import LoginPage from "./LoginPage";
import { apiStatusContext } from "../../context/contexts";
import { invoke } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader2 } from "lucide-react";

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const usuario = data.get("usuario") as string;
  const senha = data.get("senha") as string;

  if (!usuario || !senha) {
    return { code: 400, message: { response: "Usuario ou senha invalidos" } };
  }

  try {
    await apiLogin(usuario, senha);
    const currentWindow = getCurrentWindow();
    await currentWindow.maximize();
    return redirect("/mercadorias");
  } catch (e: any) {
    console.error(e);
    return e as { code: number; message: { response: string } };
  }
};

export async function loader({ context }: LoaderFunctionArgs){
  let apiStatus = context.get(apiStatusContext);
  let isOfflineMode = await invoke<boolean>("get_offline_mode");

  return { apiStatus, isOfflineMode };
};

export const HydrateFallback = () => {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
};

export function Component() {
  return <LoginPage />;
}
