import { Combobox, Separator } from "@base-ui/react";
import { Check, ChevronDown, X } from "lucide-react";
import React, { useEffect, useId, useRef, useState } from "react";
import FullscreenInfoModal from "../../../../../SharedComponents/InfoModal";
import { FetcherWithComponents } from "react-router";

export interface Item {
  label: string; // Text Value
  value: number | string | null; // Item's ID
}

type DropdownItem = Item & { isCreatable?: boolean; inputValue?: string };

// Estendemos Combobox.Root.Props extraindo as propriedades que gerenciamos internamente no wrapper
interface AutoCompleteDropdownProps extends Omit<
  Combobox.Root.Props<DropdownItem>,
  "items" | "value" | "defaultValue" | "onValueChange"
> {
  items: Item[];
  classNames?: { wrapper?: string; input?: string };
  // Uncontrolled
  defaultValue?: Item;
  onValueChange?: (selectedItem: Item | null) => void;

  placeholder?: string;

  // Controlled
  selectedItem?: Item | null;
  setSelectedItem?: (item: Item | null) => void;

  label?: string;
  creationFetcher?: FetcherWithComponents<any>;
  emptyMessage?: string;
  textSize?: "large" | "small";

  // Creation
  createNew?: () => Promise<void> | void;
  createForm?: ({ defaultValue }: { defaultValue: string }) => React.ReactNode;
}

