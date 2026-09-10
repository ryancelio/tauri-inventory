import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Toast, ToastType } from "./ToastContext";
import { AnimatePresence, motion } from "motion/react";

export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  pauseToasts: () => void;
  resumeToasts: () => void;
  position?: ToastPosition;
  width?: number;
}

const TYPE_STYLES: Record<
  ToastType,
  {
    bg: string;
    border: string;
    title: string;
    text: string;
    bar: string;
    icon: typeof Info;
  }
> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "text-blue-800",
    text: "text-blue-700",
    bar: "bg-blue-500",
    icon: Info,
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    title: "text-green-800",
    text: "text-green-700",
    bar: "bg-green-500",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    title: "text-red-800",
    text: "text-red-700",
    bar: "bg-red-500",
    icon: XCircle,
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    title: "text-yellow-800",
    text: "text-yellow-700",
    bar: "bg-yellow-500",
    icon: AlertTriangle,
  },
};

const POSITION_CONFIG: Record<
  ToastPosition,
  {
    containerClass: string;
    itemAnchorClass: string;
    centerX: boolean;
    /** -1: stack grows upward (bottom-anchored). 1: stack grows downward (top-anchored). */
    stackSign: 1 | -1;
    /** Horizontal exit offset in px; 0 for centered positions (they fade/settle instead of sliding sideways). */
    exitX: number;
  }
> = {
  "bottom-right": {
    containerClass: "right-4 bottom-4",
    itemAnchorClass: "right-0 bottom-0",
    centerX: false,
    stackSign: -1,
    exitX: 40,
  },
  "bottom-left": {
    containerClass: "left-4 bottom-4",
    itemAnchorClass: "left-0 bottom-0",
    centerX: false,
    stackSign: -1,
    exitX: -40,
  },
  "bottom-center": {
    containerClass: "left-1/2 bottom-4",
    itemAnchorClass: "left-1/2 bottom-0",
    centerX: true,
    stackSign: -1,
    exitX: 0,
  },
  "top-right": {
    containerClass: "right-4 top-4",
    itemAnchorClass: "right-0 top-0",
    centerX: false,
    stackSign: 1,
    exitX: 40,
  },
  "top-left": {
    containerClass: "left-4 top-4",
    itemAnchorClass: "left-0 top-0",
    centerX: false,
    stackSign: 1,
    exitX: -40,
  },
  "top-center": {
    containerClass: "left-1/2 top-4",
    itemAnchorClass: "left-1/2 top-0",
    centerX: true,
    stackSign: 1,
    exitX: 0,
  },
};

const TOAST_MIN_HEIGHT = 76; // px — approximate, used only for the hover fan-out spacing
const MAX_STACK_DEPTH = 3; // toasts beyond this look identical, so a deep queue doesn't collapse to nothing
// The progress bar finishes slightly before the toast actually unmounts, so it
// doesn't appear to "hang" at empty for the length of the exit transition.
const EXIT_TRANSITION_S = 0.18;

export default function ToastContainer({
  toasts,
  onClose,
  pauseToasts,
  resumeToasts,
  position = "bottom-right",
  width = 320,
}: ToastContainerProps) {
  const config = POSITION_CONFIG[position];
  const anchorX: string | number = config.centerX ? "-50%" : 0;

  return (
    <motion.div
      className={`pointer-events-none fixed z-[100] ${config.containerClass}`}
      role="region"
      aria-live="polite"
      aria-label="Notificações"
      whileHover="hover"
      onHoverStart={pauseToasts}
      onHoverEnd={resumeToasts}
    >
      <AnimatePresence>
        {toasts.map((toast, idx) => {
          const style = TYPE_STYLES[toast.type];
          const Icon = style.icon;
          const reverseIndex = toasts.length - 1 - idx;
          const depth = Math.min(reverseIndex, MAX_STACK_DEPTH);

          const restY = config.stackSign * depth * 12;
          const hoverY = config.stackSign * depth * (TOAST_MIN_HEIGHT + 8);
          const scale = Math.max(0.92, 1 - depth * 0.04);
          const opacity = Math.max(0.88, 1 - depth * 0.03);
          const entranceY = -24 * config.stackSign;

          const barDuration = Math.max(
            0,
            (toast.duration - EXIT_TRANSITION_S * 1000) / 1000,
          );

          return (
            <motion.div
              key={toast.id}
              initial={{ x: anchorX, y: entranceY, scale: 0.96, opacity: 0 }}
              animate={{ x: anchorX, y: restY, scale, opacity }}
              variants={{
                hover: { x: anchorX, y: hoverY, scale: 1, opacity: 1 },
              }}
              exit={{
                x: config.centerX ? anchorX : config.exitX,
                opacity: 0,
                scale: 0.96,
              }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ zIndex: 100 + idx, width }}
              className={`pointer-events-auto absolute flex min-h-[76px] flex-col justify-center overflow-hidden rounded-xl border ${style.bg} ${style.border} p-4 shadow-lg ring-1 shadow-black/10 ring-black/5 ${config.itemAnchorClass}`}
            >
              <motion.div
                key={toast.timeoutId}
                className={`absolute top-0 left-0 h-1 w-full ${style.bar}`}
                style={{ transformOrigin: "left" }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: toast.timeoutId === undefined ? 1 : 0 }}
                transition={{ duration: barDuration, ease: "linear" }}
              />

              <button
                onClick={() => onClose(toast.id)}
                aria-label="Fechar notificação"
                className={`absolute top-3 right-3 rounded-full p-0.5 transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none ${style.text}`}
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-2.5 pr-6">
                <Icon size={18} className={`mt-0.5 shrink-0 ${style.text}`} />
                <div className="min-w-0">
                  <h3 className={`text-sm font-semibold ${style.title}`}>
                    {toast.title}
                    {toast.repeatedTimes !== 0 && (
                      <span className="ml-2 font-normal text-black/40">
                        x{toast.repeatedTimes + 1}
                      </span>
                    )}
                  </h3>
                  {toast.message && (
                    <p className={`mt-0.5 text-sm break-words ${style.text}`}>
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
