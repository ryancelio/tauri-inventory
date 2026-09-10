import {
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToastContext } from "../contexts";
import ToastContainer, { ToastPosition } from "./ToastContainer";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  timeoutId: number | undefined;
  duration: number;
  repeatedTimes: number;
}

export type ToastConfig = Required<Pick<Toast, "title">> &
  Partial<Omit<Toast, "id" | "timeoutId" | "title" | "repeatedTimes">>;

type ToastConfigWithoutType = Omit<ToastConfig, "type">;

export interface ToastContextValue {
  toast: (options: ToastConfig) => void;
  success: (options: ToastConfigWithoutType) => void;
  error: (options: ToastConfigWithoutType) => void;
  info: (options: ToastConfigWithoutType) => void;
  warning: (options: ToastConfigWithoutType) => void;
}

interface ToastProviderProps extends PropsWithChildren {
  /** Corner/edge of the screen the stack renders in. Defaults to "bottom-right". */
  position?: ToastPosition;
  /** Oldest toast is dropped once this many are on screen at once. Defaults to 5. */
  maxToasts?: number;
  /** Width of each toast card in px. Defaults to 320. */
  width?: number;
}

export default function ToastProvider({
  children,
  position = "bottom-right",
  maxToasts = 5,
  width = 320,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Tracks whether the stack is currently paused (hovered), so toasts
  // created or refreshed *while* paused don't sneak in a live timer that
  // would remove them out from under the user mid-hover.
  const isPausedRef = useRef(false);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => {
      const toastToRemove = current.find((toast) => toast.id === id);
      if (toastToRemove?.timeoutId) {
        window.clearTimeout(toastToRemove.timeoutId);
      }
      return current.filter((toast) => toast.id !== id);
    });
  }, []);

  const toast = useCallback(
    ({ duration = 5000, type = "info", ...toastData }: ToastConfig) => {
      setToasts((curr) => {
        const existing = curr.find(
          (t) =>
            t.title === toastData.title &&
            t.message === toastData.message &&
            t.type === type,
        );

        if (existing) {
          if (existing.timeoutId) window.clearTimeout(existing.timeoutId);

          const timeoutId = isPausedRef.current
            ? undefined
            : window.setTimeout(() => removeToast(existing.id), duration);

          return curr.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  repeatedTimes: t.repeatedTimes + 1,
                  timeoutId,
                  duration,
                }
              : t,
          );
        }

        const id = crypto.randomUUID();
        const timeoutId = isPausedRef.current
          ? undefined
          : window.setTimeout(() => removeToast(id), duration);

        const newToast: Toast = {
          ...toastData,
          id,
          timeoutId,
          type,
          duration,
          repeatedTimes: 0,
        };

        // Cap the stack: drop the oldest toast, clearing its timer so it
        // doesn't fire later against a toast that's already gone.
        if (curr.length >= maxToasts) {
          const [oldest, ...rest] = curr;
          if (oldest.timeoutId) window.clearTimeout(oldest.timeoutId);
          return [...rest, newToast];
        }

        return [...curr, newToast];
      });
    },
    [removeToast, maxToasts],
  );

  const success = useCallback(
    (options: ToastConfigWithoutType) => toast({ ...options, type: "success" }),
    [toast],
  );
  const error = useCallback(
    (options: ToastConfigWithoutType) => toast({ ...options, type: "error" }),
    [toast],
  );
  const info = useCallback(
    (options: ToastConfigWithoutType) => toast({ ...options, type: "info" }),
    [toast],
  );
  const warning = useCallback(
    (options: ToastConfigWithoutType) => toast({ ...options, type: "warning" }),
    [toast],
  );

  const pauseToasts = useCallback(() => {
    isPausedRef.current = true;
    setToasts((curr) => {
      curr.forEach((t) => {
        if (t.timeoutId) window.clearTimeout(t.timeoutId);
      });
      return curr.map((t) => ({ ...t, timeoutId: undefined }));
    });
  }, []);

  const resumeToasts = useCallback(() => {
    isPausedRef.current = false;
    setToasts((curr) =>
      curr.map((t) =>
        t.timeoutId
          ? t
          : {
              ...t,
              timeoutId: window.setTimeout(() => removeToast(t.id), t.duration),
            },
      ),
    );
  }, [removeToast]);

  const value = useMemo(
    () => ({ toast, success, error, info, warning }),
    [toast, success, error, info, warning],
  );

  return (
    <ToastContext value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
        pauseToasts={pauseToasts}
        resumeToasts={resumeToasts}
        position={position}
        width={width}
      />
    </ToastContext>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside a Toast Provider");
  }

  return context;
}
