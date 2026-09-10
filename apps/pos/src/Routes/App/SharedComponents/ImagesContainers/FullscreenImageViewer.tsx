import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { CarouselGroup } from "./ImageCarousel"; // reaproveitando o tipo, deleteAction fica só sem uso aqui

interface FlatPhoto {
  photo: CarouselGroup["items"][number];
  group: CarouselGroup;
}

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

  const flatItems = useMemo(() => {
    const result: FlatPhoto[] = [];
    itemGroups.forEach((group) => {
      group.items.forEach((photo) => {
        result.push({ photo, group });
      });
    });
    return result;
  }, [itemGroups]);

  const lastIndex = flatItems.length - 1;

  // Abre já no slide da foto que foi clicada, não sempre no índice 0
  const [index, setIndex] = useState(() => {
    if (initialPhotoId == null) return 0;
    const found = flatItems.findIndex((f) => f.photo.id === initialPhotoId);
    return found >= 0 ? found : 0;
  });

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Protege contra itemGroups mudando de tamanho enquanto o modal está aberto
  // (ex: foto deletada por outra aba/instância)
  useEffect(() => {
    if (index > lastIndex) {
      setIndex(Math.max(0, lastIndex));
    }
  }, [lastIndex, index]);

  function nextIndex() {
    if (index === lastIndex) {
      if (isInfinite) setIndex(0);
      return;
    }
    setIndex((prev) => prev + 1);
  }

  function prevIndex() {
    if (index === 0) {
      if (isInfinite) setIndex(lastIndex);
      return;
    }
    setIndex((prev) => prev - 1);
  }

  if (flatItems.length === 0) return null;

  const current = flatItems[index];

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
      className="fixed inset-0 z-120 flex flex-col bg-black/90 backdrop-blur-sm outline-none select-none"
      onClick={() => onClose()}
    >
      <button
        type="button"
        className="absolute top-10 right-4 z-50 cursor-pointer rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors outline-none hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="Fechar"
      >
        <X size={24} />
      </button>

      {/* Badge do grupo atual */}
      {itemGroups.length > 1 && (
        <span className="absolute top-10 left-4 z-50 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
          {current.group.label}
        </span>
      )}

      {flatItems.length > 1 && (
        <>
          <button
            type="button"
            className="absolute top-1/2 left-4 z-50 -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all outline-none hover:scale-110 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
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
            className="absolute top-1/2 right-4 z-50 -translate-y-1/2 cursor-pointer rounded-full bg-white/10 p-3 text-white backdrop-blur-md transition-all outline-none hover:scale-110 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"
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
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {flatItems.map((item) => (
            <div
              key={`${item.group.label}-${item.photo.id}`}
              className="flex h-full w-full shrink-0 items-center justify-center p-4 pb-28 sm:p-12"
            >
              <img
                src={`${item.group.baseUrl}/${item.photo.url}`}
                alt="Imagem em tela cheia"
                className="h-full max-w-full cursor-default rounded-xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {flatItems.length > 1 && (
        <div
          className="custom-scrollbar absolute bottom-0 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 gap-3 overflow-x-auto rounded-2xl bg-black/50 p-3 opacity-30 backdrop-blur-md transition-opacity duration-300 ease-out hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {flatItems.map((item, idx) => (
            <button
              key={`${item.group.label}-${item.photo.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(idx);
              }}
              className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:h-20 md:w-20 ${
                idx === index
                  ? "scale-105 border-blue-500 opacity-100 shadow-lg"
                  : "border-transparent opacity-50 hover:scale-105 hover:opacity-100"
              }`}
            >
              <img
                src={`${item.group.baseUrl}/thumb/${item.photo.url}`}
                alt={`Miniatura ${idx + 1}`}
                className="h-full w-full bg-gray-500/70 object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body,
  );
}