export default function AutoCompleteDropdown({
  items,
  classNames,
  defaultValue,
  onValueChange,
  label,
  selectedItem,
  setSelectedItem,
  placeholder,
  textSize = "large",
  emptyMessage = "Nenhum item encontrado",
  createNew,
  createForm,
  creationFetcher,
  ...comboboxProps
}: AutoCompleteDropdownProps) {
  const id = useId();

  // Used when uncontrolled
  const [internalSelectedItem, setInternalSelectedItem] = useState<Item | null>(
    defaultValue || null,
  );

  // Controlled quando o caller fornece um setter — essa é a intenção explícita
  // de controlar o valor. `selectedItem` pode ser `null`/`undefined` (nada
  // selecionado) e ainda assim operar no modo controlado. Checar apenas
  // `selectedItem !== undefined` fazia o componente cair silenciosamente no
  // modo uncontrolled quando o valor controlado estava vazio, fazendo o
  // `setSelectedItem` nunca ser chamado (e.g. filtros de URL que dependiam
  // dele). Normalizamos `undefined` para `null` porque ambos significam
  // "nada selecionado" e o Combobox precisa de um valor controlado definido.
  const isControlled = setSelectedItem !== undefined;
  const [currentSelectedItem, setCurrentSelectedItem] = isControlled
    ? [selectedItem ?? null, setSelectedItem]
    : [internalSelectedItem, setInternalSelectedItem];

  const [showCreationModal, setShowCreationModal] = useState<string | null>(
    null,
  );

  const [inputValue, setInputValue] = useState(
    currentSelectedItem?.label || "",
  );
  const firstRender = useRef(true);

  useEffect(() => {
    setInputValue(currentSelectedItem?.label || "");
    if (firstRender.current) {
      firstRender.current = false;
    } else {
      onValueChange?.(currentSelectedItem);
    }
  }, [currentSelectedItem]);

  const trimmedInput = inputValue.trim();
  const loweredInput = trimmedInput.toLocaleLowerCase();
  const exactExists = items.some(
    (item) => item.label.trim().toLocaleLowerCase() === loweredInput,
  );

  const itemsForView: DropdownItem[] =
    trimmedInput !== "" && !exactExists && createNew
      ? [
          ...items,
          {
            label: `Criar ${trimmedInput}`,
            value: -1,
            isCreatable: true,
            inputValue: trimmedInput,
          },
        ]
      : items;

  return (
    <>
      {createNew && showCreationModal && (
        <FullscreenInfoModal
          onClose={() => setShowCreationModal(null)}
          title={`Criar ${label}`}
          action={() => createNew()}
          actionLabel="Criar"
          autoClose
          fetcher={creationFetcher}
        >
          {createForm && createForm({ defaultValue: showCreationModal })}
        </FullscreenInfoModal>
      )}
      <Combobox.Root
        items={itemsForView}
        value={currentSelectedItem}
        inputValue={inputValue}
        onInputValueChange={(val, details) => {
          if (details?.reason === "item-press" && val.startsWith("Criar ")) {
            setCurrentSelectedItem?.(null);
            return;
          }
          setInputValue(val);
        }}
        defaultValue={defaultValue}
        isItemEqualToValue={(itemValue: DropdownItem, value) =>
          itemValue.value === value.value
        }
        onValueChange={(item) => {
          // Create new Flow
          if (item?.isCreatable && createNew && item.inputValue) {
            setCurrentSelectedItem?.(null);
            setShowCreationModal(item.inputValue);
            return;
          }

          // Normal Flow
          setCurrentSelectedItem(item);
        }}
        {...comboboxProps} // Repassa as demais propriedades herdadas
      >
        {/* Wrapper */}
        <div
          className={`relative flex flex-1 flex-col gap-1.5 ${classNames?.wrapper || ""}`}
        >
          {/* Renderiza a label apenas se ela for fornecida */}
          {label && (
            <label htmlFor={id} className="text-sm font-semibold text-gray-800">
              {label}
            </label>
          )}

          <Combobox.InputGroup className="relative w-full">
            <Combobox.Input
              id={id}
              className={`h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pr-14 pl-3 text-gray-800 placeholder-gray-400 transition-all outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-200 disabled:opacity-70 data-readonly:bg-gray-50 ${textSize == "large" ? "text-lg" : "text-sm"} ${classNames?.input}`}
              placeholder={placeholder}
            />

            {/* Container de Ícones (Alinhamento centralizado com divisor) */}
            <div className="absolute top-0 right-2 flex h-full items-center gap-1 text-gray-500">
              {!comboboxProps.disabled && !comboboxProps.readOnly && (
                <Combobox.Clear
                  aria-label="Limpar seleção"
                  className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-500 disabled:hidden data-readonly:hidden"
                >
                  <X size={16} strokeWidth={2.5} />
                </Combobox.Clear>
              )}

              <Separator
                className={"h-3/5 w-px bg-gray-200"}
                orientation="vertical"
              />

              <Combobox.Trigger
                aria-label="Abrir popup"
                className="flex h-6 w-6 items-center justify-center rounded-md transition-transform hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed data-popup-open:rotate-180"
              >
                <ChevronDown size={16} strokeWidth={2.5} />
              </Combobox.Trigger>
            </div>
          </Combobox.InputGroup>

          <Combobox.Portal>
            <Combobox.Positioner className="z-110 outline-none" sideOffset={6}>
              <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-lg border border-gray-200 bg-white p-1 shadow-lg shadow-black/5 transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                <Combobox.Empty>
                  <div className="py-4 text-center text-sm text-gray-500">
                    {emptyMessage}
                  </div>
                </Combobox.Empty>

                <Combobox.List className="custom-scrollbar max-h-[min(15rem,var(--available-height))] overflow-y-auto overscroll-contain outline-none">
                  {(item: Item) => (
                    <Combobox.Item
                      key={item.value}
                      value={item}
                      // Utilizamos 'group' para poder modificar o ícone de Check baseado no estado do Item
                      className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-gray-700 outline-none select-none data-highlighted:bg-blue-100 data-highlighted:font-medium data-highlighted:text-blue-700 data-selected:bg-blue-50 data-selected:font-medium data-selected:text-blue-700"
                    >
                      <span className="capitalize">{item.label}</span>

                      {/* O Indicador fica invisível e só aparece quando o item tem data-selected */}
                      <Combobox.ItemIndicator className="text-blue-600 opacity-0 group-data-selected:opacity-100">
                        <Check size={16} strokeWidth={3} />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </div>
      </Combobox.Root>
    </>
  );
}
