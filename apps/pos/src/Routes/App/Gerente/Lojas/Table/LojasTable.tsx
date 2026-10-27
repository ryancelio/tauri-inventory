import { ILoja } from "@tauri-inventory/types";
import InternalData from "./InternalData";
import InternalTable from "./InternalTable";
import { useFetcher } from "react-router";
import { getDataLoader } from "../../../../Routers/AppRoutes/Gerente/Lojas/LojasDataRoute";
import { AnimatePresence, motion } from "motion/react";
import { Store } from "lucide-react";
import CreateButton from "../../../Mercadorias/MercadoriaEdit/FormComponents/CreateButton";
import { useState } from "react";
import CreateLojaModal from "../CreateLojaModal";

export default function LojasTable({
  selectedLoja,
  setSelectedLoja,
}: {
  selectedLoja: ILoja | null;
  setSelectedLoja: (loja: ILoja | null) => void;
}) {
  const lojaExtraDataFetcher = useFetcher<typeof getDataLoader>();

  const [createLojaOpen, setCreateLojaOpen] = useState(false);

  const handleSelectLoja = (loja: ILoja | null) => {
    setSelectedLoja(loja);
    if (!loja) return;
    lojaExtraDataFetcher.submit(
      { lojaId: loja.id },
      { action: "/gerente/lojas/get-data", method: "get" },
    );
  };

  return (
    <>
      <AnimatePresence>
        {createLojaOpen && (
          <CreateLojaModal onClose={() => setCreateLojaOpen(false)} onCreate={(loja) => setSelectedLoja(loja)} />
        )}
      </AnimatePresence>

      <div className="flex h-full min-h-0 gap-5">
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: 0.05, ease: "easeOut" }}
          className="flex h-full w-1/3 min-w-0 flex-col rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800">
                Selecione a loja
              </h2>
              <p className="text-xs text-slate-500">
                Lista de lojas cadastradas
              </p>
            </div>
            <CreateButton
              className="size-8"
              onClick={() => setCreateLojaOpen(true)}
            />
          </div>
          <div className="min-h-0 flex-1 p-3">
            <InternalTable
              selectedLoja={selectedLoja}
              setSelectedLoja={handleSelectLoja}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: 0.08, ease: "easeOut" }}
          className="flex h-full w-2/3 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <AnimatePresence mode="wait">
            {selectedLoja ? (
              <motion.div
                key={selectedLoja.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex h-full min-h-0 flex-col"
              >
                <InternalData
                  selectedLoja={selectedLoja}
                  isFetching={lojaExtraDataFetcher.state !== "idle"}
                  lojaData={lojaExtraDataFetcher.data}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex h-full items-center justify-center p-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-slate-100">
                    <Store size={30} className="text-slate-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700">
                    Selecione uma loja
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Escolha uma loja na lista ao lado para visualizar suas
                    informações
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
