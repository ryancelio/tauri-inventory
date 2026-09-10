import { ChevronDown } from "lucide-react";
import { RefObject } from "react";
import { Item } from "../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

export default function SimpleSelect({
  selectRef,
  items,
  disabled = false,
  isLoading = false,
  name,
  value,
  setValue,
  required = false,
}: {
  selectRef?: RefObject<HTMLSelectElement | null>;
  isLoading?: boolean;
  disabled?: boolean;
  items: Item[];
  name?: string;
  value?: string;
  setValue?: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative flex h-10 items-center">
      <select
        name={name}
        id={name}
        ref={selectRef}
        disabled={disabled}
        value={value}
        required={required}
        className="peer h-full w-full min-w-40 cursor-default appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-9 pl-3 text-sm font-medium text-gray-700 shadow-sm transition-colors outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 active:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50"
        onChange={(e) => {
          setValue?.(e.target.value);
        }}
      >
        {isLoading ? (
          <option value="">Carregando...</option>
        ) : (
          items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))
        )}
      </select>
      <ChevronDown
        className={`pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-gray-500 transition-all duration-500 ease-out peer-active:rotate-x-180`}
      />
    </div>
  );
}
