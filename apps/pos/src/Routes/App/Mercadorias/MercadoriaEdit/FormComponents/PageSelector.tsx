import { ChevronRight, ChevronsLeft } from "lucide-react";

export default function PageSelector({
  totalPages,
  page,
  handlePageChange,
}: {
  totalPages: number;
  page: number;
  handlePageChange: (newPage: number) => void;
}) {
  const pages = [];
  const btnClass = "px-3 py-1.5 rounded-md text-sm font-medium transition-all ";
  const activeClass =
    "bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-default";
  const inactiveClass =
    "text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer";

  // Botão Anterior
  pages.push(
    <button
      key="prev"
      onClick={() => handlePageChange(1)}
      disabled={page <= 1}
      className={`p-1.5 rounded-md transition-all border ${page <= 1 ? "text-slate-300 border-slate-100 bg-slate-50/50 cursor-not-allowed" : "text-slate-500 bg-slate-50 border-slate-200 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"}`}
      title="Primeira Página"
    >
      <ChevronsLeft size={18} />
    </button>,
  );

  if (page > 1) {
    pages.push(
      <button
        key={page - 1}
        onClick={() => handlePageChange(page - 1)}
        className={btnClass + inactiveClass}
      >
        {page - 1}
      </button>,
    );
  }

  pages.push(
    <button key={page} className={btnClass + activeClass}>
      {page}
    </button>,
  );

  let lastPushed = page;
  for (let i = 1; i <= 3; i++) {
    if (page + i < totalPages) {
      pages.push(
        <button
          key={page + i}
          onClick={() => handlePageChange(page + i)}
          className={btnClass + inactiveClass}
        >
          {page + i}
        </button>,
      );
      lastPushed = page + i;
    }
  }

  if (lastPushed + 1 < totalPages) {
    pages.push(
      <span
        key="ellipsis"
        className="px-1 text-slate-400 font-medium tracking-widest select-none"
      >
        ...
      </span>,
    );
    pages.push(
      <input
        key="input"
        type="number"
        min={1}
        max={totalPages}
        className="w-12 h-8 px-1 text-sm text-center bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
        placeholder="Ir"
        title="Digite a página e aperte Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const val = Number(e.currentTarget.value);
            if (val >= 1 && val <= totalPages) handlePageChange(val);
            e.currentTarget.value = "";
          }
        }}
        onBlur={(e) => {
          const val = Number(e.currentTarget.value);
          if (val >= 1 && val <= totalPages) handlePageChange(val);
          e.currentTarget.value = "";
        }}
      />,
    );
  }

  if (page < totalPages) {
    pages.push(
      <button
        key={totalPages}
        onClick={() => handlePageChange(totalPages)}
        className={btnClass + inactiveClass}
      >
        {totalPages}
      </button>,
    );
  }

  // Botão Próximo
  pages.push(
    <button
      key="next"
      onClick={() => handlePageChange(page + 1)}
      disabled={page >= totalPages}
      className={`p-1.5 rounded-md transition-all border ${page >= totalPages ? "text-slate-300 border-slate-100 bg-slate-50/50 cursor-not-allowed" : "text-slate-500 bg-slate-50 border-slate-200 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"}`}
      title="Próxima Página"
    >
      <ChevronRight size={18} />
    </button>,
  );

  return pages;
}
