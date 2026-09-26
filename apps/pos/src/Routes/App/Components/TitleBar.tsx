import {
  Check,
  Minus,
  RotateCcw,
  RotateCw,
  Square,
  WifiOff,
  X,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import {
  checkApiStatus,
  getLastBackupDate,
  UpdateMetadata,
} from "../../../backend/backendHelper";
import { useToast } from "../../../context/Toast/ToastContext";
import { AnimatePresence, motion } from "motion/react";
import { useLoaderData, useNavigation } from "react-router";
import { listen } from "@tauri-apps/api/event";
import { loader } from "../../Routers/Init/MainLayout";
import AppUpdateModal from "../../Routers/Init/AppUpdateModal";

export function TitleBar({
  isOfflineMode,
  setSuccessConnection,
}: {
  isOfflineMode: boolean;
  setSuccessConnection: (val: boolean) => void;
}) {
  const appWindow = getCurrentWindow();
  const toaster = useToast();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  const { availableUpdate: initialaAvailableUpdate } =
    useLoaderData<typeof loader>();

  const [checkResponse, setCheckResponse] = useState<boolean | null>(null);
  const [checkingApi, setCheckingApi] = useState(false);

  const checkConnection = async () => {
    try {
      setCheckingApi(true);
      await checkApiStatus();
      console.log("Sucess check offline mode");
      setCheckResponse(true);
      setSuccessConnection(true);
    } catch (e) {
      setCheckResponse(false);

      toaster.toast({
        title: "Reconexão",
        message: "Nao foi possivel conectar",
        type: "error",
      });
    } finally {
      setCheckingApi(false);
      setTimeout(() => setCheckResponse(null), 1500);
    }
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backupDate, setBackupDate] = useState<string>("");
  const [availableUpdate, setAvailableUpdate] = useState(
    initialaAvailableUpdate,
  );
  const [showUpdateModal, setShowUpdateModal] =
    useState<UpdateMetadata | null>();

  useEffect(() => {
    const unlisten = appWindow.onResized(async () => {
      const full = await appWindow.isFullscreen();
      console.log(`Is Fullscreen: ${full}`);

      setIsFullscreen(full);
    });

    // Clean up listener on unmount
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const get = async () => {
      const date = await getLastBackupDate(false);
      setBackupDate(date);
    };
    get();
  }, []);

  useEffect(() => {
    const unlisten = listen("update://available", async ({ payload }) => {
      const parsedPayload = payload as UpdateMetadata;
      console.log("New Available Update: ", parsedPayload);
      setAvailableUpdate(parsedPayload);
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <>
      <AnimatePresence>
      {
        showUpdateModal && availableUpdate !== null &&
        <AppUpdateModal update={availableUpdate} onClose={() => setShowUpdateModal(null)}/>
      }
      </AnimatePresence>
      <div className="flex flex-col gap-0">
        <div
          className={`sticky top-0 right-0 left-0 z-200 flex h-8 select-none ${
            isOfflineMode ? "bg-red-600 text-white" : "bg-white text-black"
          }`}
        >
          {/* Tauri drag region that fills the remaining space */}
          <div
            data-tauri-drag-region
            className="mr-auto ml-auto flex h-full grow items-center justify-center"
          >
            {/* Célio Móveis */}
            {isOfflineMode && (
              <div className="relative flex w-full items-center justify-center">
                <span className="mr-auto ml-auto flex items-center justify-center gap-1.5">
                  <WifiOff size={14} />
                  Modo Offline
                </span>
                <div className="absolute right-4 flex items-center gap-2 text-slate-50/75">
                  <span className="text-sm font-semibold">
                    Ultimo backup: {backupDate}
                  </span>

                  <motion.button
                    onClick={() => checkConnection()}
                    disabled={checkingApi}
                    whileHover={{ scale: checkingApi ? 1 : 1.15 }}
                    whileTap={{ scale: checkingApi ? 1 : 0.9 }}
                    className={`relative flex size-6 items-center justify-center rounded-full transition-colors duration-300 ${
                      checkResponse === true
                        ? "text-emerald-400 hover:text-emerald-300"
                        : checkResponse === false
                          ? "text-red-400 hover:text-red-300"
                          : "text-white/75 hover:text-white"
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {checkingApi ? (
                        <motion.span
                          key="loading"
                          className="size-4"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 360,
                            transition: {
                              rotate: {
                                repeat: Infinity,
                                duration: 1,
                                ease: "linear",
                              },
                              opacity: { duration: 0.2 },
                              scale: { duration: 0.2 },
                            },
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            transition: { duration: 0.15 },
                          }}
                        >
                          <RotateCw strokeWidth={3} className="h-full w-full" />
                        </motion.span>
                      ) : checkResponse === true ? (
                        <motion.span
                          key="success"
                          className="size-4"
                          initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                            transition: {
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            },
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.3,
                            transition: { duration: 0.15 },
                          }}
                        >
                          <Check strokeWidth={3} className="h-full w-full" />
                        </motion.span>
                      ) : checkResponse === false ? (
                        <motion.span
                          key="error"
                          className="size-4"
                          initial={{ opacity: 0, scale: 0.3 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            x: [0, -3, 3, -3, 3, 0],
                            transition: {
                              x: { duration: 0.4 },
                              scale: { duration: 0.2 },
                            },
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.3,
                            transition: { duration: 0.15 },
                          }}
                        >
                          <X
                            strokeWidth={3}
                            className="h-full w-full text-white"
                          />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          className="size-4"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 0.2 },
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.5,
                            transition: { duration: 0.15 },
                          }}
                        >
                          <RotateCcw
                            strokeWidth={3}
                            className="h-full w-full text-white"
                          />
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* pulsing ring only while actively checking */}
                    {checkingApi && (
                      <motion.span
                        className="absolute inset-0 rounded-full border border-slate-300/40"
                        animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2,
                          ease: "easeOut",
                        }}
                      />
                    )}
                  </motion.button>
                </div>
              </div>
            )}
            {!isOfflineMode && availableUpdate !== null && (
              <div className="ml-auto w-fit pr-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer" onClick={() => setShowUpdateModal(availableUpdate)}>
                Update disponivel: <span>{availableUpdate.version}</span>
              </div>
            )}
          </div>

          {/* Window Controls */}
          {!isFullscreen && (
            <div className="ml-auto flex h-full">
              <button
                title="Minimize"
                className={`inline-flex h-full w-12 items-center justify-center ${isOfflineMode ? "text-white" : "text-gray-600"} transition-colors duration-75 ease-out hover:bg-black/10`}
                onClick={() => appWindow.minimize()}
              >
                <Minus className="size-4.5" />
              </button>
              <button
                title="Maximize"
                className={`inline-flex h-full w-12 items-center justify-center ${isOfflineMode ? "text-white" : "text-gray-600"} transition-colors duration-75 ease-out hover:bg-black/10`}
                onClick={() => appWindow.toggleMaximize()}
              >
                <Square className="size-3.5" />
              </button>
              <button
                title="Close"
                className={`inline-flex h-full w-12 items-center justify-center ${isOfflineMode ? "text-white" : "text-gray-600"} transition-colors duration-75 ease-out hover:bg-red-500 hover:text-white`}
                onClick={() => appWindow.close()}
              >
                <X className="size-4.5" />
              </button>
            </div>
          )}

          {/* Sinalizador de Navegação (Barra de Progresso Indeterminada) */}
          <motion.div
            initial={false}
            animate={{
              opacity: isNavigating ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 bottom-0 left-0 h-0.5 w-full overflow-hidden bg-blue-500/20"
          >
            <motion.div
              className="h-full w-1/3 bg-blue-500"
              animate={{ x: ["-100%", "300%"] }}
              transition={{
                repeat: Infinity,
                duration: 1.2,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
    </>
  );
}
