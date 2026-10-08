import { ILoja } from "@tauri-inventory/types";
import InternalData from "./InternalData";
import InternalTable from "./InternalTable";
import { useState } from "react";
import { useFetcher } from "react-router";
import { getDataLoader } from "../../../../Routers/AppRoutes/Gerente/Lojas/LojasDataRoute";

export default function LojasTable() {
  const [selectedLoja, setSelectedLoja] = useState<ILoja | null>(null);
  const lojaExtraDataFetcher = useFetcher<typeof getDataLoader>();

  const handleSelectLoja = (loja: ILoja | null) => {
    setSelectedLoja(loja);
    if (!loja) return;
    lojaExtraDataFetcher.submit(
      { lojaId: loja.id },
      { action: "/gerente/lojas/get-data", method: "get" },
    );
  };

  return (
    <div className="flex size-full flex-row">
      <div className="h-full w-2/5 border-r-2 border-slate-200 p-2">
        <InternalTable
          selectedLoja={selectedLoja}
          setSelectedLoja={handleSelectLoja}
        />
      </div>
      <div className="h-full w-3/5 p-2">
        <InternalData
          selectedLoja={selectedLoja}
          isFetching={lojaExtraDataFetcher.state !== "idle"}
          lojaData={lojaExtraDataFetcher.data}
        />
      </div>
    </div>
  );
}
