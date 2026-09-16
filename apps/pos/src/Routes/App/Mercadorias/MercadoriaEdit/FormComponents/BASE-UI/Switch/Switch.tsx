import { Field, Switch } from "@base-ui/react";
import { useState } from "react";

interface SwitchComponentProps {
  labelRight: string;
  labelLeft?: string;
  name?: string;
  checked?: boolean;
  onChange?: (val: boolean) => void;
  disabled?: boolean;
}

export default function SwitchComponent({
  labelRight,
  labelLeft,
  name,
  checked,
  onChange,
  disabled,
}: SwitchComponentProps) {
  const [internalChecked, internalSetChecked] = useState(false);

  const isControlled = checked !== undefined && onChange !== undefined;

  const [currentChecked, currentSetChecked] = isControlled
    ? [checked, onChange]
    : [internalChecked, internalSetChecked];

  return (
    <Field.Root name={name}>
      <Field.Label
        className={`flex items-center gap-2.5 select-none ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
      >
        {labelLeft && (
          <span
            onClick={(e) => {
              if (disabled) return;
              e.preventDefault();
              currentSetChecked(false);
            }}
            className={`text-sm font-medium transition-colors duration-150 ${
              !currentChecked
                ? "text-slate-800"
                : "text-slate-400 hover:text-slate-500"
            }`}
          >
            {labelLeft}
          </span>
        )}

        <Switch.Root
          checked={currentChecked}
          disabled={disabled}
          onCheckedChange={() => currentSetChecked(!currentChecked)}
          className="relative flex h-5 w-9 shrink-0 items-center rounded-full border border-slate-300 bg-slate-200 p-0.5 shadow-inner transition-colors duration-200 ease-out hover:border-slate-400 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-500 data-checked:border-blue-500 data-checked:bg-blue-500 data-checked:hover:bg-blue-600 data-disabled:cursor-not-allowed data-disabled:hover:border-slate-300"
        >
          <Switch.Thumb className="size-3.5 rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ease-out data-checked:translate-x-4" />
        </Switch.Root>

        <span
          onClick={(e) => {
            if (disabled || !labelLeft) return;
            e.preventDefault();
            currentSetChecked(true);
          }}
          className={`text-sm font-medium transition-colors duration-150 ${
            currentChecked
              ? "text-slate-800"
              : labelLeft
                ? "text-slate-400 hover:text-slate-500"
                : "text-slate-800"
          }`}
        >
          {labelRight}
        </span>
      </Field.Label>
    </Field.Root>
  );
}
