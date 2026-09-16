import { useRef, useEffect } from "react";
import FullscreenModalWrapper from "../SharedComponents/FullscreenModal";
import { useFetcher } from "react-router";
import { Loader2, Pencil, Plus, Save } from "lucide-react";
import { IAtributo } from "@tauri-inventory/types";
import { useToast } from "../../../context/Toast/ToastContext";
import UISelect from "../Components/BASE-UI/Select";

const TIPO_OPTIONS: {
  value: IAtributo["tipo"];
  label: string;
  hint: string;
}[] = [
  { value: "text", label: "Texto livre", hint: "Qualquer palavra ou frase" },
  { value: "number", label: "Número", hint: "Somente valores numéricos" },
  { value: "boolean", label: "Sim/Não", hint: "Verdadeiro ou falso" },
];

export default function AddAtributoModal({
  onClose,
  isEdit = false,
  atributo,
}: {
  onClose: () => void;
  isEdit?: boolean;
  atributo?: IAtributo;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const fetcher = useFetcher();
  const toaster = useToast();

  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    if (!fetcher.data) return;
    toaster.toast({
      title: `${isEdit ? "Editar" : "Criar"} atributo`,
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });
    if (fetcher.data.ok) {
      onClose();
    }
  }, [fetcher.data]);

  return (
    <FullscreenModalWrapper handleClose={onClose} closeButton>
      <div className="flex w-full flex-col p-6">
        <div className="mb-6 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isEdit
                ? "bg-blue-50 text-blue-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isEdit ? <Pencil size={18} /> : <Plus size={18} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? "Editar Atributo" : "Adicionar Atributo"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEdit ? (
                <>
                  Alterando{" "}
                  <span className="font-medium text-gray-700">
                    "{atributo?.nome}"
                  </span>
                </>
              ) : (
                "Defina uma nova propriedade para seus itens."
              )}
            </p>
          </div>
        </div>

        {/* Mover os botões para DENTRO do Form é essencial para que o submit funcione nativamente */}
        <fetcher.Form
          className="flex flex-col gap-5"
          action="/gerente/atributos/"
          method={isEdit ? "put" : "post"}
        >
          <input type="hidden" name="id" value={atributo?.id} />
          {/* Campo de Nome */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nome"
              className="text-sm font-semibold text-gray-700"
            >
              Nome do Atributo
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              ref={inputRef}
              autoFocus
              required
              disabled={isSaving}
              defaultValue={atributo?.nome}
              placeholder="Ex: Cor, Peso, Material..."
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Campo de Tipo */}
          <div className="flex flex-col gap-1.5">
            {/* <label
              htmlFor="tipo"
              className="text-sm font-semibold text-gray-700"
            >
              Tipo de Dado
            </label> */}
            <div className="relative">
              {/* <select
                id="tipo"
                name="tipo"
                required
                disabled={isSaving}
                defaultValue={atributo?.tipo}
                className="w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 pr-9 transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {TIPO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select> */}
              <UISelect
                name="tipo"
                label="Tipo de dado"
                items={TIPO_OPTIONS}
                defaultValue={atributo ? {label: atributo.tipo, value: atributo.tipo} : undefined}
                className="h-10"
              />
            </div>
            {isEdit && (
              <p className="mt-0.5 text-xs text-amber-600">
                Alterar o tipo pode afetar valores já cadastrados com este
                atributo.
              </p>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:outline-none active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex min-w-27.5 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </FullscreenModalWrapper>
  );
}
