"use client";
import * as React from "react";
import { Combobox, Separator } from "@base-ui/react";
import { getMercadoriaKeyListing } from "../../../../../../../api/apiHelper";
import { Check, ChevronDown, X } from "lucide-react";
import { MercadoriaKeyListing } from "@tauri-inventory/types";

interface AsyncSearchComboboxProps {
  label?: string;
  placeholder?: string;
  keyAtual?: number;
  textSize?: "large" | "small";
  classNames?: { wrapper?: string; input?: string };
  selectedItem?: MercadoriaKeyListing | null;
  onValueChange?: (item: MercadoriaKeyListing | null) => void;
}

export default function MercadoriaKeySelect({
  label,
  placeholder = "Digite para buscar…",
  textSize = "large",
  classNames,
  selectedItem: controlledSelectedItem,
  onValueChange,
  keyAtual,
}: AsyncSearchComboboxProps) {
  const id = React.useId();

  const [searchResults, setSearchResults] = React.useState<
    MercadoriaKeyListing[]
  >([]);
  const [internalSelectedValue, setInternalSelectedValue] =
    React.useState<MercadoriaKeyListing | null>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const selectedValue =
    controlledSelectedItem !== undefined
      ? controlledSelectedItem
      : internalSelectedValue;

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const trimmedSearchValue = searchValue.trim();

  const items = React.useMemo(() => {
    if (
      !selectedValue ||
      searchResults.some((item) => item.id === selectedValue.id)
    ) {
      return searchResults;
    }
    return [...searchResults, selectedValue];
  }, [searchResults, selectedValue]);

  function getEmptyMessage() {
    if (isPending) return "Buscando…";
    if (error) return error;
    if (trimmedSearchValue === "") return "Digite para buscar…";
    if (searchResults.length === 0) {
      return `Nenhum resultado para "${trimmedSearchValue}".`;
    }
    return null;
  }

  const emptyMessage = getEmptyMessage();

  return (
    <Combobox.Root
      items={items}
      itemToStringLabel={(item: MercadoriaKeyListing) => item.descricao}
      filter={null}
      value={selectedValue}
      onOpenChangeComplete={(open) => {
        if (!open && selectedValue) {
          setSearchResults([selectedValue]);
        }
      }}
      onValueChange={(nextSelectedValue) => {
        if (controlledSelectedItem === undefined) {
          setInternalSelectedValue(nextSelectedValue);
        }
        setSearchValue("");
        setError(null);
        onValueChange?.(nextSelectedValue);
      }}
      onInputValueChange={(nextSearchValue, { reason }) => {
        setSearchValue(nextSearchValue);

        if (nextSearchValue === "") {
          setSearchResults([]);
          setError(null);
          return;
        }

        if (reason === "item-press") {
          return;
        }

        const controller = new AbortController();
        abortControllerRef.current?.abort();
        abortControllerRef.current = controller;

        startTransition(async () => {
          setError(null);
          try {
            const result = await getMercadoriaKeyListing(nextSearchValue);

            if (controller.signal.aborted) return;

            startTransition(() => {
              setSearchResults(result);
            });
          } catch (e) {
            startTransition(() => {
              setSearchResults([]);
              setError("Erro");
            });
          }
        });
      }}
    >
      <div
        className={`relative flex flex-1 flex-col gap-1.5 ${classNames?.wrapper || ""}`}
      >
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-gray-800">
            {label}
          </label>
        )}

        <Combobox.InputGroup className="relative w-full">
          <Combobox.Input
            id={id}
            placeholder={placeholder}
            className={`h-10 w-full rounded-lg border border-gray-300 bg-gray-50 pr-14 pl-3 text-gray-800 placeholder-gray-400 transition-all outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-200 disabled:opacity-70 data-readonly:bg-gray-50 ${textSize == "large" ? "text-lg" : "text-sm"} ${classNames?.input || ""}`}
          />

          <div className="absolute top-0 right-2 flex h-full items-center gap-1 text-gray-500">
            <Combobox.Clear
              aria-label="Limpar seleção"
              className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-500 disabled:hidden data-readonly:hidden"
            >
              <X size={16} strokeWidth={2.5} />
            </Combobox.Clear>

            <Separator
              className="h-3/5 w-px bg-gray-200"
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
            <Combobox.Popup
              className="w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-lg border border-gray-200 bg-white p-1 shadow-lg shadow-black/5 transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
              aria-busy={isPending || undefined}
            >
              <Combobox.Empty>
                {emptyMessage && (
                  <div className="py-4 text-center text-sm text-gray-500">
                    {emptyMessage}
                  </div>
                )}
              </Combobox.Empty>

              <Combobox.List className="custom-scrollbar max-h-[min(15rem,var(--available-height))] overflow-y-auto overscroll-contain outline-none">
                {(item: MercadoriaKeyListing) => (
                  <Combobox.Item
                    disabled={keyAtual !== undefined && item.key == keyAtual}
                    key={item.id}
                    value={item}
                    className={
                      "group flex cursor-pointer grid-cols-10 items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-gray-700 outline-none select-none data-highlighted:bg-blue-100 data-highlighted:font-medium data-highlighted:text-blue-700 data-selected:bg-blue-50 data-selected:font-medium data-selected:text-blue-700 " +
                      " data-disabled:bg-gray-100 data-disabled:text-gray-400 data-disabled:data-highlighted:bg-gray-100 data-disabled:data-highlighted:font-normal data-disabled:data-highlighted:text-gray-400"
                    }
                  >
                    <span className="flex justify-between gap-2">
                      <span className="w-5 text-right font-semibold text-gray-400 data-disabled:text-gray-200">
                        {item.key}
                      </span>
                      <span className="grow border-l border-gray-300 pl-2 capitalize">
                        {item.descricao}
                      </span>
                    </span>

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
  );
}
