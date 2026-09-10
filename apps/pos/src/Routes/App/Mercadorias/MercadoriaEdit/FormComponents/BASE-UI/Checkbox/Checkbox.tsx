import { Checkbox, Field } from "@base-ui/react";
import { Check } from "lucide-react";

export default function CheckboxComponent({
  name,
  label,
  checked,
  reversed = false,
  onChange,
  classNames,
}: {
  name?: string;
  label?: string;
  checked?: boolean;
  reversed?: boolean;
  onChange?: (val: boolean) => void;
  classNames?: {
    fieldRoot?: string;
    label?: string;
    checkRoot?: string;
    checkIndicator?: string;
  };
}) {
  return (
    <Field.Root
      // key={loja.id}
      name={name}
      className={`${classNames?.fieldRoot} w-full`}
    >
      <Field.Label
        className={`${classNames?.label} group flex items-center justify-between px-2.5 py-2 gap-2 transition-colors hover:bg-gray-50 ${reversed ? "flex-row-reverse" : "flex-row"}`}
      >
        {label}
        <Checkbox.Root
          checked={checked}
          onCheckedChange={() => onChange?.(!checked)}
          className={`${classNames?.checkRoot} flex size-5 shrink-0 items-center justify-center rounded-md border border-gray-500 bg-white text-center text-white transition-colors ease-out group-hover:border-gray-600 data-checked:border-blue-500 data-checked:bg-blue-500`}
        >
          <Checkbox.Indicator
            className={`${classNames?.checkIndicator} flex shrink-0 data-unchecked:hidden`}
          >
            <Check strokeWidth={2} className="p-1" />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </Field.Label>
    </Field.Root>
  );
}
