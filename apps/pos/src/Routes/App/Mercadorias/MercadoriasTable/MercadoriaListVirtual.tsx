import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ApiListResponse,
  ILoja,
  IMercadoria,
  UsuarioLogado,
} from "@tauri-inventory/types";
import { useRef, useState, useEffect, PropsWithChildren } from "react";
import { useNavigation, useSearchParams } from "react-router";
import MercadoriaTile from "./TableInternalComp/MercTile/MercadoriaTile";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import TableFooter from "./TableInternalComp/Footer";

/** `sortBy` está apontando para uma das formas de estoque? (`estoqueTotal` ou `estoque.<lojaId>`) */
function ehSortDeEstoque(sortBy: string | null): boolean {
  return sortBy === "estoqueTotal" || (sortBy?.startsWith("estoque.") ?? false);
}

/**
 * Cabeçalho clicável da coluna "Estoque".
 *
 * - clique no rótulo -> alterna ASC/DESC no escopo atual (começa em
 *   `estoqueTotal DESC`, o que puxa os produtos com mais estoque para o topo);
 * - setinha ao lado -> escolhe o escopo: total ou uma loja específica
 *   (`estoque.<lojaId>`).
 *
 * `sortBy`/`sortOrder` vivem na URL, então a ordenação sobrevive a troca de
 * página, filtro e recarregar.
 */
