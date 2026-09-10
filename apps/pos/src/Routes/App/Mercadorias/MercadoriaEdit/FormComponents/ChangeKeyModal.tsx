import { useEffect, useState } from "react";
import { ArrowRightLeft, Check } from "lucide-react";
import { Separator } from "@base-ui/react";
import FullscreenModalWrapper from "../../../SharedComponents/FullscreenModal";
import MercadoriaKeySelect from "./BASE-UI/AutoCompleteDropdown/MercadoriaKeySelect";
import CreateButton from "./CreateButton";
import { useFetcher } from "react-router";
import { useToast } from "../../../../../context/Toast/ToastContext";
import { MercadoriaKeyListing } from "@tauri-inventory/types";

export default function ChangeKeyModal({
  mercKey,
  onClose,
  action,
}: {
  mercKey: number;
  onClose: () => void;
  action: (val: number) => void;
}) {
  const [selectedKey, setSelectedKey] = useState<MercadoriaKeyListing | null>(
    null,
  );

  const fetcher = useFetcher();
  const toaster = useToast();

  useEffect(() => {
    if (fetcher.data) {
      toaster.toast({ title: "Editar Key" });
    }
  }, [fetcher.data]);

  const handleSubmitReassign = () => {
    if (!selectedKey) return;
    action(selectedKey.key);
    onClose();
  };

  const handleAssignNewKey = () => {
    action(-1);
    onClose();
  };

  const handleReset = () => {
    action(mercKey);
    onClose();
  };

  return (
    <FullscreenModalWrapper handleClose={onClose} closeButton>
      <div className="flex min-h-80 flex-col p-4">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            <h1 className="text-lg font-semibold text-gray-900">
              Mudar Variação
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Selecione uma variação existente ou crie uma nova.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <MercadoriaKeySelect
            label="Selecione uma variação existente:"
            placeholder="Selecione um grupo"
            selectedItem={selectedKey}
            onValueChange={setSelectedKey}
            keyAtual={mercKey}
          />

          {/* Painel de confirmação animado */}
          <div
            className={`grid overflow-hidden transition-all duration-300 ease-out ${
              selectedKey !== null
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p className="text-sm text-gray-700">
                  Deseja alterar para:{" "}
                  <span className="font-semibold text-gray-900">
                    {selectedKey?.descricao}
                  </span>
                  <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-xs text-gray-400">
                    Key: {selectedKey?.key}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-end">
            <button
              disabled={!selectedKey}
              onClick={handleSubmitReassign}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all duration-150 ease-out hover:bg-blue-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:active:scale-100"
            >
              Alterar
            </button>
          </div>

          <div className="flex w-full items-center gap-3 px-1 antialiased">
            <Separator
              orientation="horizontal"
              className="h-px grow bg-gray-200"
            />
            <p className="text-xs font-medium tracking-wide text-gray-400">
              OU
            </p>
            <Separator
              orientation="horizontal"
              className="h-px grow bg-gray-200"
            />
          </div>

          <div className="flex w-full items-center justify-between">
            <div>
              <CreateButton
                onClick={handleAssignNewKey}
                label="Criar nova variação"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg bg-red-500 px-3 py-2 text-white hover:brightness-95"
              >
                Voltar ao padrão
              </button>
            </div>
          </div>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
