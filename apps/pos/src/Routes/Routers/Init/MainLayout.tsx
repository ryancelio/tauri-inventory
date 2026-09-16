import { useEffect, useRef, useState } from "react";
import {
  LoaderFunction,
  Outlet,
  isRouteErrorResponse,
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
  getApiStatusCheck,
  getIsOfflineModeActive,
} from "../../../backend/backendHelper";
import { Loader2, TriangleAlert } from "lucide-react";

export const loader: LoaderFunction = async ({ context }) => {
  const initialApiStatus = context.get(apiStatusContext);

  const isOfflineMode = await getIsOfflineModeActive();

  return { initialApiStatus, isOfflineMode };
};

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  console.error(error);

  const message = isRouteErrorResponse(error)
    ? typeof error.data === "string"
      ? error.data
      : `Erro ${error.status}`
    : error instanceof Error
      ? error.message
      : "Erro desconhecido";

  return (
    <div className="z-100 flex h-screen w-screen flex-col overflow-hidden bg-white">
      <TitleBar isOfflineMode={false} setSuccessConnection={() => {}} />
      <div className="grid grow place-items-center p-8">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <TriangleAlert className="size-12 text-red-500" strokeWidth={1.5} />
          <h1 className="text-xl font-semibold text-slate-800">
            Erro Interno.
          </h1>
          <p className="text-sm text-slate-500">
            {message ||
              "Tente novamente e, caso o erro persista, entre em contato com um administrador."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-all hover:bg-blue-700 active:bg-blue-800"
          >
            Voltar ao início
          </button>
        </div>
      </div>
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
  // Se a verificação inicial ainda estava em andamento ao montar, a primeira
  // resolução do estado não é uma "reconexão" e não deve exibir toast.
  const wasInitiallyCheckingRef = useRef(initialApiStatus.isChecking);

  useEffect(() => {
    isOnlineRef.current = initialApiStatus.isOnline;

    let active = true;
    let stop: (() => void) | undefined;

    (async () => {
      // Se a verificação inicial terminou entre o middleware e este mount,
      // os eventos já foram emitidos e não virão mais → resolve direto.
      if (wasInitiallyCheckingRef.current) {
        try {
          const status = await getApiStatusCheck();
          if (!active) return;
          if (!status.isChecking) {
            wasInitiallyCheckingRef.current = false;
            isOnlineRef.current = status.isOnline;
            revalidator.revalidate();
            return;
          }
        } catch {}
      }

      // Fica escutando os eventos do Tauri em background
      const unlistenOnline = listen<boolean>("API://available", (event) => {
        if (!active) return;
        const isNowOnline = event.payload;

        // Primeira resolução da verificação inicial: apenas sincroniza o estado,
        // sem toast, para não exibir "offline"/"reconectado" durante o startup.
        if (wasInitiallyCheckingRef.current) {
          wasInitiallyCheckingRef.current = false;
          isOnlineRef.current = isNowOnline;
          revalidator.revalidate();
          return;
        }

        const wasOnline = isOnlineRef.current;
        isOnlineRef.current = isNowOnline;

        // Se a conexão VOLTOU (estava offline e agora está online)
        if (isNowOnline && !wasOnline) {
          toaster.toast({
            title: "Conexão",
            message: "Conexão Reestabelecida.",
            type: "success",
          });
          revalidator.revalidate();
        } else if (!isNowOnline && wasOnline) {
          revalidator.revalidate();
        }
      });
      stop = await unlistenOnline;
    })();

    // Cleanup do listener quando o componente desmontar
    return () => {
      active = false;
      stop?.();
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
      {!initialApiStatus.isOnline &&
        !initialApiStatus.isChecking &&
        !isOfflineMode && (
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
