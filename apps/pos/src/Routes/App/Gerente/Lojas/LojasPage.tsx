import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { LoaderFunctionArgs } from "react-router";
import LojasTable from "./Table/LojasTable";
import { getLojas } from "../../../../api/apiLojas";
import { useState } from "react";
import { ILoja } from "@tauri-inventory/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const allLojas = await getLojas();

  let url = new URL(request.url);

  let nome = url.searchParams.get("nome");

  const lojas = allLojas.filter((loja) => {
    // If theres a nome input, check
    // If check returns true, continue
    // else, return false
    if (nome) {
      const found = loja.nome.includes(nome);
      if (!found) {
        return false;
      }
    }

    return true;
  });

  return { lojas };
}

export function Component() {
  const [selectedLoja, setSelectedLoja] = useState<ILoja | null>(null);

  return (
    <div className="size-full p-5">
      <motion.div
        initial={{ y: 14 }}
        animate={{ y: 0 }}
        className="flex size-full flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <header className="flex items-center border-b-2 border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <Store size={24} />
            </div>
            <h1 className="text-2xl font-semibold text-slate-800">
              Lojas Cadastradas
            </h1>
          </div>
          <motion.h1
            initial={{y:5, opacity: 0.95}}
            animate={{ y: 0,opacity:1 }}
            key={selectedLoja?.nome}
            className="mr-4 ml-auto items-center text-center text-2xl font-semibold text-slate-800">
            {selectedLoja?.nome}
          </motion.h1>
        </header>
        <div className="grow p-5">
          <LojasTable
            selectedLoja={selectedLoja}
            setSelectedLoja={setSelectedLoja}
          />
        </div>
      </motion.div>
    </div>
  );
}
