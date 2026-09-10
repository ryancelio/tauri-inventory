import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function FullscreenSingleImage({
  image,
  onClose,
}: {
  image: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <>
      {createPortal(
        <motion.div
          ref={containerRef}
          tabIndex={-1}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onClose();
            }
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-130 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm outline-none sm:p-8"
        >
          <motion.img
            src={image}
            alt="Fullscreen image"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
            className="max-h-full max-w-full cursor-auto rounded-2xl object-contain shadow-2xl select-none"
          />
        </motion.div>,
        document.body,
      )}
    </>
  );
}
