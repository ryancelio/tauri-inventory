import { motion } from "motion/react";
import { Loader2, Store } from "lucide-react";
import { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import LojasTable from "./Table/LojasTable";
import {
  createLoja,
  deleteLoja,
  editLoja,
  getLojas,
} from "../../../../api/apiLojas";
import { useState } from "react";
import { ILoja } from "@tauri-inventory/types";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const nome = formData.get("nome")?.toString();
    const cnpj = formData.get("CNPJ")?.toString();
    const lojaId = formData.get("id")?.toString();
    const id = Number(lojaId);

    const checkDados = () => {
      if (!nome) {
        return { ok: false, response: null, error: "Nome inválido." };
      }

      if (!cnpj) {
        return { ok: false, response: null, error: "CNPJ inválido." };
      }

      return null;
    };

    const checkId = () => {
      if (!id || isNaN(id)) {
        console.error("ID da loja nao presente no payload na action.");
        return { ok: false, response: null, error: "Dados incompletos." };
      }
      return null;
    };

    let response: ILoja | null = null;
    switch (request.method) {
      case "POST":
        const postErr = checkDados();
        if (postErr) return postErr;
        const newLoja = await createLoja({ CNPJ: cnpj!, nome: nome! });
        response = newLoja;
        break;
      case "PUT":
        const putErr = checkId();
        if (putErr) return putErr;
        const putErr2 = checkDados();
        if (putErr2) return putErr2;
        response = await editLoja({ CNPJ: cnpj!, nome: nome! }, id);
        break;
      case "DELETE":
        const deleteErr = checkId();
        if (deleteErr) return deleteErr;
        response = await deleteLoja(id);
        break;
    }
    return { ok: true, response, error: null };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      response: null,
      error: e instanceof Error ? e.message : "Erro ao criar/editar loja",
    };
  }
}

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
  const [selectedLojaId, setSelectedLojaId] = useState<number | string | null>(
    null,
  );

  return (
    <div className="h-full w-full overflow-hidden bg-slate-50 p-3 md:p-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <header className="shrink-0 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Lojas</h1>
              <p className="text-sm text-slate-500">
                Gerencie informações das lojas cadastradas
              </p>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 p-4">
          <LojasTable
            selectedLojaId={selectedLojaId}
            setSelectedLojaId={setSelectedLojaId}
          />
        </div>
      </motion.div>
    </div>
  );
}
