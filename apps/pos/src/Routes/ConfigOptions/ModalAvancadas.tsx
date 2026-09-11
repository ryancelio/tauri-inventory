import { useCallback, useState } from "react";
import {
  getLastBackupDate,
  getLastestBackup,
} from "../../backend/backendHelper";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { useToast } from "../../context/Toast/ToastContext";
import { AnimatePresence, motion } from "motion/react";

export default function ConfigAvançada({
  lastBackup,
  dbPath,
  setDbPath,
  dbPass,
  setDbPass,
  updateDbPass, // ADICIONADO
  setUpdateDbPass, // ADICIONADO
  setLastBackupDate,
}: {
  lastBackup: string;
  dbPath: string;
  setDbPath: (val: string) => void;
  dbPass: string;
  setDbPass: (val: string) => void;
  updateDbPass: boolean;
  setUpdateDbPass: (val: boolean) => void;
  setLastBackupDate: (val: string) => void;
}) {
  const [isExpanded, setExpanded] = useState(false);
  const [latestBackupLoading, setLatestBackupLoading] = useState(false);
  const [fetchBackupSuccess, setFetchBackupSuccess] = useState<boolean | null>(
    null,
  );


  const toaster = useToast();

  const getLatestBackupDate = useCallback(async () => {
    try {
      const lastBackupDate = await getLastBackupDate(false);
      setLastBackupDate(lastBackupDate);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLatestBackup = async () => {
    if (latestBackupLoading) return;

    try {
      setLatestBackupLoading(true);
      await getLastestBackup();
      setFetchBackupSuccess(true);
      toaster.toast({
        title: "Baixar Backup",
        message: "Backup baixado com sucesso!",
        type: "success",
      });

      getLatestBackupDate();
    } catch (e) {
      console.error(e);
      setFetchBackupSuccess(false);

      toaster.toast({
        title: "Baixar Backup",
        message: "Falha ao baixar backup!",
        type: "error",
      });
    } finally {
      setLatestBackupLoading(false);
      setTimeout(() => {
        setFetchBackupSuccess(null);
      }, 2000);
    }
  };

  return (
    <div className="px-2">
      <button
        className={`flex w-full items-center rounded-lg bg-slate-100 px-3 py-2 text-left font-semibold transition-all ${isExpanded ? "rounded-b-none" : ""}`}
        onClick={() => setExpanded(!isExpanded)}
      >
        Avançado
        <ChevronRight
          className={`mr-2 ml-auto h-5 w-5 transition-transform duration-200 ease-out ${isExpanded ? "rotate-90" : ""}`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isExpanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 rounded-b-lg bg-slate-50 p-4 pt-3">
            {/* Header / Ações */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-base font-semibold text-slate-800">
                Banco de Dados Local
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center">
                  <AnimatePresence mode="wait">
                    {latestBackupLoading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </motion.div>
                    )}
                    {fetchBackupSuccess === true && !latestBackupLoading && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <Check className="h-6 w-6 text-green-500" />
                      </motion.div>
                    )}
                    {fetchBackupSuccess === false && !latestBackupLoading && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <X className="h-6 w-6 text-red-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  className="flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={fetchLatestBackup}
                  disabled={latestBackupLoading}
                >
                  Atualizar Banco
                </button>
              </div>
            </div>

            {/* Input Caminho */}
            <div>
              <label
                htmlFor="dbPath"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Caminho do arquivo local
              </label>
              <input
                id="dbPath"
                value={dbPath}
                onChange={(e) => setDbPath(e.target.value)}
                type="text"
                placeholder="C:\Caminho\para\o\banco.db"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>

            {/* Info Backup */}
            {/* Backup date, should animate on change */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="text-slate-500">Último Backup:</span>
              <span className="font-medium text-slate-800">
                {lastBackup || "Nenhum registro encontrado"}
              </span>
            </motion.div>

            {/* Seção Nova de Senha do Banco */}
            <div className="relative mt-1 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: updateDbPass ? "100%" : 0 }}
                className="absolute inset-0 h-1.5 bg-red-500"
              />
              <label
                className={`flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50/50`}
                onClick={() => setUpdateDbPass(!updateDbPass)}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-slate-700">
                    Alterar senha do banco de dados local?
                  </span>
                  <span className="text-xs text-slate-500">
                    Altere somente caso o administrador do sistema solicite
                  </span>
                </div>

                {/* Switch Toggle Animado */}
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                    updateDbPass ? "bg-blue-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                      updateDbPass ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>

              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  updateDbPass
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-slate-100 p-4 pt-3">
                    <input
                      type="password"
                      name={updateDbPass ? "senhaDB" : undefined}
                      id={updateDbPass ? "senhaDB" : undefined}
                      value={dbPass}
                      onChange={(e) => setDbPass(e.target.value)}
                      placeholder="Digite a nova senha do banco..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
