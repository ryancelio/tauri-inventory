import { Accordion, Checkbox, Field, Fieldset } from "@base-ui/react";
import { Check, ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { Fragment, useState } from "react";

export default function EstoqueCheckboxGroup({
  lojas,
  form,
  submitForm,
}: {
  lojas: any[];
  form: string;
  submitForm?: () => void;
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
          {lojas.map((loja, index) => (
            <Field.Root
              key={loja.id}
              name={`estoque${loja.nome}Positivo`}
              className={`w-full`}
            >
              <Field.Label
                className={`group flex items-center justify-between px-2.5 py-2 transition-colors hover:bg-gray-50`}
              >
                Loja {loja.nome}
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
          ))}
        </div>
      </motion.div>
    </Fieldset.Root>
  );
}