function CabecalhoEstoque({ lojas }: { lojas: ILoja[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");
  const ehEstoque = ehSortDeEstoque(sortBy);

  // Sem `sortOrder` válido assume DESC — que é também o ponto de partida do
  // primeiro clique.
  const ordemAtual: "ASC" | "DESC" = sortOrder === "ASC" ? "ASC" : "DESC";
  const proximaOrdem: "ASC" | "DESC" =
    ehEstoque && ordemAtual === "DESC" ? "ASC" : "DESC";
  // No menu, trocar de loja mantém a direção que já está valendo.
  const ordemDoMenu: "ASC" | "DESC" = ehEstoque ? ordemAtual : "DESC";

  // Escopo que o clique no rótulo alterna: o que já está ativo, ou o total
  // quando a lista está ordenada por outra coluna.
  const escopoAtivo = ehEstoque && sortBy ? sortBy : "estoqueTotal";
  const escopoDeLoja = escopoAtivo.startsWith("estoque.")
    ? escopoAtivo.slice("estoque.".length)
    : null;
  const nomeEscopoDeLoja =
    escopoDeLoja &&
    (lojas.find((loja) => String(loja.id) === escopoDeLoja)?.nome ??
      escopoDeLoja);

  const aplicar = (novoSortBy: string, novaOrdem: "ASC" | "DESC") => {
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", novoSortBy);
    params.set("sortOrder", novaOrdem);
    // Recomeça na primeira página: manter a página antiga mostraria um pedaço
    // arbitrário da nova sequência.
    params.delete("page");
    setSearchParams(params);
    setMenuAberto(false);
  };

  // Fecha o menu quando o clique é fora dele.
  useEffect(() => {
    if (!menuAberto) return;

    const cliqueFora = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node))
        setMenuAberto(false);
    };
    document.addEventListener("pointerdown", cliqueFora);
    return () => document.removeEventListener("pointerdown", cliqueFora);
  }, [menuAberto]);

  return (
    <div
      ref={menuRef}
      className="group relative flex items-center justify-center gap-0.5"
    >
      <button
        type="button"
        onClick={() => aplicar(escopoAtivo, proximaOrdem)}
        title={
          nomeEscopoDeLoja
            ? `Ordenar pelo estoque da loja ${nomeEscopoDeLoja}`
            : "Ordenar pelo estoque total"
        }
        className={`flex items-center gap-1 tracking-normal uppercase transition-colors ${
          ehEstoque ? "text-slate-800" : "hover:text-slate-800"
        }`}
      >
        Estoque
        {ehEstoque ? (
          ordemAtual === "ASC" ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </button>

      <button
        type="button"
        onClick={() => setMenuAberto((aberto) => !aberto)}
        aria-label="Escolher a loja da ordenação por estoque"
        aria-expanded={menuAberto}
        title="Ordenar por uma loja específica"
        className={`rounded p-0.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-800 focus-visible:opacity-100 ${
          nomeEscopoDeLoja ? "text-blue-600!" : ""
        }`}
      >
        <ChevronDown
          size={13}
          className={`transition-transform ${menuAberto && "rotate-180"}`}
        />
      </button>

      {menuAberto && (
        <div className="absolute top-full right-0 z-40 mt-1 min-w-48 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Ordenar estoque por
          </div>
          {[{ id: null, nome: "Total (todas as lojas)" }, ...lojas].map(
            (escopo) => {
              const valor =
                escopo.id === null ? "estoqueTotal" : `estoque.${escopo.id}`;
              const ativo = escopoAtivo === valor;

              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() => aplicar(valor, ordemDoMenu)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-slate-50 ${
                    ativo ? "font-semibold text-slate-800" : "text-slate-600"
                  }`}
                >
                  <span className="flex-1 truncate">
                    {escopo.id === null ? escopo.nome : `Loja ${escopo.nome}`}
                  </span>
                  {ativo && <Check size={13} className="text-blue-600" />}
                </button>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function FilteringHeader({
  children,
  sortBy,
  className,
}: PropsWithChildren<{ sortBy: string; className?: string }>) {
  const [searchParams, setSearchParams] = useSearchParams();

  function setOrderFilter() {
    const prevSortBy = searchParams.get("sortBy");
    const prevSortOrder = searchParams.get("sortOrder");

    const changedSortBy = prevSortBy !== null && prevSortBy !== sortBy;

    let sortOrder: "DESC" | "ASC" = "DESC";
    const params = new URLSearchParams(searchParams);

    // DESC -> ASC -> NULL
    if (changedSortBy || prevSortBy === null) {
      sortOrder = "DESC";
    } else {
      if (prevSortOrder === "DESC") {
        sortOrder = "ASC";
      } else if (prevSortOrder === "ASC") {
        params.delete("page");
        params.delete("sortBy");
        params.delete("sortOrder");
        setSearchParams(params);
        return;
      }
    }

    params.set("sortOrder", sortOrder);
    params.set("sortBy", sortBy);
    params.delete("page");
    setSearchParams(params);
  }

  const sortOrder = searchParams.get("sortOrder");
  const currentSortBy = searchParams.get("sortBy");
  const isCurrentSort = currentSortBy !== null && sortBy === currentSortBy;

  const CurrentArrow = isCurrentSort
    ? sortOrder === "ASC"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <div
      onClick={() => setOrderFilter()}
      className={`group flex items-center gap-0.5 select-none ${className}`}
    >
      {children}
      <div>
        <CurrentArrow
          size={12}
          className={`text-slate-400 transition-colors group-hover:text-slate-800 group-hover:opacity-100 ${!isCurrentSort && "opacity-40"}`}
        />
      </div>
    </div>
  );
}

export default function MercadoriaListVirtual({
  resolvedMercadorias,
  usuario,
  lojas,
}: {
  resolvedMercadorias: ApiListResponse<IMercadoria>;
  usuario: UsuarioLogado;
  lojas: ILoja[];
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
          <div className="col-span-1 flex justify-center divide-x divide-slate-300 text-center *:px-1.5">
            <FilteringHeader sortBy={"id"}>ID</FilteringHeader>
            <FilteringHeader sortBy="key">Key</FilteringHeader>
          </div>
          <div className="col-span-5">
            <FilteringHeader sortBy="descricao">Descrição</FilteringHeader>
          </div>
          <div className="col-span-2">Fabricante</div>
          <div className="col-span-1 text-center">
            <CabecalhoEstoque lojas={lojas} />
          </div>
          <div className="col-span-2 text-right">
            <FilteringHeader className="justify-end" sortBy="precoVenda">
              Preço Venda
            </FilteringHeader>
          </div>
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
                  <MercadoriaTile
                    mercadoria={merc}
                    usuario={usuario}
                    lojas={lojas}
                  />
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
