export default function MercadoriasListSkeleton() {
  return (
    <>
      {/* Tabela / Lista */}
      <div className="flex flex-col grow overflow-y-auto relative custom-scrollbar bg-white rounded-t-xl shadow-sm border-x border-t border-slate-200">
        {/* Header Fixo */}
        <div className="hidden z-20 lg:grid grid-cols-12 gap-4 w-full px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 rounded-t-xl">
          <div className="col-span-1 text-center">ID / Key</div>
          <div className="col-span-5">Descrição</div>
          <div className="col-span-2">Fabricante</div>
          <div className="col-span-1 text-center">Estoque</div>
          <div className="col-span-2 text-right">Preço Venda</div>
          <div className="col-span-1 text-center">Ações</div>
        </div>

        {/* Corpo da Lista (Skeletons) */}
        <div className="flex flex-col p-2 lg:p-3 gap-2">
          {/* Renderizando 5 itens falsos para preencher a tela */}
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <MercadoriaTileSkeleton key={item} />
          ))}
        </div>
      </div>

      {/* Footer / Paginação */}
      <div className="w-full bg-white px-4 sm:px-6 py-4 rounded-b-xl shadow-sm border-b border-x border-slate-200 shrink-0 flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* Info (Mostrando X de Y) */}
        <div className="xl:w-1/3 flex justify-center xl:justify-start w-full">
          <div className="w-48 h-5 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Botões de Paginação */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 xl:w-1/3">
          {[1, 2, 3, 4, 5].map((btn) => (
            <div
              key={btn}
              className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"
            ></div>
          ))}
        </div>

        {/* Seletor de Limite */}
        <div className="flex items-center justify-center xl:justify-end gap-2 xl:w-1/3 w-full">
          <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="w-20 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </>
  );
}

function MercadoriaTileSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-4 p-4 lg:items-center bg-white relative z-10">
        {/* Mobile ID/Key & Toggle */}
        <div className="flex justify-between items-center lg:hidden w-full mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-200 rounded-lg animate-pulse shrink-0"></div>
            <div className="flex flex-col gap-1.5">
              <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-12 h-3 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse shrink-0"></div>
            <div className="w-6 h-6 bg-slate-200 rounded-md animate-pulse shrink-0"></div>
          </div>
        </div>

        {/* Desktop ID/Key */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-1.5">
          <div className="w-full h-6 bg-slate-200 rounded-md animate-pulse"></div>
          <div className="w-12 h-3 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Descrição */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div className="w-full max-w-70 h-5 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Fabricante */}
        <div className="flex justify-between items-center lg:col-span-2 lg:justify-start">
          <span className="text-xs font-semibold text-slate-300 uppercase lg:hidden">
            Fabricante
          </span>
          <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Estoque */}
        <div className="flex justify-between items-center lg:col-span-1 lg:justify-center">
          <span className="text-xs font-semibold text-slate-300 uppercase lg:hidden">
            Estoque
          </span>
          <div className="w-12 h-7 bg-slate-200 rounded-md animate-pulse"></div>
        </div>

        {/* Preço */}
        <div className="flex justify-between items-center lg:col-span-2 lg:justify-end">
          <span className="text-xs font-semibold text-slate-300 uppercase lg:hidden">
            Preço
          </span>
          <div className="w-20 h-5 bg-slate-200 rounded animate-pulse"></div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex lg:col-span-1 justify-center items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
          <div className="w-6 h-6 bg-slate-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
