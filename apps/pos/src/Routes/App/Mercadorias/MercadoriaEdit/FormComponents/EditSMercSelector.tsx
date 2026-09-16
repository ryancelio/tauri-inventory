import { useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { IMercadoria, SimilarMerc } from "@tauri-inventory/types";
import FullscreenInfoModal from "../../../SharedComponents/InfoModal";
import { Check, Minus } from "lucide-react";
import { useToast } from "../../../../../context/Toast/ToastContext";
import CheckboxComponent from "./BASE-UI/Checkbox/Checkbox";

export default function EditSMercSelector({
  similarMerc,
  onClose,
  precoCusto,
  precoVenda,
  mercadoria,
}: {
  similarMerc: SimilarMerc[];
  precoCusto: string;
  precoVenda: string;
  onClose: (value: boolean) => void;
  mercadoria: IMercadoria;
}) {
  const fetcher = useFetcher();

  const [selectedIds, setSelectedIds] = useState<string[]>([
    mercadoria.id.toString(),
  ]);
  const [updateVenda, setUpdateVenda] = useState(true);
  const [updateCusto, setUpdateCusto] = useState(true);

  // const [internalCusto, setInternalCusto] = useState(Number(precoCusto));
  // const [internalVenda, setInternalVenda] = useState(Number(precoVenda));

  const isAllSelected =
    similarMerc.length > 0 && selectedIds.length === similarMerc.length;

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([mercadoria.id.toString()]);
    } else {
      setSelectedIds(similarMerc.map((s) => s.id.toString()));
    }
  };

  const toaster = useToast();

  function handlePrecoKeySubmitConfirm() {
    fetcher.submit(
      {
        precoVenda: updateVenda ? precoVenda : null,
        precoCusto: updateCusto ? precoCusto : null,
        updateVenda: updateVenda,
        updateCusto: updateCusto,
        key: mercadoria.key,
        selectedIds: selectedIds,
      },
      {
        action: "/gerente/mercadorias/update-precos",
        method: "POST",
      },
    );

    onClose(false);
  }

  useEffect(() => {
    if (!fetcher.data) {
      return;
    }
    toaster.toast({
      title: "Editar Mercadorias",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });
    if (fetcher.data.ok) {
      onClose(false);
    }
  }, [fetcher.data]);

  const noPriceSelected = !updateVenda && !updateCusto;

  return (
    <FullscreenInfoModal
      title="Confirmar Alteração"
      information={`Alterar as seguintes mercadorias? - Key: ${mercadoria.key}`}
      onClose={() => onClose(false)}
      actionLabel="Confirmar"
      action={handlePrecoKeySubmitConfirm}
      actionDisabled={noPriceSelected || selectedIds.length === 0}
    >
      <div className="rounded-2xl border border-gray-100 bg-gray-50">
        <div className="flex w-full justify-center gap-3 p-1">
          <div className="flex items-center">
            <CheckboxComponent
              label="Custo"
              checked={updateCusto}
              onChange={setUpdateCusto}
            />
          </div>
          <div className="flex items-center">
            <CheckboxComponent
              label="Venda"
              checked={updateVenda}
              onChange={setUpdateVenda}
            />
            {/* <MoneyInput value={internalVenda} onChange={(e) => setInternalVenda(e)} disabled={!updateVenda}/> */}
          </div>

          {/* <button
            onClick={() => setUpdateCusto(!updateCusto)}
            className="flex items-center gap-1"
          >
            <ModernCheckbox checked={updateCusto} />
          </button> */}
        </div>

        {noPriceSelected && (
          <p className="px-3 pb-1 text-center text-xs text-red-500">
            Selecione ao menos um tipo de preço para atualizar.
          </p>
        )}

        <div className="flex h-72 flex-col gap-2 overflow-y-auto p-2 px-3 pb-3 text-gray-700">
          {/* HEADER */}
          <button
            type="button"
            onClick={handleSelectAll}
            className="sticky top-0 z-70 grid grid-cols-10 items-center gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-[0.99]"
          >
            <div className="col-span-2 flex w-full items-center gap-3">
              <ModernCheckbox checked={isAllSelected} />

              <p className="ml-auto border-r border-r-gray-200 pr-3 text-sm font-semibold text-gray-500">
                ID
              </p>
            </div>

            <div className="col-span-8 text-left text-sm font-semibold text-gray-500">
              Descrição
            </div>
          </button>

          {/* ITEMS */}
          {similarMerc.map((sMerc) => {
            const checked = selectedIds.includes(sMerc.id.toString());
            const isMainMerc = sMerc.id === mercadoria.id;
            return (
              <button
                key={sMerc.id}
                type="button"
                onClick={() => {
                  if (isMainMerc) return;
                  toggleItem(sMerc.id.toString());
                }}
                className={`grid grid-cols-10 items-center gap-2 rounded-2xl border p-3 text-left transition-all duration-200 active:scale-[0.99] ${
                  isMainMerc
                    ? "border-cmblue/40 bg-cmblue/8 shadow-sm"
                    : checked
                      ? "border-blue-200 bg-blue-50 shadow-sm"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                } `}
              >
                <div className="col-span-2 flex w-full items-center gap-3">
                  <ModernCheckbox checked={checked} main={isMainMerc} />

                  <p
                    className={`ml-auto border-r pr-3 text-sm font-medium ${
                      isMainMerc
                        ? "border-cmblue text-cmblue brightness-80"
                        : checked
                          ? "border-blue-200 text-blue-700"
                          : "border-gray-200 text-gray-600"
                    } `}
                  >
                    {sMerc.id}
                  </p>
                </div>

                <p
                  className={`col-span-8 text-sm leading-relaxed ${isMainMerc ? "text-cmblue brightness-80" : checked ? "text-blue-900" : "text-gray-700"} `}
                >
                  {sMerc.descricao}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </FullscreenInfoModal>
  );
}

function ModernCheckbox({
  checked,
  main,
}: {
  checked: boolean;
  main?: boolean;
}) {
  return (
    <div
      className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
        main
          ? "border-cmblue bg-cmblue shadow-sm shadow-cmblue"
          : checked
            ? "border-blue-500 bg-blue-500 shadow-sm shadow-blue-200"
            : "border-gray-300 bg-white"
      } `}
    >
      {main ? (
        <Minus
          size={16}
          className={`transition-all duration-200 ${checked ? "scale-100 text-white opacity-100" : "scale-75 opacity-0"} `}
        />
      ) : (
        <Check
          size={16}
          className={`transition-all duration-200 ${checked ? "scale-100 text-white opacity-100" : "scale-75 opacity-0"} `}
          strokeWidth={3}
        />
      )}
    </div>
  );
}
