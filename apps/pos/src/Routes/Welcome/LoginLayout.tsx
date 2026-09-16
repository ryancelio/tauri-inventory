import { ActionFunction, LoaderFunctionArgs, redirect } from "react-router";
import { apiLogin } from "../../api/apiHelper";
import LoginPage from "./LoginPage";
import { apiStatusContext } from "../../context/contexts";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader2 } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { getApiStatusCheck } from "../../backend/backendHelper";

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
  const [isCheckingApi, setIsCheckingApi] = useState(true);

  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;
    // Só o load inicial deve bloquear a tela; reconexões posteriores
    // (API://checking) não devem reexibir o loading.
    const resolved = { value: false };

    (async () => {
      // Consulta o estado atual, pois eventos emitidos antes do listener
      // ser registrado (ex.: setup do Tauri) são perdidos.
      try {
        const { isChecking } = await getApiStatusCheck();
        if (!active) return;
        if (isChecking) {
          setIsCheckingApi(true);
        } else {
          resolved.value = true;
          setIsCheckingApi(false);
        }
      } catch {}

      const unlistenPromise = listen<boolean>("API://checking", (event) => {
        if (!active) return;
        if (event.payload === false) {
          resolved.value = true;
          setIsCheckingApi(false);
        } else if (!resolved.value) {
          setIsCheckingApi(true);
        }
      });
      const stop = await unlistenPromise;
      if (active) {
        unlisten = stop;
      } else {
        stop();
      }
    })();

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  if (isCheckingApi) {
    return (
      <div className="size-full grid place-items-center">
        <Loader2 />
      </div>
    );
  } else {
    return <LoginPage />;
  }
}
