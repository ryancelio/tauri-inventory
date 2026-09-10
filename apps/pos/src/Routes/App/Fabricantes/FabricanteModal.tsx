import { IFabricante } from "@tauri-inventory/types";
import { Loader2 } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { FetcherWithComponents, useFetcher } from "react-router";
import FullscreenModalWrapper from "../SharedComponents/FullscreenModal";
import FullscreenInfoModal from "../SharedComponents/InfoModal";
import { useToast } from "../../../context/Toast/ToastContext";

export default function FabricanteModal({
  onClose,
  mode,
  fabricante,
}: {
  onClose: () => void;
  mode: "edit" | "create";
  fabricante?: IFabricante;
}) {
  const fetcher = useFetcher();
  const actionData = fetcher.data;
  const toaster = useToast();

  const isSaving = fetcher.state !== "idle";
  const method = mode === "edit" ? "PUT" : "POST";
  const toastTitle = mode === "edit" ? "Editar" : "Criar";

  useEffect(() => {
    console.log(method);
  }, [mode]);

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData) {
      toaster.toast({
        title: `${toastTitle} Fabricante`,
        message: actionData.response,
        type: actionData.ok ? "success" : "error",
      });
      if (actionData.ok) onClose();
    }
  }, [actionData]);

  if (mode === "edit" && !fabricante) {
    return <div>Erro Interno ao selecionar fabricante para editar</div>;
  }
  function handleSubmit() {
    console.log("Called");
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);

    fetcher.submit(formData, {
      action: "/gerente/fabricantes",
      method: method,
    });
  }
  return (
    <FullscreenInfoModal
      onClose={onClose}
      title={mode === "edit" ? "Editar Fabricante" : "Criar Fabricante"}
      action={() => handleSubmit()}
      actionLabel={toastTitle}
      focusElement={inputRef}
      fetcher={fetcher}
    >
      <fetcher.Form
        onClick={(e) => e.stopPropagation()}
        ref={formRef}
        method={method}
        action={"/gerente/fabricantes"}
        className="flex w-full flex-col gap-4 bg-white p-6 duration-200"
      >
        <input type="hidden" name="id" value={fabricante?.id} />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-700">Nome</label>
          <input
            type="text"
            name="nome"
            ref={inputRef}
            defaultValue={mode === "edit" ? fabricante?.nome : undefined}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="Nome do fabricante"
            autoFocus
          />
        </div>
      </fetcher.Form>
    </FullscreenInfoModal>
  );
}
