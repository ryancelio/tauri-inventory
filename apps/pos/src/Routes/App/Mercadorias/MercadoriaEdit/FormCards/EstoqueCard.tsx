import { Layers } from "lucide-react";
import EstoqueDisplay from "../FormComponents/FormEstoqueDisplay";
import {
  getEstoqueNaLoja,
  ILoja,
  IMercadoria,
  UsuarioLogado,
} from "@tauri-inventory/types";

export default function EstoqueCard({
  mercadoria,
  usuario,
  isEdit,
  isOfflineMode,
  lojas,
}: {
  mercadoria: IMercadoria;
  usuario: UsuarioLogado;
  isEdit: boolean;
  isOfflineMode: boolean;
  lojas: ILoja[];
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Layers className="text-slate-400" size={20} />
        <h2 className="text-lg font-semibold text-slate-800">Estoque</h2>
      </div>
      <div className="flex flex-col items-center gap-3">
        {lojas.length === 0 ? (
          <div>Nenhuma loja cadastrada</div>
        ) : (
          lojas.map((loja) => (
            <EstoqueDisplay
              key={loja.id}
              // O campo entra no FormData como `estoque[<lojaId>]` e
              // `formDataHelper` remonta em `[{ lojaId, estoque }]` — `Estoque`
              // é a única fonte de verdade do estoque, não há mais
              // `estoque02/03/04`.
              id={`estoque[${loja.id}]`}
              label={loja.nome}
              disabled={
                (usuario.local.id !== loja.id &&
                  usuario.funcao !== "admin" &&
                  isEdit) ||
                isOfflineMode
              }
              defaultValue={getEstoqueNaLoja(mercadoria, loja.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
