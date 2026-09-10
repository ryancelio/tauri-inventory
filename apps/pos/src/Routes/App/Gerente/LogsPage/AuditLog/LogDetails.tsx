import { ArrowRight } from "lucide-react";
import { fieldLabel, formatValue } from "./format";
import { AuditLog } from "@tauri-inventory/types";

export function LogDetails({ dados }: { dados: AuditLog["dados"] }) {
  if (!dados) {
    return (
      <p className="text-sm text-slate-500">
        Nenhum detalhe adicional registrado.
      </p>
    );
  }

  if (dados.alteracoes) {
    const entries = Object.entries(dados.alteracoes).filter(([, v]) => v);
    if (entries.length === 0) {
      return (
        <p className="text-sm text-slate-500">Nenhuma alteração registrada.</p>
      );
    }
    return (
      <dl className="grid gap-2.5">
        {entries.map(([field, change]) => (
          <div
            key={field}
            className="grid grid-cols-[minmax(0,140px)_1fr] items-center gap-3 text-sm"
          >
            <dt className="truncate text-slate-500">{fieldLabel(field)}</dt>
            <dd className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-red-700 line-through decoration-red-400/70">
                {formatValue(field, (change as { anterior: unknown }).anterior)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700">
                {formatValue(field, (change as { novo: unknown }).novo)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  if (dados.criacao) {
    const entries = Object.entries(dados.criacao).filter(
      ([field]) => field !== "id",
    );
    return (
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {entries.map(([field, value]) => (
          <div
            key={field}
            className="flex items-baseline justify-between gap-3 text-sm"
          >
            <dt className="text-slate-500">{fieldLabel(field)}</dt>
            <dd className="truncate font-medium text-slate-800">
              {formatValue(field, value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <p className="text-sm text-slate-500">
      Nenhum detalhe adicional registrado.
    </p>
  );
}
