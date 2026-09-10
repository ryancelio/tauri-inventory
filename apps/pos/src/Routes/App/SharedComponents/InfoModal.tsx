import { TriangleAlert, Info, X, Loader2 } from "lucide-react";
import React, { useEffect, useState, useRef, useCallback } from "react";
import FullscreenModalWrapper from "./FullscreenModal";
import { FetcherWithComponents } from "react-router";
import { useToast } from "../../../context/Toast/ToastContext";

export default function FullscreenInfoModal({
  title,
  information,
  infoElement,
  caution,
  onClose,
  action,
  actionLabel,
  children,
  fetcher,
  autoClose = true,
  actionDisabled = false,
  focusElement,
}: {
  title: string;
  information?: string;
  infoElement?: React.ReactNode;
  children?: React.ReactNode;
  caution?: boolean;
  onClose: () => void;
  actionLabel?: string;
  action?: () => void | Promise<any>;
  fetcher?: FetcherWithComponents<any>;
  autoClose?: boolean;
  actionDisabled?: boolean;
  focusElement?: React.RefObject<any>;
}) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [actionClicked, setActionClicked] = useState(false);
  const [isAsyncLoading, setIsAsyncLoading] = useState(false);
  // const toaster = useToast();

  const isFetcherLoading = fetcher ? fetcher.state !== "idle" : false;
  const isLoading = isFetcherLoading || isAsyncLoading;

  useEffect(() => {
    if (fetcher?.state === "submitting" && actionClicked) {
      setHasSubmitted(true);
    }
  }, [fetcher?.state, actionClicked]);

  const actionRef = actionLabel ? useRef<HTMLButtonElement>(null) : undefined;
  useEffect(() => {
    if (focusElement !== undefined) {
      focusElement.current.focus();
    } else {
      actionRef?.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (hasSubmitted && fetcher?.state === "idle") {
      if (fetcher.data) {
        // toaster.toast({
        //   title: title,
        //   message: fetcher.data.response,
        // });
        if (fetcher.data.ok) {
          onClose();
        } else {
          setHasSubmitted(false);
          setActionClicked(false);
        }
      }
    }
  }, [fetcher?.state, fetcher?.data, onClose, hasSubmitted]);

  const handleAction = async () => {
    setActionClicked(true);
    if (action) {
      const res = action();
      if (res instanceof Promise) {
        setIsAsyncLoading(true);
        await res;
        if (autoClose) {
          onClose();
        }
      }
    }
  };

  const theme = caution
    ? {
        icon: <TriangleAlert className="h-6 w-6 text-red-500" />,
        badge: "bg-red-50 text-red-700 border-red-200",
        primaryButton:
          "bg-red-500 not-disabled:hover:bg-red-600 not-disabled:focus:ring-red-300",
      }
    : {
        icon: <Info className="h-6 w-6 text-blue-500" />,
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        primaryButton:
          "bg-green-500 not-disabled:hover:bg-green-600 not-disabled:focus:ring-green-300",
      };

  return (
    <FullscreenModalWrapper handleClose={onClose} closeButton>
      <div className="px-6 pt-6 pb-1">
        {information && (
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${theme.badge} `}
          >
            {theme.icon}
            {caution ? "Atenção" : "Informação"}
          </div>
        )}

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>

        <div className="mt-3 text-[15px] leading-relaxed text-gray-600">
          {infoElement ? infoElement : <p className="">{information}</p>}
        </div>
      </div>

      {/* CONTENT */}
      {children && <div className={`h-full px-2 pb-2`}>{children}</div>}

      {/* FOOTER */}
      <div className="mt-2 flex flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-5 sm:flex-row">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          autoFocus={actionLabel === undefined}
          tabIndex={0}
          className="h-11 rounded-xl border border-gray-200 bg-white px-5 font-medium text-gray-700 transition-all hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 focus:outline-none active:scale-[0.98]"
        >
          {actionLabel ? "Cancelar" : "Fechar"}
        </button>

        {actionLabel && (
          <button
            ref={actionRef}
            autoFocus
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleAction();
            }}
            disabled={isLoading || actionDisabled}
            type="button"
            className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 font-semibold text-white shadow-lg shadow-black/5 transition-all focus:ring-4 focus:outline-none not-disabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 ${theme.primaryButton} `}
          >
            {isLoading && actionClicked && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            {actionLabel}
          </button>
        )}
      </div>
    </FullscreenModalWrapper>
  );
}
