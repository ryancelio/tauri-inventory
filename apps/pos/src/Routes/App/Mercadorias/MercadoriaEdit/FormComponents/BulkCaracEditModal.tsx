import { useMemo, useState } from "react";
import FullscreenModalWrapper from "../../../SharedComponents/FullscreenModal";
import {
  CaracteristicaCreate,
  IMercadoria,
  SimilarMerc,
} from "@tauri-inventory/types";
import CheckboxComponent from "./BASE-UI/Checkbox/Checkbox";
import { updateSimilarMerc } from "../../../../../api/apiMercadoria";

type Caracteristica = { id: number; key: string; value: string };

export default function BulkCaracEditModal({
  onClose,
  caracteristicas,
  similarMercs,
  mercadoria,
}: {
  onClose: () => void;
  caracteristicas: Caracteristica[];
  similarMercs: SimilarMerc[];
  mercadoria: IMercadoria;
}) {
  const caracteristicasFiltradas = useMemo(() => {
    return caracteristicas.filter(
      (carac) => carac.key !== "" && carac.value !== "",
    );
  }, [caracteristicas]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected =
    caracteristicasFiltradas.length > 0 &&
    selectedIds.size === caracteristicasFiltradas.length;

  const selected = useMemo(
    () => caracteristicasFiltradas.filter((c) => selectedIds.has(c.id)),
    [caracteristicasFiltradas, selectedIds],
  );

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev); // never mutate previous state
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds(
      allSelected
        ? new Set()
        : new Set(caracteristicasFiltradas.map((c) => c.id)),
    );
  };

  const onSubmit = async (caracteristicas: CaracteristicaCreate[]) => {
    const ids = similarMercs.map((sm) => sm.id);

    await updateSimilarMerc({
      key: mercadoria.key,
      mercadoria: { caracteristicas },
      selectedIds: ids,
    });
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(selected.map(({ key, value }) => ({ key, value })));
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao atualizar caracteristicas",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FullscreenModalWrapper handleClose={onClose}>
      <div className="flex flex-col gap-3 p-4 pt-5">
        <h1 className="text-xl font-semibold">Alterar caracteristicas</h1>
        <p className="text-sm text-gray-600">
          Selecione as caracteristicas que serão atualizadas em todas as
          mercadorias semelhantes.
        </p>

        {caracteristicasFiltradas.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma caracteristica disponível.
          </p>
        ) : (
          <div className="flex h-96 flex-col gap-2 overflow-y-auto rounded-lg bg-gray-50 p-2 px-3 pb-3 text-gray-700">
            <button
              type="button"
              onClick={toggleAll}
              disabled={isSubmitting}
              className="sticky top-0 z-70 grid grid-cols-10 items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.99]"
            >
              <div className="col-span-2 flex w-full items-center gap-3">
                <CheckboxComponent checked={allSelected} />

                <p className="ml-auto border-r border-r-gray-200 pr-3 text-sm font-semibold text-gray-500">
                  ID
                </p>
              </div>

              <div className="col-span-8 text-left text-sm font-semibold text-gray-500">
                Descrição
              </div>
            </button>

            {caracteristicasFiltradas.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    toggle(c.id);
                  }}
                  className={`grid grid-cols-10 items-center gap-2 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.99] ${
                    isSelected
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  } `}
                >
                  <div className="col-span-2 flex w-full items-center gap-3">
                    <CheckboxComponent checked={isSelected} />

                    <p
                      className={`ml-auto border-r pr-3 text-sm font-medium ${
                        isSelected
                          ? "border-blue-200 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      } `}
                    >
                      {c.key}
                    </p>
                  </div>

                  <p
                    className={`col-span-8 text-sm leading-relaxed ${isSelected ? "text-blue-900" : "text-gray-700"} `}
                  >
                    {c.value}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-sm text-gray-500">
            {selected.length} selecionada(s)
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-red-500 px-3 py-2 text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length === 0 || isSubmitting}
            className="rounded-lg bg-blue-500 px-3 py-2 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
