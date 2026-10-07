import { ActionFunction, redirect } from "react-router";
import { apiLogin } from "../../api/apiHelper";
import LoginPage from "./LoginPage";
import { invoke } from "@tauri-apps/api/core";
import { useContext } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader2 } from "lucide-react";
import { ApiStatusContext } from "../../context/contexts";

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

export async function loader() {
  const isOfflineMode = await invoke<boolean>("get_offline_mode");

  return { isOfflineMode };
};

export const HydrateFallback = () => {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
};

export function Component() {
  // Só a verificação inicial (disparada pelo front em MainLayout) bloqueia a
  // tela. O status vem do mesmo estado que resolve a checagem, então não há
  // corrida entre ler o estado do Rust e receber o evento `API://checking`.
  const { isChecking } = useContext(ApiStatusContext);

  if (isChecking) {
    return (
      <div className="size-full grid place-items-center">
        <Loader2 />
      </div>
    );
  } else {
    return <LoginPage />;
  }
}
