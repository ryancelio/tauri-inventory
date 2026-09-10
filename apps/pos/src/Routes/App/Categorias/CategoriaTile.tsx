import {
  GrupoCategorias,
  ICategoria,
  UsuarioLogado,
} from "@tauri-inventory/types";
import { Tags, Check, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { DragEventHandler, Ref, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  FetcherWithComponents,
  useFetcher,
  useRevalidator,
} from "react-router";
import { useToast } from "../../../context/Toast/ToastContext";

function CatTileGhost({
  cat,
  ref,
}: {
  cat: GrupoCategorias;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      style={{
        transform: `scale(${1.1 / window.devicePixelRatio})`,
        transformOrigin: "top left",
      }}
      className="pointer-events-none fixed top-0 left-0 -z-50 h-14 w-fit bg-transparent opacity-40"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <Tags size={18} className="text-blue-600" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">
            {cat.nome}
          </p>

          <p className="text-xs text-slate-500">Arrastar para um grupo</p>
        </div>
      </div>
    </div>
  );
}

export default function CategoriaTile({
  cat,
  isEditing,
  grupoId,
  isEditingDisabled,
  editAction,
  deleteAction,
  isNew = false,
  close,
  usuario,
}: {
  cat: GrupoCategorias;
  grupoId?: number;
  isEditing?: boolean;
  isEditingDisabled?: boolean;
  editAction?: (val: GrupoCategorias | null) => void;
  deleteAction?: (val: GrupoCategorias | null) => void;
  isNew?: boolean;
  close?: () => void;
  usuario: UsuarioLogado;
}) {
  const ghostRef = useRef<HTMLDivElement>(null);

  const fetcher = useFetcher();
  const toaster = useToast();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (!fetcher.data) return;

    toaster.toast({
      title: isNew ? "Criar Categoria" : "Editar Categoria",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });

    if (fetcher.data.ok && close) {
      close();
      revalidator.revalidate();
    }
  }, [fetcher.data]);

  const handleDragStart: DragEventHandler<HTMLDivElement> = (e) => {
    const preview = ghostRef.current;
    if (!preview) {
      return;
    }

    e.dataTransfer.setDragImage(preview, 10, 10);
    e.dataTransfer.setData("catId", cat.id.toString());
    e.dataTransfer.setData("catNome", cat.nome.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <>
      {!isNew && <CatTileGhost cat={cat} ref={ghostRef} />}
      <div
        key={cat.id}
        draggable={!isNew && !isEditingDisabled}
        onDragStart={handleDragStart}
        className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all select-none focus-within:border-blue-500 hover:border-slate-300 hover:shadow-sm focus-within:hover:border-blue-600 active:border-blue-500 [&.is-dragging]:cursor-grabbing"
        onDoubleClick={() => {
          if (usuario.funcao === "vendedor") return;
          if (!isNew && editAction) {
            editAction(cat);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className={`${!isNew && !isEditingDisabled ? "cursor-grab" : ""} rounded-xl bg-slate-100 p-3 transition-all group-hover:bg-slate-200`}
          >
            <Tags size={18} className="text-slate-700" />
          </div>
          {!isNew && (
            <div className="font-semibold text-neutral-400/40">#{cat.id}</div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-medium text-slate-800">
              {isEditing || isNew ? (
                <fetcher.Form
                  className="flex gap-2"
                  action="/gerente/categorias"
                  method={isNew ? "POST" : "PUT"}
                  id="update-form"
                >
                  <input
                    form="update-form"
                    type="hidden"
                    name="id"
                    value={cat.id}
                  />
                  {isNew && grupoId && (
                    <input type="hidden" name="grupoId" value={grupoId} />
                  )}
                  <input
                    form="update-form"
                    type="text"
                    name="nome"
                    autoFocus
                    className="border-b-2 border-slate-200 transition-colors focus:border-blue-500 focus:ring-0"
                    defaultValue={cat.nome}
                  />
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      className="rounded-lg p-1 text-green-500 transition-all hover:bg-green-100"
                    >
                      {fetcher.state === "idle" ? (
                        <Check />
                      ) : (
                        <Loader2 className="animate-spin" />
                      )}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-1 text-red-600 transition-all hover:bg-red-50"
                      onClick={() => {
                        if (!isNew && editAction) {
                          editAction(null);
                        } else if (close) {
                          close();
                        }
                      }}
                    >
                      <X />
                    </button>
                  </div>
                </fetcher.Form>
              ) : (
                cat.nome
              )}
            </h2>
          </div>

          {!isEditingDisabled && !isNew && (
            <div className="flex gap-1">
              <button
                className="rounded-xl p-2 text-slate-600 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => {
                  if (!editAction) return;
                  editAction(cat);
                }}
              >
                <Pencil size={19} />
              </button>
              <button
                className="rounded-xl p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-red-700"
                type="button"
                onClick={() => {
                  if (!deleteAction) return;
                  deleteAction(cat);
                }}
              >
                <Trash2 size={19} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
