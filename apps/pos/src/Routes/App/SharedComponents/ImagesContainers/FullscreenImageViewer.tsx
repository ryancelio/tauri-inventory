import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useCarouselImages, type CarouselGroup } from "./useCarouselImages";

export default function FullscreenImageViewer({
  onClose,
  itemGroups,
  initialPhotoId,
}: {
  onClose: () => void;
  itemGroups: CarouselGroup[];
  initialPhotoId?: number | string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInfinite = true;

  const { images, groups, loading } = useCarouselImages(itemGroups);

  const lastIndex = images.length - 1;

  const [index, setIndex] = useState(0);
  const initialIndexApplied = useRef(false);

  const safeIndex = Math.min(index, Math.max(0, lastIndex));

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Abre já no slide da foto clicada, assim que os paths resolvidos chegam.
  // Layout effect evita um frame mostrando a foto 0 antes de pular.
  useLayoutEffect(() => {
    if (initialIndexApplied.current || images.length === 0) return;

    initialIndexApplied.current = true;

    if (initialPhotoId == null) return;

    const found = images.findIndex(
      (image) => String(image.id) === String(initialPhotoId),
    );

    if (found >= 0) setIndex(found);
  }, [images, initialPhotoId]);

  // Protege contra a lista mudando de tamanho enquanto o modal está aberto
  // (ex: foto deletada por outra aba/instância)
  useEffect(() => {
    if (index < 0 || index > lastIndex) {
      setIndex(Math.max(0, lastIndex));
    }
  }, [lastIndex, index]);

  // Se nada pôde ser carregado, fecha em vez de deixar o modal "travado".
  useEffect(() => {
    if (!loading && images.length === 0) onClose();
  }, [loading, images.length, onClose]);

  function nextIndex() {
    if (lastIndex < 0) return;

    if (index === lastIndex) {
      if (isInfinite) setIndex(0);
      return;
    }
    setIndex((prev) => prev + 1);
  }

  function prevIndex() {
    if (lastIndex < 0) return;

    if (index === 0) {
      if (isInfinite) setIndex(lastIndex);
      return;
    }
    setIndex((prev) => prev - 1);
  }

  if (!loading && images.length === 0) return null;

  const current = images[safeIndex];
  const currentGroup = current ? groups[current.groupIndex] : undefined;
  const hasMultipleGroups =
    new Set(images.map((image) => image.groupIndex)).size > 1;

  return createPortal(
    <motion.div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        } else if (e.key === "ArrowRight") {
          e.stopPropagation();
          nextIndex();
        } else if (e.key === "ArrowLeft") {
          e.stopPropagation();
          prevIndex();
        }
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-120 flex flex-col bg-black/90 outline-none select-none"
      onClick={() => onClose()}
    >
      <button
        type="button"
        className="absolute top-10 right-4 z-50 cursor-pointer rounded-full bg-white/10 p-2 text-white transition-colors outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Fechar"
      >
        <X size={24} />
      </button>

      {!current ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white/80" />
        </div>
      ) : (
        <>
          {/* Badge do grupo atual */}
          {hasMultipleGroups && currentGroup && (
            <span className="absolute top-10 left-4 z-50 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
              {currentGroup.label}
            </span>
          )}

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute top-1/2 left-4 z-50 -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-all outline-none hover:scale-110 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  prevIndex();
                }}
                title="Anterior"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                type="button"
                className="absolute top-1/2 right-4 z-50 -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-all outline-none hover:scale-110 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  nextIndex();
                }}
                title="Próxima"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="relative flex w-full flex-1 items-center justify-center overflow-hidden"
          >
            <div
              className="flex h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{ transform: `translateX(-${safeIndex * 100}%)` }}
            >
              {images.map((item) => (
                <div
                  key={`${item.groupIndex}-${item.id}`}
                  className="flex h-full w-full shrink-0 items-center justify-center p-4 pb-28 sm:p-12"
                >
                  <img
                    src={item.src}
                    alt="Imagem em tela cheia"
                    className="h-full max-w-full cursor-default rounded-xl object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {images.length > 1 && (
            <div
              className="custom-scrollbar absolute bottom-0 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 gap-3 overflow-x-auto rounded-2xl bg-black/50 p-3 opacity-30 transition-opacity duration-300 ease-out hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((item, idx) => (
                <button
                  key={`${item.groupIndex}-${item.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(idx);
                  }}
                  className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:h-20 md:w-20 ${
                    idx === safeIndex
                      ? "scale-105 border-blue-500 opacity-100 shadow-lg"
                      : "border-transparent opacity-50 hover:scale-105 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.thumbSrc}
                    alt={`Miniatura ${idx + 1}`}
                    className="h-full w-full bg-gray-500/70 object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>,
    document.body,
  );
}
