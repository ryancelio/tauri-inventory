import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { LoaderFunctionArgs } from "react-router";
import LojasTable from "./Table/LojasTable";
import { getLojas } from "../../../../api/apiLojas";

export async function loader({request }: LoaderFunctionArgs) {
  const allLojas = await getLojas()

  let url = new URL(request.url);

  let nome = url.searchParams.get("nome");


  const lojas = allLojas.filter((loja) => {
    // If theres a nome input, check
    // If check returns true, continue
    // else, return false
    if (nome) {
      const found = loja.nome.includes(nome);
      if (!found) {
        return false
      }
    }

    return true;
  })


  return {lojas}
}

export function Component() {

  return (
    <div className="size-full p-5">
      <motion.div
        initial={{ y: 14 }}
        animate={{ y: 0 }}
        className="rounded-xl bg-white shadow-sm border border-slate-200 flex flex-col size-full"
      >
        <header className="flex border-b-2 border-slate-100 p-5">
          <div className="flex gap-3 items-center">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <Store size={24}/>
            </div>
          <h1 className="text-2xl font-semibold text-slate-800">Lojas Cadastradas</h1>
          </div>
        </header>
        <div className="p-5 grow">
          <LojasTable/>
        </div>
      </motion.div>
    </div>
  );
}
