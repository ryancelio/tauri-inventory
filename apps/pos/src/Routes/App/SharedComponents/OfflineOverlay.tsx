import { AlertTriangle, Bolt, Loader2, WifiOff } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { ApiStatusCheck } from "../../../context/contexts";
import { invoke } from "@tauri-apps/api/core";
import { useRevalidator } from "react-router";
import FullscreenModalWrapper from "./FullscreenModal";
import {
  getLastBackupDate,
  setOfflineMode,
} from "../../../backend/backendHelper";
import { useToast } from "../../../context/Toast/ToastContext";
import ConfigModal from "../../ConfigOptions/ConfigModal";

export default function OfflineOverlay({
  apiStatus,
}: {
  apiStatus: ApiStatusCheck;
}) {
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [isEnteringOffline, setIsEnteringOffline] = useState(false);

  const [failedOpenOfflineDB, setFailedOpenOfflineDB] = useState(false);
  const [configOverlayOpen, setconfigOverlayOpen] = useState(false);

  const reconnectButtonRef = useRef<HTMLButtonElement>(null);
  const revalidator = useRevalidator();
  const toaster = useToast();

  // Autofocus the primary action so keyboard users can retry immediately.
  useEffect(() => {
    reconnectButtonRef.current?.focus();
  }, []);

  // Fetch the backup date as soon as the overlay appears, so the warning
  // (if any) is visible *before* the user decides whether to go offline.
  useEffect(() => {
    checkLastBackupDate();
  }, []);

  async function checkConnection() {
    try {
      await invoke("recheck_api_status");
    } catch (e: any) {
      toaster.toast({
        title: "Conexão",
        message: "Erro ao tentar reconectar.",
        type: "error",
      });
    }
  }

  async function checkLastBackupDate() {
    try {
      setLastBackupDate(await getLastBackupDate(true));
    } catch (e: any) {
      if (e?.code && e?.message?.response) {
        toaster.toast({
          title: "Modo offline",
          message: e.message.response,
          type: "error",
        });
      }
    }
  }

  const changeOfflineMode = async (val: boolean) => {
    setIsEnteringOffline(true);
    try {
      await checkLastBackupDate();
      await setOfflineMode(val);
      revalidator.revalidate();
    } catch (e: any) {
      setFailedOpenOfflineDB(true);
      toaster.toast({
        title: "Falha ao entrar em modo offline",
        message: e?.message?.response || "",
        type: "error",
      });
    } finally {
      setIsEnteringOffline(false);
    }
  };

  const timeSinceBackup = useMemo(() => {
    if (!lastBackupDate) return null;
    const timeDiff = Date.now() - Date.parse(lastBackupDate);
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }, [lastBackupDate]);

  const backupIsStale = timeSinceBackup !== null && timeSinceBackup >= 7;

  return (
    <>
      <div className="z-999">
        {configOverlayOpen && (
          <ConfigModal onClose={() => setconfigOverlayOpen(false)} />
        )}
      </div>
      <div className="z-998">
        {!configOverlayOpen && (
          <FullscreenModalWrapper handleClose={() => {}}>
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="offline-overlay-title"
              className="flex w-full flex-col overflow-hidden rounded-xl"
            >
              <div className="flex items-center gap-2.5 bg-red-600 px-5 py-4 text-white">
                <WifiOff size={20} />
                <h1
                  id="offline-overlay-title"
                  className="text-base font-semibold"
                >
                  Falha na conexão
                </h1>
              </div>

              <div className="flex flex-col gap-4 bg-white px-5 py-5">
                <p className="text-sm text-gray-600">
                  Não foi possível se conectar ao servidor. Verifique sua
                  internet e tente novamente, ou continue trabalhando em modo
                  offline.
                </p>

                {timeSinceBackup !== null && (
                  <div
                    className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                      backupIsStale
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {backupIsStale && (
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    )}
                    <p>
                      {backupIsStale ? (
                        <>
                          <span className="font-semibold">Atenção:</span> o
                          último backup do servidor foi há {timeSinceBackup}{" "}
                          dias.
                        </>
                      ) : (
                        <>
                          Último backup do servidor: há {timeSinceBackup}{" "}
                          {timeSinceBackup === 1 ? "dia" : "dias"}.
                        </>
                      )}
                    </p>
                  </div>
                )}

                <div className="mt-1 flex items-center justify-end gap-3">
                  {/* {failedOpenOfflineDB && ( */}
                  <button
                    className="mr-auto ml-2 text-gray-400 transition-all hover:text-gray-800"
                    hidden={!failedOpenOfflineDB}
                    onClick={() => setconfigOverlayOpen(true)}
                  >
                    <Bolt />
                  </button>
                  {/* )} */}
                  <button
                    onClick={() => changeOfflineMode(true)}
                    disabled={isEnteringOffline}
                    className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 focus:ring-1 focus:ring-gray-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isEnteringOffline
                      ? "Entrando..."
                      : "Entrar em modo offline"}
                  </button>
                  <button
                    ref={reconnectButtonRef}
                    onClick={checkConnection}
                    disabled={apiStatus.isChecking}
                    className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-95 focus:ring-2 focus:ring-blue-300 focus:outline-none active:brightness-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {apiStatus.isChecking && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {apiStatus.isChecking
                      ? "Reconectando..."
                      : "Tentar Reconexão"}
                  </button>
                </div>
              </div>
            </div>
          </FullscreenModalWrapper>
        )}
      </div>
    </>
  );
}
