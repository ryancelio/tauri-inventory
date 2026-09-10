import { Loader2, Trash2 } from "lucide-react";
import { GrupoCategorias, ICategoria } from "@tauri-inventory/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useToast } from "../../../context/Toast/ToastContext";
import FullscreenModalWrapper from "../SharedComponents/FullscreenModal";
import AutoCompleteDropdown, {
  Item,
} from "../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { getCategoriaMercCount, getCategorias } from "../../../api/apiHelper";
import { AnimatePresence, motion } from "motion/react";

export function CategoriaDeleteModal({
  onClose,
  categoria,
}: {
  onClose: () => void;
  categoria: GrupoCategorias;
}) {
  const toaster = useToast();
  const fetcher = useFetcher();

  const [categoriasList, setCategoriasList] = useState<ICategoria[]>([]);
  const [catMercCount, setCatMercCount] = useState<number | null>(null);
  const [selectedDestino, setSelectedDestino] = useState<Item | null>(null);
  const [loadError, setLoadError] = useState(false);

  const focusRef = useRef<HTMLInputElement>(null);

  const isSaving = fetcher.state !== "idle";
  const isLoadingInfo = catMercCount === null && !loadError;

  useEffect(() => {
    const load = async () => {
      try {
        const [mercCount, categoriaList] = await Promise.all([
          getCategoriaMercCount(categoria.id),
          getCategorias(),
        ]);
        setCatMercCount(mercCount);
        setCategoriasList(categoriaList);
      } catch (e: any) {
        setLoadError(true);
        toaster.toast({
          title: "Deletar Categoria",
          message:
            e?.message?.response ||
            "Erro ao carregar informações da categoria.",
          type: "error",
        });
      }
    };
    load();
  }, [categoria.id]);

  useEffect(() => {
    if (!fetcher.data) return;
    toaster.toast({
      title: "Deletar Categoria",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });
    if (fetcher.data.ok) {
      onClose();
    }
  }, [fetcher.data]);

  const categoriaItemMap = useMemo(
    () =>
      categoriasList
        .filter((cat) => cat.id !== categoria.id)
        .map((cat) => ({ label: cat.nome, value: cat.id })),
    [categoriasList, categoria.id],
  );

  const hasItemsToTransfer = (catMercCount ?? 0) > 0;
  const noDestinationAvailable =
    hasItemsToTransfer && categoriaItemMap.length === 0;
  const canSubmit =
    !isSaving &&
    !isLoadingInfo &&
    !loadError &&
    !noDestinationAvailable &&
    (!hasItemsToTransfer || !!selectedDestino);

  return (
    <FullscreenModalWrapper
      handleClose={onClose}
      focusRef={focusRef}
      closeButton
      role="alertdialog"
      ariaLabel="Deletar categoria"
      cardWrapperClass="max-w-md"
    >
      <fetcher.Form
        className="flex flex-col p-6"
        action="/gerente/categorias"
        method="DELETE"
      >
        <input type="hidden" name="id" value={categoria.id} />
        {hasItemsToTransfer && (
          <input
            type="hidden"
            name="destinoCategoriaId"
            value={selectedDestino?.value ?? ""}
          />
        )}

        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Deletar Categoria
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Você está prestes a apagar{" "}
              <span className="font-medium text-gray-700">
                "{categoria.nome}"
              </span>
              . Essa ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoadingInfo ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
            >
              <Loader2 size={15} className="animate-spin" />
              Verificando mercadorias associadas...
            </motion.div>
          ) : loadError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              Não foi possível carregar as informações desta categoria.
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              {hasItemsToTransfer ? (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                    <span className="font-semibold">{catMercCount}</span>{" "}
                    {catMercCount === 1
                      ? "mercadoria está associada a esta categoria. Selecione para onde ela deve ser transferida."
                      : "mercadorias estão associadas a esta categoria. Selecione para onde elas devem ser transferidas."}
                  </div>

                  {noDestinationAvailable ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                      Não há outra categoria disponível para transferir estas
                      mercadorias. Crie uma nova categoria antes de deletar
                      esta.
                    </div>
                  ) : (
                    <AutoCompleteDropdown
                      items={categoriaItemMap}
                      label="Categoria para transferir"
                      inputRef={focusRef}
                      placeholder="Selecione a categoria"
                      selectedItem={selectedDestino}
                      setSelectedItem={setSelectedDestino}
                      required
                      disabled={isSaving}
                    />
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                  Esta categoria não possui mercadorias associadas.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:outline-none active:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex min-w-42.5 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {isSaving
              ? "Processando..."
              : hasItemsToTransfer
                ? "Transferir e Deletar"
                : "Deletar Categoria"}
          </button>
        </div>
      </fetcher.Form>
    </FullscreenModalWrapper>
  );
}
