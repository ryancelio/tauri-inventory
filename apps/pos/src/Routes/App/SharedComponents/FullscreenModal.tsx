import { X } from "lucide-react";
import { motion } from "motion/react";
import { PropsWithChildren, RefObject, useEffect, useRef } from "react";

interface FullscreenModalWrapperProps {
  closeButton?: boolean;
  handleClose: () => void;
  cardWrapperClass?: string;
  focusRef?: RefObject<HTMLElement | null>;
  /** Whether clicking the backdrop closes the modal. Defaults to true. */
  closeOnBackdropClick?: boolean;
  /** Accessible label for screen readers when the content has no visible heading id to reference. */
  ariaLabel?: string;
  /** Use "alertdialog" for interruptive/blocking states (errors, confirmations). Defaults to "dialog". */
  role?: "dialog" | "alertdialog";
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function FullscreenModalWrapper({
  children,
  closeButton,
  handleClose,
  cardWrapperClass,
  focusRef,
  closeOnBackdropClick = true,
  ariaLabel,
  role = "dialog",
}: PropsWithChildren<FullscreenModalWrapperProps>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ESC to close: prefer the caller-provided focusRef (e.g. an input that
  // should own the keydown), falling back to the wrapper itself.
  const handleCloseRef = useRef(handleClose);
  useEffect(() => {
    handleCloseRef.current = handleClose;
  }, [handleClose]);

  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleCloseRef.current();
      }
    };

    if (focusRef) {
      const el = focusRef.current;
      el?.addEventListener("keydown", closeOnEsc);
      el?.focus();
      return () => el?.removeEventListener("keydown", closeOnEsc);
    }

    wrapperRef.current?.focus();
  }, [focusRef]);

  // Trap Tab/Shift+Tab within the modal so focus can't leak to the page behind it.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    card.addEventListener("keydown", handleTabTrap);
    return () => card.removeEventListener("keydown", handleTabTrap);
  }, []);

  // Lock background scroll while the modal is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Restore focus to whatever triggered the modal once it closes.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <motion.div
      ref={wrapperRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          handleClose();
        }
      }}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.3 }}
      className="fixed inset-0 z-50 mt-8 h-full flex items-center justify-center bg-black/40 p-4 outline-none"
      onClick={closeOnBackdropClick ? handleClose : undefined}
    >
      <motion.div
        ref={cardRef}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        initial={{ y: 10, opacity: 0.95 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-lg max-h-full transform overflow-x-hidden overflow-y-auto rounded-3xl border border-white/50 bg-white shadow-2xl transition-colors duration-200 ease-out ${
          cardWrapperClass ?? ""
        }`}
        style={{ maxHeight: "calc(100vh - 2rem)" }}
      >
        {closeButton && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Fechar"
            className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-gray-200 active:scale-95"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
        {children}
      </motion.div>
    </motion.div>
  );
}
