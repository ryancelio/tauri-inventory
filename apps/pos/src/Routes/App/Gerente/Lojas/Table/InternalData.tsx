import { ILoja, UsuarioListing } from "@tauri-inventory/types";
import { useEffect, useState } from "react";
import { timeout } from "../../../../../Helpers/delay";
import { Loader2, Store } from "lucide-react";
import { motion } from "framer-motion";
import { getUsuarios } from "../../../../../api/apiUsuario";
import { useFetcher } from "react-router";
import { getDataLoader } from "../../../../Routers/AppRoutes/Gerente/Lojas/LojasDataRoute";

export default function InternalData({
  selectedLoja,
  isFetching,
  lojaData,
}: {
  selectedLoja: ILoja | null;
  isFetching: boolean;
  lojaData: Awaited<ReturnType<typeof getDataLoader>> | undefined;
  }) {
  if (isFetching) {
    return (
      <div className="grid size-full place-items-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!selectedLoja || !lojaData) {
    return (
      <div className="grid size-full place-items-center">
        <div className="flex flex-col items-center justify-center gap-3 text-center text-xl">
          <Store />
          <h1>Selecione uma loja</h1>
        </div>
      </div>
    );
  }
  const {funcionariosAtivos,funcionariosInativos,mercadoriasPrincipais, lojaEstoqueTotal } = lojaData;

  return (
    <div className="flex flex-col gap-2.5 p-3">
      {/*First Row*/}
      <div className="flex gap-4">
          {/*User Table*/}
        <div className="flex flex-col border-slate-100 shadow-sm rounded-lg w-1/3 ">
          <div className="flex bg-slate-100 p-2 rounded-t-lg">
            <h1>Usuarios</h1>
            <p className="ml-auto mr-3 text-sm text-slate-500 ">Total: {funcionariosAtivos.length}</p>
          </div>
          <div className="h-60 w-full overflow-y-auto p-2 flex flex-col">
            {funcionariosAtivos.map((func) => (
              <div className="w-full" key={func.id}>
                {func.nome}
              </div>
            ))}
          </div>
          <div className="mt-auto bg-slate-50 p-1 text-sm text-slate-500">
            Inativos: {funcionariosInativos.length }
          </div>
        </div>
        {/* Mercs Table */}
        <div className="flex flex-col border-slate-100 shadow-sm rounded-lg w-2/3">
          <div className="flex bg-slate-100 p-2 rounded-t-lg">
            <h1>Mercadorias</h1>
            <p className="ml-auto mr-3 text-sm text-slate-500">Total: { mercadoriasPrincipais.count}</p>
          </div>
          <div className="h-60 w-full overflow-y-auto p-2 flex flex-col gap-1.5">
            <div className="flex justify-between border-b-2 border-slate-200 pb-1 px-1">
              <div>ID</div>
              <div>Descrição</div>
              <div>Estoque</div>
            </div>
            {mercadoriasPrincipais.data.map((merc) => (
              <div className="flex justify-between">
                <div>
                  {merc.id}
                </div>
                <div>
                {merc.descricao}
                </div>
                <div>
                  {merc.estoque.find((est) => est.loja.id === selectedLoja.id)?.estoque}
                </div>
              </div>
            ))}
          </div>

            <div className="text-right px-2 mt-auto bg-slate-50 p-1 text-sm text-slate-500">
              Estoque Total: {lojaEstoqueTotal }
            </div>
        </div>
      </div>
    </div>
  );
}
