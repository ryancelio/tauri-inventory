import { Form, useLoaderData, useSubmit } from "react-router";
import { loader } from "../LojasPage";
import { ILoja } from "@tauri-inventory/types";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";
import { ChevronRight, Search, Store } from "lucide-react";

export default function InternalTable({
  selectedLojaId,
  setSelectedLojaId,
}: {
  selectedLojaId: number | string | null;
  setSelectedLojaId: (id: number | string | null) => void;
}) {
  const { lojas } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const debounce = useDebouncedCallback((value: HTMLFormElement) => {
    submit(value);
  }, 150);

  const handleSelect = (loja: ILoja) => {
    if (selectedLojaId === loja.id) {
      setSelectedLojaId(null);
      return;
    }
    setSelectedLojaId(loja.id);
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Form method="GET" onChange={(e) => debounce(e.currentTarget)}>
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            name="nome"
            placeholder="Buscar loja..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-700 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          />
        </Form>
      </div>

      <div className="custom-scrollbar -mx-1 flex-1 overflow-y-auto px-1">
        <div className="flex flex-col gap-1">
          {lojas.map((loja, index) => {
            const isSelected = selectedLojaId === loja.id;
            return (
              <motion.button
                key={loja.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.12,
                  delay: Math.min(index * 0.015, 0.12),
                  ease: "easeOut",
                }}
                onClick={() => handleSelect(loja)}
                aria-pressed={isSelected}
                className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-blue-200 bg-blue-50/70"
                    : "border-transparent bg-white hover:bg-slate-50"
                }`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${
                    isSelected
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500 group-hover:text-slate-600"
                  }`}
                >
                  <Store size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {loja.nome}
                    </p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                      #{loja.id}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    CNPJ: {formatCNPJ(loja.CNPJ)}
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className={`shrink-0 transition-all ${
                    isSelected
                      ? "translate-x-0.5 text-blue-600"
                      : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-400"
                  }`}
                />
              </motion.button>
            );
          })}
          {lojas.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Search size={24} className="text-slate-300" />
              <p className="text-sm font-medium text-slate-600">
                Nenhuma loja encontrada
              </p>
              <p className="text-xs text-slate-400">
                Ajuste os filtros para encontrar resultados
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
