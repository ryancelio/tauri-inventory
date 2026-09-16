import { useEffect, useMemo, useRef, useState } from "react";
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
    bg: "bg-sky-50",
    border: "border-sky-200",
    title: "text-sky-900",
    text: "text-sky-700",
    bar: "bg-sky-500",
    icon: Info,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "text-emerald-900",
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    icon: CheckCircle2,
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    title: "text-rose-900",
    text: "text-rose-700",
    bar: "bg-rose-500",
    icon: XCircle,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "text-amber-900",
    text: "text-amber-700",
    bar: "bg-amber-500",
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
    /** Horizontal exit offset in px; 0 for centered positions (they fade instead of sliding). */
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

/** Vertical gap (px) between consecutive toasts while resting (the "peek"
 *  stack). Small so older toasts appear as a barely-visible pile. */
const REST_GAP = 10;
/** Vertical gap (px) between consecutive toasts once the stack is hovered.
 *  Combined with measured per-toast heights this keeps even spacing even
 *  when a toast carries a long, multi-line message. */
const HOVER_GAP = 12;
/** Fallback height used before a toast has been measured (first frame). */
const DEFAULT_TOAST_HEIGHT = 72;
/** Approximate timing (s) of the exit transition — used to finish the progress
 *  bar just before the toast unmounts so it never "hangs" at zero. */
const EXIT_TRANSITION_S = 0.2;
/** Grace period before the stack collapses after the pointer leaves, so
 *  briefly crossing the small gap between toasts doesn't flicker. */
const LEAVE_GRACE_MS = 150;

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

  const [isHovered, setIsHovered] = useState(false);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const leaveTimer = useRef<number | null>(null);

  // Prune stale measurements so the map stays bounded by the visible stack.
  useEffect(() => {
    setHeights((prev) => {
      const ids = new Set(toasts.map((t) => t.id));
      const cleaned = Object.fromEntries(
        Object.entries(prev).filter(([id]) => ids.has(id)),
      );
      return Object.keys(cleaned).length === Object.keys(prev).length
        ? prev
        : cleaned;
    });
  }, [toasts]);

  useEffect(
    () => () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    },
    [],
  );

  // Pre-compute real heights per toast so the hover fan-out spaces toasts by
  // their *actual* size instead of assuming a fixed height.
  const offsets = useMemo(() => {
    const list: number[] = [];
    let acc = 0;
    for (let i = toasts.length - 1; i >= 0; i--) {
      // acc = cumulative height + gap of every toast further from the anchor
      list[i] = acc;
      acc += (heights[toasts[i].id] ?? DEFAULT_TOAST_HEIGHT) + HOVER_GAP;
    }
    return list;
  }, [toasts, heights]);

  const handleEnter = () => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setIsHovered(true);
    pauseToasts();
  };

  const handleLeave = () => {
    if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      leaveTimer.current = null;
      setIsHovered(false);
      resumeToasts();
    }, LEAVE_GRACE_MS);
  };

  return (
    <div
      className={`pointer-events-none fixed z-[100] ${config.containerClass}`}
      role="region"
      aria-live="polite"
      aria-label="Notificações"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <AnimatePresence>
        {toasts.map((toast, idx) => {
          const style = TYPE_STYLES[toast.type];
          const Icon = style.icon;
          const reverseIndex = toasts.length - 1 - idx;
          const depth = reverseIndex;

          // Resting position: compact, evenly-piled stack.
          const restY = config.stackSign * depth * REST_GAP;

          // Hover position: evenly spaced by *measured* heights, so a tall
          // toast no longer breaks the gap between its neighbours.
          const hoverY = config.stackSign * offsets[idx];

          const y = isHovered ? hoverY : restY;
          const scale = isHovered ? 1 : 1 - depth * 0.025;
          const opacity = isHovered ? 1 : 1 - depth * 0.06;

          // Slide in from just off the anchor edge, then settle into place.
          const entranceY = -config.stackSign * 24;

          const barDuration = Math.max(
            0,
            (toast.duration - EXIT_TRANSITION_S * 1000) / 1000,
          );

          return (
            <motion.div
              key={toast.id}
              ref={(el) => {
                if (!el) return;
                const h = el.offsetHeight;
                setHeights((prev) =>
                  prev[toast.id] === h ? prev : { ...prev, [toast.id]: h },
                );
              }}
              initial={{ x: anchorX, y: entranceY, scale: 0.94, opacity: 0 }}
              animate={{ x: anchorX, y, scale, opacity }}
              exit={{
                x: config.centerX ? anchorX : config.exitX,
                opacity: 0,
                scale: 0.94,
                transition: { duration: EXIT_TRANSITION_S, ease: "easeIn" },
              }}
              transition={{
                x: { type: "spring", stiffness: 500, damping: 36, mass: 0.9 },
                y: { type: "spring", stiffness: 420, damping: 32, mass: 0.9 },
                scale: { type: "spring", stiffness: 420, damping: 30 },
                opacity: { duration: 0.18, ease: "easeOut" },
              }}
              style={{ zIndex: 100 + idx, width }}
              className={`pointer-events-auto absolute flex min-h-[72px] flex-col justify-center overflow-hidden rounded-xl border ${style.bg} ${style.border} p-4 shadow-lg ring-1 shadow-black/8 ring-black/5 backdrop-blur-sm ${config.itemAnchorClass}`}
            >
              {/* ── Progress bar ── */}
              <motion.div
                key={toast.timeoutId}
                className={`absolute top-0 left-0 h-[3px] w-full ${style.bar}`}
                style={{ transformOrigin: "left" }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: toast.timeoutId === undefined ? 1 : 0 }}
                transition={{ duration: barDuration, ease: "linear" }}
              />

              {/* ── Close button ── */}
              <button
                onClick={() => onClose(toast.id)}
                aria-label="Fechar notificação"
                className={`absolute top-2.5 right-2.5 rounded-md p-1 transition-colors hover:bg-black/8 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none ${style.text}`}
              >
                <X size={14} strokeWidth={2.5} />
              </button>

              {/* ── Content ── */}
              <div className="flex items-start gap-2.5 pr-5">
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={`mt-0.5 shrink-0 ${style.text}`}
                />
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-[13px] font-semibold leading-snug ${style.title}`}
                  >
                    {toast.title}
                    {toast.repeatedTimes > 0 && (
                      <span className="ml-1.5 font-medium text-black/30">
                        ×{toast.repeatedTimes + 1}
                      </span>
                    )}
                  </h3>
                  {toast.message && (
                    <p
                      className={`mt-0.5 text-[12.5px] leading-relaxed break-words ${style.text}`}
                    >
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}