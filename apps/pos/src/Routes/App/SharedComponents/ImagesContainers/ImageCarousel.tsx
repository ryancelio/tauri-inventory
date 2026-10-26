import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import FullscreenInfoModal from "../InfoModal";
import { useFetcher } from "react-router";
import FullscreenSingleImage from "./FullscreenSingleImage";
import { useToast } from "../../../../context/Toast/ToastContext";
import { AnimatePresence } from "motion/react";
import { useCarouselImages, type CarouselGroup } from "./useCarouselImages";

export type { CarouselGroup } from "./useCarouselImages";

export default function ImageCarousel({
  itemGroups,
  infiniteScroll = true,
}: {
  itemGroups: CarouselGroup[];
  infiniteScroll?: boolean;
}) {
  const { images, groups } = useCarouselImages(itemGroups);

  const lastIndex = images.length - 1;
  const [index, setIndex] = useState(0);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const fetcher = useFetcher();
  const toaster = useToast();

  // itemGroups pode mudar de composição sem o usuário interagir
  // (ex: trocou a cor selecionada) — proteção contra índice fora do range.
  useEffect(() => {
    if (index > lastIndex) {
      setIndex(Math.max(0, lastIndex));
    }
  }, [lastIndex, index]);

  const current = images[index];
  const currentGroup = current ? groups[current.groupIndex] : undefined;
  const hasMultipleGroups =
    new Set(images.map((image) => image.groupIndex)).size > 1;

  function nextIndex() {
    if (index === lastIndex) {
      if (infiniteScroll) setIndex(0);
      return;
    }
    setIndex((prev) => prev + 1);
  }

  function prevIndex() {
    if (index === 0) {
      if (infiniteScroll) setIndex(lastIndex);
      return;
    }
    setIndex((prev) => prev - 1);
  }

  function setSafeIndexOnDelete() {
    setIndex((prev) => (prev === 0 ? 0 : prev - 1));
  }

  // Mantido async para o FullscreenInfoModal fechar ao concluir a ação
  // (ele só faz autoClose quando `action()` devolve uma Promise).
  async function handleDeletePhoto() {
    if (!current || !currentGroup?.deleteAction) return;

    fetcher.submit(
      { id: current.id },
      {
        action: currentGroup.deleteAction,
        method: "DELETE",
        encType: "application/json",
      },
    );
  }

  useEffect(() => {
    if (!fetcher.data) return;

    toaster.toast({
      title: "Deletar Foto",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });

    if (fetcher.data.ok) {
      setSafeIndexOnDelete();
    }
  }, [fetcher.data, toaster]);

  if (images.length === 0) return null;

  return (
    <>
      <AnimatePresence>
        {confirmDeleteModal && currentGroup?.deleteAction && (
          <FullscreenInfoModal
            information="Deseja mesmo deletar a imagem?"
            onClose={() => setConfirmDeleteModal(false)}
            title="Deletar"
            caution
            actionLabel="Deletar"
            action={() => handleDeletePhoto()}
          />
        )}
        {fullscreenImage && (
          <FullscreenSingleImage
            image={fullscreenImage}
            onClose={() => setFullscreenImage(null)}
          />
        )}
      </AnimatePresence>

      <div
        className="flex h-full w-full flex-col-reverse gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 md:flex-row"
        tabIndex={0}
        onKeyDown={({ key }) => {
          if (key === "ArrowRight") nextIndex();
          if (key === "ArrowLeft") prevIndex();
        }}
      >
        {/* Thumbs, com cabeçalho de grupo (só na coluna vertical/desktop) */}
        <div className="custom-scrollbar flex aspect-square h-20 shrink-0 items-center justify-start gap-2 overflow-x-auto pb-2 md:h-full md:w-20 md:flex-col md:overflow-y-auto md:pr-2 md:pb-0">
          {images.map((item, idx) => {
            const groupLabel = groups[item.groupIndex]?.label;
            const isFirstOfGroup =
              idx === 0 || images[idx - 1].groupIndex !== item.groupIndex;

            return (
              <div
                key={`${item.groupIndex}-${item.id}`}
                className="contents md:block md:w-full"
              >
                {isFirstOfGroup && (
                  <span
                    className={`hidden shrink-0 truncate px-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase md:block ${
                      idx !== 0 ? "md:pt-2" : ""
                    }`}
                  >
                    {groupLabel}
                  </span>
                )}
                <button
                  type="button"
                  className={`relative aspect-square h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all duration-200 outline-none md:h-16 md:w-full ${
                    idx === index
                      ? "border-blue-500 shadow-sm ring-2 ring-blue-500/20"
                      : "border-slate-200/60 opacity-60 hover:border-blue-300 hover:opacity-100"
                  }`}
                  onClick={() => setIndex(idx)}
                  aria-label={`Ir para imagem ${idx + 1}${groupLabel ? ` (${groupLabel})` : ""}`}
                >
                  <img
                    src={item.thumbSrc}
                    className="aspect-square h-full w-full object-contain p-1"
                    alt={`Miniatura ${idx + 1}${groupLabel ? ` (${groupLabel})` : ""}`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Full Images */}
        <div className="group relative aspect-video grow overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
          <ul
            className="flex h-full transition-transform duration-550 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((item, idx) => (
              <li
                key={`${item.groupIndex}-${item.id}`}
                className="relative flex h-full w-full shrink-0 items-center justify-center"
              >
                <img
                  className="h-full w-full object-contain"
                  loading={idx === 0 ? "eager" : "lazy"}
                  src={item.src}
                  alt="Foto da mercadoria"
                  onDoubleClick={() => setFullscreenImage(item.src)}
                />
              </li>
            ))}
          </ul>

          {/* Badge indicando a que grupo a imagem atual pertence */}
          {hasMultipleGroups && currentGroup && (
            <span className="absolute top-3 left-3 rounded-full bg-slate-900/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {currentGroup.label}
            </span>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full border border-slate-200/60 bg-white/80 p-2 text-slate-700 opacity-0 shadow-sm backdrop-blur-sm transition-all outline-none group-hover:opacity-100 hover:scale-105 hover:bg-white focus:opacity-100 active:scale-95"
                onClick={() => prevIndex()}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-slate-200/60 bg-white/80 p-2 text-slate-700 opacity-0 shadow-sm backdrop-blur-sm transition-all outline-none group-hover:opacity-100 hover:scale-105 hover:bg-white focus:opacity-100 active:scale-95"
                onClick={() => nextIndex()}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Só mostra deletar se o grupo atual expõe deleteAction */}
          {currentGroup?.deleteAction && (
            <button
              type="button"
              className="absolute top-3 right-3 rounded-xl border border-slate-200/60 bg-white/80 p-2 text-slate-600 opacity-0 shadow-sm backdrop-blur-sm transition-all outline-none group-hover:opacity-100 hover:scale-105 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:opacity-100 active:scale-95"
              onClick={() => setConfirmDeleteModal(true)}
              title="Deletar Imagem"
            >
              <Trash2 size={18} />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-900/40 px-3 py-2 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {images.map((item, idx) => (
                <button
                  key={`${item.groupIndex}-${item.id}`}
                  className={`rounded-full transition-all duration-300 outline-none ${
                    idx === index
                      ? "h-1.5 w-4 bg-white"
                      : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  onClick={() => setIndex(idx)}
                  type="button"
                  title={`Ir para imagem ${idx + 1}`}
                  aria-label={`Ir para imagem ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
