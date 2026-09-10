import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ApiListResponse,
  IMercadoria,
  UsuarioLogado,
} from "@tauri-inventory/types";
import { useRef, useState, useEffect } from "react";
import { useNavigation } from "react-router";
import MercadoriaTile from "./TableInternalComp/MercTile/MercadoriaTile";
import { Ban, Loader2 } from "lucide-react";
import TableFooter from "./TableInternalComp/Footer";

export default function MercadoriaListVirtual({
  resolvedMercadorias,
  usuario,
}: {
  resolvedMercadorias: ApiListResponse<IMercadoria>;
  usuario: UsuarioLogado;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const navigation = useNavigation();

  // 1. Estado para controlar a exibição com atraso do loader
  const [showLoader, setShowLoader] = useState(false);

  // 2. Variável derivada para saber se está carregando esta página específica
  const isLoading =
    navigation.state !== "idle" &&
    navigation.location?.pathname === "/mercadorias";

  // 3. Efeito que aplica o debounce ao loader
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isLoading) {
      // Só mostra o loader após 300ms de carregamento contínuo
      timeoutId = setTimeout(() => {
        setShowLoader(true);
      }, 150);
    } else {
      // Se terminar de carregar (ou for rápido demais), esconde imediatamente
      setShowLoader(false);
    }

    // Limpeza crucial: se o componente desmontar ou o estado de isLoading mudar
    // antes dos 300ms, o timer é cancelado e o loader não pisca.
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const virtualizer = useVirtualizer({
    count: resolvedMercadorias.data.length,
    estimateSize: () => 85,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  return (
    <>
      <div
        ref={parentRef}
        className="relative flex grow flex-col overflow-y-auto overscroll-contain scroll-smooth rounded-t-xl border-x border-t border-slate-200 bg-white shadow-sm"
      >
        {/* Header - Sticky continua funcionando normalmente */}
        <div className="sticky top-0 z-20 hidden w-full grid-cols-12 gap-4 rounded-t-xl border-b border-slate-100 bg-white/95 px-4 py-3.5 text-xs font-bold tracking-wider text-slate-500 uppercase backdrop-blur-md lg:grid">
          <div className="col-span-1 text-center">ID / Key</div>
          <div className="col-span-5">Descrição</div>
          <div className="col-span-2">Fabricante</div>
          <div className="col-span-1 text-center">Estoque</div>
          <div className="col-span-2 text-right">Preço Venda</div>
          <div className="col-span-1 text-center">Ações</div>
        </div>

        {/* Loader Overlay com a condição atrasada */}
        {showLoader && (
          <div className="absolute inset-0 z-30 grid place-items-center bg-gray-100/50 backdrop-blur-sm">
            <Loader2
              className="absolute animate-spin text-blue-400"
              size={50}
            />
          </div>
        )}

        {resolvedMercadorias.data.length === 0 ? (
          <div className="m-2 flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-12 text-center font-medium text-slate-400">
            <Ban size={60} />
            Nenhuma mercadoria encontrada para os filtros selecionados.
          </div>
        ) : (
          /* Container Virtual - Define a altura total da lista */
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
            className="py-2 lg:py-3" // Espaçamento superior/inferior da lista
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const merc = resolvedMercadorias.data[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement} // Permite alturas dinâmicas caso o conteúdo quebre linha
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="px-2 pb-2 lg:px-3" // Substitui o antigo gap-2 usando paddingBottom
                >
                  <MercadoriaTile mercadoria={merc} usuario={usuario} />
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Footer */}
      <TableFooter
        resolvedMercadorias={resolvedMercadorias}
        scrollRef={parentRef}
      />
    </>
  );
}
