import { ActionFunction, LoaderFunction, LoaderFunctionArgs, redirect } from "react-router";
import { apiLogin } from "../../api/apiHelper";
import LoginPage from "./LoginPage";
import { apiStatusContext } from "../../context/contexts";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Loader2 } from "lucide-react";
import { listen } from "@tauri-apps/api/event";

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

  const [isCheckingApi,setIsCheckingApi] = useState(true);

  console.log(isCheckingApi);

  useEffect(() => {
    const unlistenCheckingOnline = listen<boolean>("API://checking", (event) => {
      console.log("listen",event.payload);
      const isChecking = event.payload;
      setIsCheckingApi(isChecking);
    })

    return(() => {
      unlistenCheckingOnline.then((f) => f())
    })
  },[])

  if(isCheckingApi){
    return <div className="size-full grid place-items-center"><Loader2/></div>
  }else{
    return <LoginPage />;
  }
}
