import { AnimatePresence, motion } from "motion/react";
import { Loader2, Store } from "lucide-react";
import { LoaderFunctionArgs } from "react-router";
import LojasTable from "./Table/LojasTable";
import { getLojas } from "../../../../api/apiLojas";
import { useState } from "react";
import { ILoja } from "@tauri-inventory/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const allLojas = await getLojas();

  const url = new URL(request.url);
  const nome = url.searchParams.get("nome")?.trim();

  const lojas = nome
    ? allLojas.filter((loja) =>
        loja.nome.toLowerCase().includes(nome.toLowerCase()),
      )
    : allLojas;

  return { lojas };
}

export function HydrateFallback() {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}

export function Component() {
  const [selectedLoja, setSelectedLoja] = useState<ILoja | null>(null);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/50"
      >
        <header className="shrink-0 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Lojas</h1>
                <p className="text-sm text-slate-500">
                  Gerencie informações das lojas cadastradas
                </p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              {selectedLoja && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  key={selectedLoja.id}
                  className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2 shadow-sm"
                >
                  <Store size={18} className="text-blue-600" />
                  <h1 className="text-lg font-semibold text-blue-800">
                    {selectedLoja.nome}
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
        <div className="min-h-0 flex-1 p-5">
          <LojasTable
            selectedLoja={selectedLoja}
            setSelectedLoja={setSelectedLoja}
          />
        </div>
      </motion.div>
    </div>
  );
}
