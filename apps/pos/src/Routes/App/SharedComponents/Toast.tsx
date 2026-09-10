import { X, Info, CheckCircle, AlertTriangle } from "lucide-react";
import React, { useEffect, useState, ReactNode } from "react";

export type ToastType = "info" | "success" | "error";

interface ToastProps {
  title: string;
  text: string;
  type?: ToastType;
  icon?: ReactNode;
  onClose: () => void;
  duration?: number;
}

const typeIcons = {
  info: <Info className="h-6 w-6 text-blue-500" />,
  success: <CheckCircle className="h-6 w-6 text-green-500" />,
  error: <AlertTriangle className="h-6 w-6 text-red-500" />,
};

const typeStyles = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "text-blue-800",
    text: "text-blue-700",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    title: "text-green-800",
    text: "text-green-700",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    title: "text-red-800",
    text: "text-red-700",
  },
};

export const Toast: React.FC<ToastProps> = ({
  title,
  text,
  type = "info",
  icon,
  onClose,
  duration = 5000,
}) => {
  const [isShowing, setIsShowing] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIsShowing(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Trigger close after duration
  useEffect(() => {
    if (duration === Infinity) return;

    const exitTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(exitTimer);
  }, [duration]);

  const handleClose = () => {
    setIsShowing(false);
    Toast;
    // Unmount after animation
    setTimeout(() => onClose(), 400); // Should match transition duration
  };

  const styles = typeStyles[type];
  const finalIcon = icon || typeIcons[type];

  // Base classes for styling and transition
  const baseClasses =
    "fixed w-11/12 max-w-sm rounded-xl shadow-lg border transition-all duration-300 ease-in-out z-90";

  // Positioning classes for mobile and desktop
  const positionClasses =
    "bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0";

  // Animation classes based on state
  const animationClasses = isShowing
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-4";

  return (
    <div
      className={`${baseClasses} ${positionClasses} ${animationClasses} ${styles.bg} ${styles.border}`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0">{finalIcon}</div>
        <div className="min-w-0 flex-1">
          <h3 className={`text-md font-bold ${styles.title}`}>{title}</h3>
          <p className={`mt-1 text-sm wrap-break-word ${styles.text}`}>
            {text}
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={handleClose}
            className={`-m-1.5 rounded-full p-1.5 transition-colors hover:bg-black/10 ${styles.text}`}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
