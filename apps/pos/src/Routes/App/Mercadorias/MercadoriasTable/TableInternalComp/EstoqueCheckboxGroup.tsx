import { Checkbox, Field, Fieldset } from "@base-ui/react";
import { ILoja } from "@tauri-inventory/types";
import { Check, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

/**
 * Input numérico de estoque mínimo.
 *
 * Usa `form="merc-list-form"` porque este grupo vive no drawer, que fica
 * **fora** do `<form>` — sem o atributo, o campo não entra no `FormData` lido
 * por `submitForm`. Vazio é apagado da query antes de navegar, então só
 * preencher é o que ativa o filtro.
 */
function EstoqueMinInput({
  name,
  ariaLabel,
}: {
  name: string;
  ariaLabel: string;
}) {
  return (
    <input
      type="number"
      name={name}
      form="merc-list-form"
      min={1}
      placeholder="mín."
      aria-label={ariaLabel}
      className="w-20 shrink-0 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-right text-sm text-gray-800 outline-none transition-all hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  );
}

export default function EstoqueCheckboxGroup({
  lojas,
  form,
  submitForm,
}: {
  lojas: ILoja[];
  form: string;
  submitForm?: (delay?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Fieldset.Root form={form} onChange={() => submitForm?.()}>
      <Fieldset.Legend
        onClick={() => setExpanded(!expanded)}
        className={`group flex items-center border-b border-gray-100 bg-white px-3 py-2 font-semibold transition-colors hover:bg-gray-50`}
      >
        <span>Estoque</span>
        <ChevronDown
          className={`ml-auto text-gray-500 transition-all duration-150 ease-out group-hover:text-gray-800 ${expanded && "rotate-180 text-gray-800!"}`}
        />
      </Fieldset.Legend>
      <motion.div
        animate={{ height: expanded ? "fit-content" : 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className=""
      >
        <div className={`${expanded ? "visible" : "invisible"}`}>
          {lojas.map((loja) => (
            <div
              key={loja.id}
              className="flex w-full items-center gap-3 px-2.5 py-1.5 transition-colors hover:bg-gray-50"
            >
              {/* `estoque<id>Min=n` → `{ gte: n }` naquela loja. Sobrescreve o
                  checkbox ao lado quando os dois vêm preenchidos: o mínimo já
                  implica positivo e diz mais. */}
              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-700">
                <span className="truncate">Loja {loja.nome}</span>
                <EstoqueMinInput
                  name={`estoque${loja.id}Min`}
                  ariaLabel={`Estoque mínimo na loja ${loja.nome}`}
                />
              </label>

              <Field.Root name={`estoque${loja.id}Positivo`} className={`flex shrink-0 items-center`}>
                <Field.Label
                  className={`group flex items-center gap-1.5 text-xs text-gray-500 transition-colors hover:text-gray-800`}
                >
                  Positivo
                  <Checkbox.Root
                    form="merc-list-form"
                    className={`flex size-5 shrink-0 items-center justify-center rounded-sm border border-gray-500 bg-white text-white transition-colors ease-out group-hover:border-gray-600 data-checked:bg-blue-500`}
                  >
                    <Checkbox.Indicator className={`flex data-unchecked:hidden`}>
                      <Check strokeWidth={4} className="p-1" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </Field.Label>
              </Field.Root>
            </div>
          ))}

          {/* Soma em todas as lojas → `filter.estoqueTotal`. É o mesmo número
              que a coluna "Estoque" da tabela mostra. */}
          <div className="flex w-full items-center gap-2 border-t border-gray-100 px-2.5 py-2 transition-colors hover:bg-gray-50">
            <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="truncate">Total (todas as lojas)</span>
              <EstoqueMinInput
                name="estoqueTotalMin"
                ariaLabel="Estoque mínimo somando todas as lojas"
              />
            </label>
          </div>
        </div>
      </motion.div>
    </Fieldset.Root>
  );
}
