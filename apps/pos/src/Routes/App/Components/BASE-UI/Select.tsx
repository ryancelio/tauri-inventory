import * as React from "react";
import { Select, SelectRootProps } from "@base-ui/react/select";
import { CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Item } from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

export type UISelectStyle = "default" | "underlined" | "filled" | "ghost";
export type UISelectSize = "sm" | "md" | "lg";

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
  style?: UISelectStyle;
  size?: UISelectSize;
};

// Cada variante define as classes do Trigger. Mantém o mesmo "shape"
// (altura, gaps, tamanho de fonte) e só muda borda/fundo/sombra.
const TRIGGER_VARIANTS: Record<UISelectStyle, string> = {
  default:
    "px-3 rounded-lg border border-gray-300 bg-white shadow-sm " +
    "hover:not-data-disabled:border-gray-400 " +
    "focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none " +
    "disabled:border-gray-200 data-disabled:bg-slate-100 data-disabled:text-slate-500",

  underlined:
    "px-1 rounded-none border-0 border-b-2 border-gray-300 bg-transparent shadow-none " +
    "hover:not-data-disabled:border-gray-400 " +
    "focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-0 " +
    "disabled:border-gray-200 data-disabled:border-slate-200 data-disabled:text-slate-500",

  filled:
    "px-3 rounded-lg border border-transparent bg-slate-100 shadow-none " +
    "hover:not-data-disabled:bg-slate-200 " +
    "focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none " +
    "disabled:bg-slate-50 data-disabled:bg-slate-50 data-disabled:text-slate-500",

  ghost:
    "px-3 rounded-lg border border-transparent bg-transparent shadow-none " +
    "hover:not-data-disabled:bg-slate-100 " +
    "focus-visible:ring-1 focus-visible:ring-blue-400 focus-visible:outline-none " +
    "disabled:text-slate-400 data-disabled:bg-transparent data-disabled:text-slate-500",
};

// classes fixas, iguais em todos os tamanhos e variantes (não mudam)
const TRIGGER_BASE =
  "flex w-full items-center justify-between text-slate-800 transition-all";

// Controla o "tamanho da caixa": altura, padding vertical, largura mínima,
// espaçamento interno e fonte. Não mexe em padding horizontal nem em
// borda/fundo — isso continua por conta de TRIGGER_VARIANTS (style).
const SIZE_VARIANTS: Record<UISelectSize, { trigger: string; icon: string }> = {
  sm: {
    trigger: "h-8 gap-2 py-1 text-sm",
    icon: "h-3.5 w-3.5",
  },
  md: {
    trigger: "h-9.5 min-w-40 gap-3 py-2 text-sm",
    icon: "h-4 w-4",
  },
  lg: {
    trigger: "h-11 min-w-48 gap-3 py-2.5 text-base",
    icon: "h-5 w-5",
  },
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
  style = "default",
  size = "md",
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

  const triggerClassName = [
    TRIGGER_BASE,
    SIZE_VARIANTS[size].trigger,
    TRIGGER_VARIANTS[style],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full items-start">
      <Select.Root
        items={internalItems}
        value={rawValue}
        onValueChange={handleValueChange}
        {...props}
      >
        <div className={`flex ${labelLeft ? "flex-row items-center" : "flex-col items-start"} h-full gap-2`}>

        {label && (
          <Select.Label className="cursor-default text-sm text-nowrap text-start items-center h-full font-semibold text-slate-800">
            {label}
          </Select.Label>
        )}

        <Select.Trigger className={triggerClassName}>
          <Select.Value className="data-placeholder:text-slate-500" placeholder={placeholder} />
          <Select.Icon className="transition-all duration-500 ease-out data-popup-open:rotate-x-180">
            <ChevronDown className={`${SIZE_VARIANTS[size].icon} text-slate-500`} />
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