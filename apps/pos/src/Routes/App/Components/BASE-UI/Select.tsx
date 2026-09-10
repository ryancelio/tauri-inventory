import * as React from "react";
import { Select, SelectItem, SelectRootProps } from "@base-ui/react/select";
import { CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Item } from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

export type UISelectProps = Omit<
  SelectRootProps<Item["value"], false>,
  "items" | "value" | "defaultValue" | "onValueChange"
> & {
  label?: string;
  labelLeft?: boolean;
  placeholder?: string;
  items: Item[];
  className?: string;
  allowEmpty?: boolean;
  value?: Item | null;        // controlado — objeto Item
  defaultValue?: Item | null; // não-controlado — objeto Item
  onValueChange?: (item: Item | null) => void;
};

export default function UISelect({
  label,
  labelLeft,
  placeholder = "Selecione...",
  items,
  className = "",
  allowEmpty = false,
  onValueChange,
  value,
  defaultValue,
  ...props
}: UISelectProps): React.JSX.Element {
  const internalItems: Item[] = allowEmpty
    ? [{ value: null, label: placeholder }, ...items]
    : items;

  const isControlled = value !== undefined;

  // estado interno só é usado no modo não-controlado, e guarda o primitivo
  const [internalValue, setInternalValue] = React.useState<Item["value"]>(
    defaultValue?.value ?? null,
  );

  const rawValue = isControlled ? (value?.value ?? null) : internalValue;

  const handleValueChange = (val: Item["value"]) => {
    if (!isControlled) setInternalValue(val);
    const found = internalItems.find((i) => i.value === val) ?? null;
    onValueChange?.(found);
  };

  return (
    <div className="w-full items-start">
      <Select.Root
        items={internalItems}
        value={rawValue}
        onValueChange={handleValueChange}
        {...props}
      >
        <div className={`flex ${labelLeft ? "flex-row" : "flex-col"} h-full items-center gap-2`}>

        {label && (
          <Select.Label className="cursor-default text-sm text-nowrap text-center justify-center items-center h-full font-semibold text-slate-800">
            {label}
          </Select.Label>
        )}

        <Select.Trigger
          className={`flex h-9.5 w-full min-w-40 items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-all hover:not-data-disabled:border-gray-400 focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none disabled:border-gray-200 data-disabled:bg-slate-100 data-disabled:text-slate-500 ${className}`}
        >
          <Select.Value className="data-placeholder:text-slate-500" placeholder={placeholder} />
          <Select.Icon className="transition-all duration-500 ease-out data-popup-open:rotate-x-180">
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Select.Icon>
        </Select.Trigger>
        </div>

        <Select.Portal>
          <Select.Positioner className="z-220 outline-hidden select-none" sideOffset={4} alignItemWithTrigger={false}>
            <Select.Popup className="group min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-800 shadow-lg outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <Select.ScrollUpArrow className="z-1 flex h-4 w-full cursor-default items-center justify-center bg-white text-slate-500">
                <ChevronUp className="h-4 w-4" />
              </Select.ScrollUpArrow>

              <Select.List className="relative max-h-(--available-height) scroll-py-6 overflow-y-auto p-1">
                {internalItems.map(({ label, value }, index) => (
                  <Select.Item
                    key={String(value) + index}
                    value={value}
                    className={`grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 rounded-md py-1.5 pr-4 pl-2.5 text-sm outline-hidden select-none data-highlighted:bg-slate-100 data-selected:bg-blue-50 data-selected:font-medium data-selected:text-blue-700 ${value === null && "bg-transparent! text-gray-400! hover:bg-gray-50!"}`}
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <CheckIcon className="h-4 w-4 text-blue-500" />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2">{label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>

              <Select.ScrollDownArrow className="z-1 flex h-4 w-full cursor-default items-center justify-center bg-white text-slate-500">
                <ChevronDown className="h-4 w-4" />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}