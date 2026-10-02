import { ILoja } from "@tauri-inventory/types";
import InternalData from "./InternalData";
import InternalTable from "./InternalTable";
import { useState } from "react";

export default function LojasTable() {

  const [selectedLoja, setSelectedLoja] = useState<ILoja | null>(null);

  return (
    <div className="flex flex-row size-full">
      <div className="w-1/2 h-full border-r-2 border-slate-200 p-2">
        <InternalTable selectedLoja={selectedLoja} setSelectedLoja={setSelectedLoja}/>
      </div>
      <div className="w-1/2 h-full p-2">
        <InternalData selectedLoja={selectedLoja} />
      </div>
    </div>
  )
}
