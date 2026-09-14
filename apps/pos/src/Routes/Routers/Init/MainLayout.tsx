import { useEffect, useRef, useState } from "react";
import {
  LoaderFunction,
  Outlet,
  useLoaderData,
  useNavigate,
  useRevalidator,
  useRouteError,
} from "react-router";
import { ApiStatusCheck, apiStatusContext } from "../../../context/contexts";
import { TitleBar } from "../../App/Components/TitleBar";
import { listen } from "@tauri-apps/api/event";
import OfflineOverlay from "../../App/SharedComponents/OfflineOverlay";
import { invoke } from "@tauri-apps/api/core";
import FullscreenInfoModal from "../../App/SharedComponents/InfoModal";
import { useToast } from "../../../context/Toast/ToastContext";
import {
  checkApiStatus,
  getIsOfflineModeActive,
} from "../../../backend/backendHelper";
import { Loader2 } from "lucide-react";

export const loader: LoaderFunction = async ({ context }) => {
  const initialApiStatus = context.get(apiStatusContext);

  const isOfflineMode = await getIsOfflineModeActive();

  return { initialApiStatus, isOfflineMode };
};

export function ErrorBoundary() {
  let error = useRouteError();
  console.log(error);
  return (
    <div className="grid place-items-center border border-dotted border-red-500 bg-red-400">
      <div>Erro Interno.</div>
      <p>
        Tente novamente e, caso o erro persista, entre em contato com um
        administrador.
      </p>
    </div>
  );
}

export const HydrateFallback = () => {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
};

export function Component() {
  const { initialApiStatus, isOfflineMode } = useLoaderData<{
    initialApiStatus: ApiStatusCheck;
    isOfflineMode: boolean;
  }>();

  const isOnlineRef = useRef(initialApiStatus.isOnline);
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const toaster = useToast();

  const [successConnection, setSuccessConnection] = useState(false);

  useEffect(() => {
    isOnlineRef.current = initialApiStatus.isOnline;

    // Fica escutando os eventos do Tauri em background
    const unlistenOnline = listen<boolean>("API://available", (event) => {
      const isNowOnline = event.payload;

      // Se a conexão VOLTOU (estava offline e agora está online)
      if (isNowOnline && !isOnlineRef.current) {
        toaster.toast({
          title: "Conexão",
          message: "Conexão Reestabelecida.",
          type: "success",
        });
        revalidator.revalidate();
      }

      // Atualiza a referência
      isOnlineRef.current = isNowOnline;
    });

    // Cleanup do listener quando o componente desmontar
    return () => {
      unlistenOnline.then((f) => f());
    };
  }, [initialApiStatus.isOnline, revalidator]);

  useEffect(() => {
    if (!isOfflineMode || successConnection) return;

    const checkExitOfflineMode = async () => {
      try {
        await checkApiStatus();
        console.log("Sucess check offline mode");
        setSuccessConnection(true);
      } catch (e) {
        console.log("API connection failed, trying again after 60 seconds");
      }
    };

    const interval = setInterval(
      async () => await checkExitOfflineMode(),
      60 * 1000,
    );

    return () => clearInterval(interval);
  }, [isOfflineMode, successConnection]);

  return (
    <>
      {!initialApiStatus.isOnline && !isOfflineMode && (
        <OfflineOverlay
          apiStatus={initialApiStatus}
          // lastBackupDate={lastBackupDate}
        />
      )}
      {successConnection && (
        <FullscreenInfoModal
          title="Conexão Reestabelecida"
          onClose={() => setSuccessConnection(false)}
          actionLabel="Sim"
          action={async () => {
            await invoke("set_offline_mode", { val: false });
            await revalidator.revalidate();
            navigate("/");
            setSuccessConnection(false);
          }}
          information="Conexão com servidor reestabelecida, sair do modo offline?"
        />
      )}
      <div className="z-100 flex h-screen w-screen flex-col overflow-hidden bg-white">
        <TitleBar
          isOfflineMode={isOfflineMode}
          setSuccessConnection={setSuccessConnection}
        />
        <Outlet />
      </div>
    </>
  );
}
