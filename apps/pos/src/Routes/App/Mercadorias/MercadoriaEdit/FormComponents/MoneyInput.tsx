import { Ref, useLayoutEffect, useRef, useState } from "react";
const parseToNumber = (val: string) => {
  if (!val) return 0;

  // Remove tudo que não for dígito, ponto, vírgula ou sinal de menos
  let cleaned = String(val).replace(/[^\d.,-]/g, "");
  if (!cleaned) return 0;

  // Se houver vírgula, trata como separador decimal e remove os pontos de milhar
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
// 2. Função para formatar números para a exibição (R$ 0,00)
const formatToBRL = (val: string | number) => {
  const num = typeof val === "string" ? parseToNumber(val) : val;
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function MoneyInput({
  initial = "",
  id,
  valueRef,
  required = false,
  value,
  onChange,
  disabled
}: {
  initial?: string;
  value?: number;
  onChange?: (val: number) => void;
  id?: string;
  valueRef?: Ref<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean
}) {
  // const [value, setValue] = useState(() => parseToNumber(initial));
  // Used when uncontrolled
  const [internalValue, setInternalValue] = useState<number>(
    parseToNumber(initial),
  );

  // If user provided controlled options, use theirs, if not, use internal
  const [currentValue, setCurrentValue] =
    value !== undefined && onChange !== undefined
      ? [value, onChange]
      : [internalValue, setInternalValue];

  const [displayValue, setDisplayValue] = useState(() => formatToBRL(initial));
  const [error, setError] = useState<string | null>(null);

  const handleBlur = () => {
    if (!displayValue.trim()) {
      setDisplayValue("0,00");
      setCurrentValue(0);
      return;
    }

    const parsedNumber = parseToNumber(displayValue);

    if (isNaN(parsedNumber)) {
      setError("Valor inválido");
    } else {
      setError(null);
      setDisplayValue(formatToBRL(parsedNumber)); // Formata visualmente
      setCurrentValue(parsedNumber); // SINCRONIZA o state real com o número interpretado
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!/^[0-9,.]*$/.test(val)) {
      return;
    }

    setDisplayValue(val);
    setCurrentValue(parseToNumber(val));

    if (error) {
      setError(null);
    }
  };
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="group relative flex w-full items-center">
        <span className="pointer-events-none absolute left-3 text-sm font-medium text-slate-400 transition-colors select-none group-focus-within:text-blue-500">
          R$
        </span>
        <input type="hidden" name={id} value={currentValue} ref={valueRef} disabled={disabled}/>
        <input
          className={`w-full rounded-lg border bg-slate-50 py-2 pr-3 pl-10 text-right text-sm font-semibold transition-all focus:bg-white focus:ring-1 focus:outline-none ${
            error
              ? "border-red-300 text-red-600 focus:border-red-400 focus:ring-red-400"
              : "border-slate-200 text-slate-700 focus:border-blue-400 focus:ring-blue-400"
          }`}
          // ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
        />
      </div>
      <span
        className={`h-2 px-1 text-xs font-medium text-red-500 ${error ? "visible" : "invisible"}`}
      >
        {error}
      </span>
    </div>
  );
}
