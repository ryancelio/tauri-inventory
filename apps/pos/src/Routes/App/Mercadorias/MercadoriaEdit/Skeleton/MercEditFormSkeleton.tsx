export default function MercadoriaFormSkeleton() {
  return (
    <div className="flex flex-col h-full w-full bg-slate-50 overflow-auto">
      {/* Header Fixo / Barra de Ações (Skeleton) */}
      <div className="sticky top-0 z-20 w-full px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Botão Voltar */}
          <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
          {/* Título e Badges */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-40 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="h-6 w-16 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="h-6 w-20 bg-slate-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Datas */}
          <div className="hidden md:block h-8 w-64 bg-slate-200 rounded-lg animate-pulse"></div>
          {/* Botão Salvar */}
          <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Formulário Principal (Skeleton) */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-400 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= COLUNA ESQUERDA ================= */}
          <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
            {/* Card: Informações Gerais */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-40 h-6 bg-slate-200 rounded-md animate-pulse"></div>
              </div>

              {/* ID e Descrição/Cor */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
                <div className="flex flex-col md:col-span-8 gap-1.5">
                  <div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="w-full h-[42px] bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex flex-col md:col-span-4 gap-1.5">
                  <div className="w-12 h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="w-full h-[42px] bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
              </div>

              {/* Fabricante, Grupo e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex flex-col gap-1.5">
                    <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                    <div className="w-full h-[42px] bg-slate-100 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Galeria de Fotos */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-36 h-6 bg-slate-200 rounded-md animate-pulse"></div>
              </div>
              <div className="h-48 w-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 animate-pulse"></div>
            </div>

            {/* Card: Observações */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-32 h-6 bg-slate-200 rounded-md animate-pulse"></div>
              </div>
              <div className="h-30 w-full bg-slate-100 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* ================= COLUNA DIREITA ================= */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            {/* Card: Preços */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-16 h-6 bg-slate-200 rounded-md animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="w-12 h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="w-full h-[42px] bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="w-14 h-4 bg-slate-200 rounded animate-pulse"></div>
                  <div className="w-full h-[42px] bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
              </div>

              {/* Botão alterar variação */}
              <div className="flex justify-end w-full mt-1">
                <div className="w-48 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>

              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mt-2 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-20 h-6 bg-slate-200 rounded-md animate-pulse"></div>
              </div>

              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex justify-between items-center w-full bg-slate-50 p-2.5 rounded-lg border border-slate-100 animate-pulse"
                  >
                    <div className="w-16 h-4 bg-slate-200 rounded"></div>
                    <div className="w-12 h-6 bg-slate-200 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card: Características Dinâmicas (Placeholder) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-32 h-6 bg-slate-200 rounded-md animate-pulse"></div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="w-full h-10 bg-slate-100 rounded-lg animate-pulse"></div>
                <div className="w-full h-10 bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Card: Variações (Mesma Key) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
                <div className="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="w-44 h-6 bg-slate-200 rounded-md animate-pulse"></div>
                <div className="ml-auto w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>

              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex flex-col p-3 rounded-xl border border-slate-100 bg-white shadow-sm gap-3 animate-pulse"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 w-full">
                        <div className="w-9 h-9 bg-slate-200 rounded-lg shrink-0"></div>
                        <div className="flex flex-col gap-1.5 w-full pt-1">
                          <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
                          <div className="w-1/3 h-3 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0"></div>
                    </div>

                    <div className="border-t border-slate-100 w-full" />

                    <div className="flex items-center justify-between px-1">
                      <div className="w-20 h-4 bg-slate-200 rounded"></div>
                      <div className="w-24 h-4 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
