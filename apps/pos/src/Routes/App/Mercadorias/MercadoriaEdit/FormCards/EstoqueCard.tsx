import { Layers } from "lucide-react";
import EstoqueDisplay from "../FormComponents/FormEstoqueDisplay";
import { IMercadoria, UsuarioLogado } from "@tauri-inventory/types";

export default function EstoqueCard({ mercadoria, usuario,isEdit,isOfflineMode }: { mercadoria: IMercadoria, usuario: UsuarioLogado, isEdit: boolean; isOfflineMode: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Layers className="text-slate-400" size={20} />
        <h2 className="text-lg font-semibold text-slate-800">
          Estoque
        </h2>
      </div>
      <div className="flex flex-col items-center gap-3">
        {/*<EstoqueDisplay
          label="Loja 02"
          id="estoque02"
          defaultValue={mercadoria.estoque02 || 0}
          disabled={
            (usuario.local !== "02" &&
              usuario.funcao !== "admin" &&
              isEdit) ||
            isOfflineMode
          }
        />
        <EstoqueDisplay
          label="Loja 03"
          id="estoque03"
          defaultValue={mercadoria.estoque03 || 0}
          disabled={
            (usuario.local !== "03" &&
              usuario.funcao !== "admin" &&
              isEdit) ||
            isOfflineMode
          }
        />
        <EstoqueDisplay
          label="Loja 04"
          id="estoque04"
          defaultValue={mercadoria.estoque04 || 0}
          disabled={
            (usuario.local !== "04" &&
              usuario.funcao !== "admin" &&
              isEdit) ||
            isOfflineMode
          }
        />*/}

      </div>
    </div>
  )
}
