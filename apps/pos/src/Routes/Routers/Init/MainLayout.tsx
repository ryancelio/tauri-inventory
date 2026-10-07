import { useCallback, useEffect, useRef, useState } from "react";
import {
  Outlet,
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useRevalidator,
  useRouteError,
} from "react-router";
import { TitleBar } from "../../App/Components/TitleBar";
import { listen } from "@tauri-apps/api/event";
import OfflineOverlay from "../../App/SharedComponents/OfflineOverlay";
import { invoke } from "@tauri-apps/api/core";
import FullscreenInfoModal from "../../App/SharedComponents/InfoModal";
import { useToast } from "../../../context/Toast/ToastContext";
import {
  checkApiStatus,
  automaticCheckUpdate,
  getIsOfflineModeActive,
  getPendingUpdate,
  automaticBackupDownload,
} from "../../../backend/backendHelper";
import { ApiStatusCheck, ApiStatusContext } from "../../../context/contexts";
import { Loader2, TriangleAlert } from "lucide-react";

export async function loader() {
  const isOfflineMode = await getIsOfflineModeActive();
  const availableUpdate = await getPendingUpdate();

  return { isOfflineMode, availableUpdate };
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
      <TitleBar isOfflineMode={false} setSuccessConnection={() => {}}/>
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
      <Loader2 className="animate-spin" />
    </div>
  );
};

export function Component() {
  const { isOfflineMode } = useLoaderData<typeof loader>();

  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const toaster = useToast();

  const [successConnection, setSuccessConnection] = useState(false);

  // A verificação de conexão é disparada pelo front (efeito abaixo) e o
  // resultado é aplicado aqui, em vez de ler o valor salvo no Rust.
  const [apiStatus, setApiStatus] = useState<ApiStatusCheck>({
    isOnline: false,
    isChecking: true,
  });

  const isOnlineRef = useRef(false);

  // Enquanto uma verificação disparada pelo front está em andamento, o evento
  // "API://available" é apenas sincronização: o resultado já chega pelo await,
  // então não deve gerar toast de "reconexão" durante o startup.
  const checkInFlightRef = useRef(false);

  const applyApiStatus = useCallback(
    (isOnline: boolean, silent: boolean) => {
      const wasOnline = isOnlineRef.current;
      isOnlineRef.current = isOnline;
      setApiStatus({ isOnline, isChecking: false });

      // Primeira resolução da verificação inicial: apenas sincroniza o estado,
      // sem toast e sem revalidar, para não anunciar "reconectado" no startup.
      if (silent) return;

      // Se a conexão VOLTOU (estava offline e agora está online)
      if (isOnline && !wasOnline) {
        toaster.toast({
          title: "Conexão",
          message: "Conexão Reestabelecida.",
          type: "success",
        });
        revalidator.revalidate();
      } else if (!isOnline && wasOnline) {
        revalidator.revalidate();
      }
    },
    [revalidator, toaster],
  );

  // INITIAL CHECKS
  useEffect(() => {
    (async () => {
      try {
        await automaticCheckUpdate();
        await automaticBackupDownload();
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Fica escutando os eventos do Tauri em background (verificações disparadas
  // pelo Rust, ex.: falhas de requisição em `try_connection`).
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;

    (async () => {
      const unlistenOnline = listen<boolean>("API://available", (event) => {
        if (!active) return;
        applyApiStatus(event.payload, checkInFlightRef.current);
      });
      stop = await unlistenOnline;
    })();

    // Cleanup do listener quando o componente desmontar
    return () => {
      active = false;
      stop?.();
    };
  }, [applyApiStatus]);

  // VERIFICAÇÃO INICIAL DE CONEXÃO
  // Dispara a checagem no mount e usa o retorno dela (resolve = online,
  // reject = offline) como estado inicial, sem depender do valor salvo no Rust.
  useEffect(() => {
    let active = true;
    checkInFlightRef.current = true;

    (async () => {
      let isOnline = false;
      try {
        await checkApiStatus();
        isOnline = true;
      } catch (e) {
        console.log("Falha na verificação inicial de conexão:", e);
      }

      if (!active) return;
      checkInFlightRef.current = false;
      applyApiStatus(isOnline, true);
    })();

    return () => {
      active = false;
    };
  }, [applyApiStatus]);

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
    <ApiStatusContext.Provider value={apiStatus}>
      {!apiStatus.isOnline && !apiStatus.isChecking && !isOfflineMode && (
        <OfflineOverlay
          apiStatus={apiStatus}
          // lastBackupDate={lastBackupDate}
        />
      )}
      {/*{updateModal !== null && (
        <AppUpdateModal
          onClose={() => setUpdateModal(null)}
          update={updateModal}
        />
      )}*/}
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
    </ApiStatusContext.Provider>
  );
}
