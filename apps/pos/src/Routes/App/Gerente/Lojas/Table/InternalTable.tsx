import { Form, useLoaderData, useSubmit } from "react-router";
import { loader } from "../LojasPage";
import { ILoja } from "@tauri-inventory/types";
import { useDebouncedCallback } from "use-debounce";
import { motion } from "motion/react";
import { Search, Store, X } from "lucide-react";

export default function InternalTable({
  selectedLoja,
  setSelectedLoja,
}: {
  selectedLoja: ILoja | null;
  setSelectedLoja: (loja: ILoja | null) => void;
}) {
  const { lojas } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const debounce = useDebouncedCallback((value: HTMLFormElement) => {
    submit(value);
  }, 150);

  const handleSelect = (loja: ILoja) => {
    if (selectedLoja?.id === loja.id) {
      setSelectedLoja(null);
      return;
    }
    setSelectedLoja(loja);
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
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="nome"
            placeholder="Buscar por nome da loja..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-700 transition-all outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"
          />
        </Form>
      </div>

      <div className="custom-scrollbar relative -mx-2 flex-1 overflow-y-auto px-2">
        <div className="flex flex-col gap-1.5">
          {lojas.map((loja, index) => {
            const isSelected = selectedLoja?.id === loja.id;
            return (
              <motion.button
                key={loja.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.15,
                  delay: index * 0.02,
                  ease: "easeOut",
                }}
                onClick={() => handleSelect(loja)}
                className={`group relative flex items-center gap-3 rounded-lg border p-3 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-blue-300 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}
                >
                  <Store size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium text-slate-800">
                      {loja.nome}
                    </p>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isSelected
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      #{loja.id}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    CNPJ: {formatCNPJ(loja.CNPJ)}
                  </p>
                </div>
                {isSelected && (
                  <X
                    size={16}
                    className="text-blue-600 transition-opacity group-hover:opacity-80"
                  />
                )}
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
