import { useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Lê/escreve a página atual como search param, preservando os demais
 * parâmetros da URL (filtros de mercadoria, usuário, etc.).
 */
export function usePageParam(paramName = "page") {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get(paramName)) || 1);

  const setPage = (next: number) => {
    setSearchParams((prev) => {
      // const params = new URLSearchParams(prev);
      if (next <= 1) {
        prev.delete(paramName);
      } else {
        prev.set(paramName, String(next));
      }
      return prev;
    });
  };

  return [page, setPage] as const;
}

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  paramName?: string;
}

/** Paginação genérica — reutilizável em qualquer listagem paginada por página inteira. */
export function Pagination({
  page,
  pageSize,
  total,
  paramName = "page",
}: PaginationProps) {
  const [, setPage] = usePageParam(paramName);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total <= pageSize) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500">
      <p>
        Mostrando{" "}
        <span className="font-medium text-slate-700">
          {start}–{end}
        </span>{" "}
        de <span className="font-medium text-slate-700">{total}</span>
      </p>

      <div className="flex items-center gap-1">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </motion.button>

        <span className="min-w-16 px-1 text-center text-slate-600 tabular-nums">
          {page} / {totalPages}
        </span>

        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40"
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
