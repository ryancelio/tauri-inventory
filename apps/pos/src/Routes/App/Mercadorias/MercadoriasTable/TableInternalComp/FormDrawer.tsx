import { Filter, X } from "lucide-react";
import { IAtributo, IGrupo } from "@tauri-inventory/types";
import CaracteristicasFilter from "./CaracteristicasFilter";
import { RefObject, useEffect, useRef } from "react";
import { motion } from "motion/react";
import GrupoCatDropdown from "../../MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/GrupoCatAutoComplete";
import EstoqueCheckboxGroup from "./EstoqueCheckboxGroup";

export default function FormDrawer({
  isDrawerOpen,
  setIsDrawerOpen,
  resetKey,
  lojasPlaceholder,
  grupos,
  submitForm,
  atributos,
  caracteristicasRef,
}: {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (val: boolean) => void;
  resetKey: number;
  lojasPlaceholder: any[];
  grupos: IGrupo[];
  submitForm: (delay?: number) => void;
  atributos: IAtributo[];
  caracteristicasRef: RefObject<any>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.focus();
  }, [wrapperRef]);
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: isDrawerOpen ? 1 : 0,
        }}
        className={`fixed inset-0 z-80 bg-black/40 ${!isDrawerOpen && "pointer-events-none"}`}
        onClick={() => setIsDrawerOpen(false)}
      />
      <motion.div
        ref={wrapperRef}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            setIsDrawerOpen(false);
          }
        }}
        initial={{ translateX: "100%" }}
        animate={{ translateX: isDrawerOpen ? 0 : "100%" }}
        transition={{ duration: 0.3, ease: "circOut" }}
        className={`fixed top-0 right-0 z-90 flex h-full w-full flex-col bg-white pt-8 shadow-2xl sm:w-100`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Filter size={20} className="text-blue-500" />
            Filtros Avançados
          </h2>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto p-5">
          <div autoFocus>
            <GrupoCatDropdown
              form="merc-list-form"
              key={resetKey}
              grupos={grupos}
              onChangeValue={() => submitForm(0)}
              textSize="small"
            />
          </div>

          <div className="flex w-full cursor-default flex-col gap-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Estoque
            </label>
            <div className="flex w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <EstoqueCheckboxGroup
                form="merc-list-form"
                key={resetKey}
                lojas={lojasPlaceholder}
                submitForm={() => submitForm(0)}
              />
            </div>
          </div>

          <div className="w-full border-t border-gray-100 pt-1">
            <CaracteristicasFilter
              atributos={atributos || []}
              onChange={(obj: Record<string, any>) => {
                caracteristicasRef.current = obj;
                submitForm();
              }}
            />
          </div>
        </div>

        <div className="flex flex-col border-t border-gray-100 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => {
              setIsDrawerOpen(false);
              submitForm(0);
            }}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Aplicar e Fechar
          </button>
        </div>
      </motion.div>
    </>
  );
}
