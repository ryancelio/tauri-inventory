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
  lojaData
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

  if (!selectedLoja) {
    return (
      <div className="grid size-full place-items-center">
        <div className="flex flex-col items-center justify-center gap-3 text-center text-xl">
          <Store />
          <h1>Selecione uma loja</h1>
        </div>
      </div>
    );
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>{selectedLoja?.nome}</div>
      <div>
        {lojaData?.funcionariosAtivos.map((fun) => (
          <div>{fun.nome}</div>
        ))}
      </div>
    </motion.div>
  );
}
