import {
  getDescricaoCompleta,
  getEstoqueTotal,
  IMercadoria,
  SimilarMerc,
} from "@tauri-inventory/types";
import { Package, Eye } from "lucide-react";
import { Link } from "react-router";

export default function SimilarMercInfoCard({
  merc,
  isCurrent,
}: {
  merc: SimilarMerc;
  isCurrent: boolean;
}) {
  return (
    <div
      key={merc.id}
      className={`flex flex-col rounded-xl border p-3 transition-all ${
        isCurrent
          ? "cursor-default border-slate-200 bg-slate-50 opacity-60"
          : "border-slate-200/80 bg-white shadow-sm hover:border-blue-300 hover:shadow-md"
      }`}
    >
      {/* Seção Superior: Ícone, Descrição e Ação */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isCurrent
                ? "bg-slate-200"
                : "border border-blue-100/50 bg-blue-50/50"
            }`}
          >
            <Package
              size={18}
              className={isCurrent ? "text-slate-400" : "text-blue-500"}
            />
          </div>
          <div className="flex min-w-0 flex-col pt-0.5">
            <span className="text-sm leading-snug font-semibold wrap-break-word text-slate-800 capitalize">
              {getDescricaoCompleta(merc)}
            </span>
            <span className="mt-1 text-xs font-medium text-slate-500">
              ID: {merc.id}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 justify-end">
          {isCurrent ? (
            <span className="rounded-md bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500">
              ATUAL
            </span>
          ) : (
            <Link
              to={`../mercadorias/${merc.id}`}
              className="rounded-lg bg-blue-50 p-2 text-blue-600 shadow-sm transition-colors hover:bg-blue-100 hover:text-blue-700"
              title="Ver Mercadoria"
            >
              <Eye size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Divisor */}
      <div className="my-3 w-full border-t border-slate-100" />

      {/* Seção Inferior: Estoque e Preço */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Estoque:
          </span>
          <span className="text-sm font-bold text-blue-600">
            {getEstoqueTotal(merc)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Preço:
          </span>
          <span className="text-sm font-bold text-emerald-600">
            R${" "}
            {Number(merc.precoVenda).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
