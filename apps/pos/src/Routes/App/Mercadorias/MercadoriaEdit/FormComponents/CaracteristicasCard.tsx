import { useMemo, useRef, useState } from "react";
import { Plus, Tags, X } from "lucide-react";
import {
  AtributoTypesType,
  IAtributo,
  IMercadoria,
} from "@tauri-inventory/types";
import AutoCompleteDropdown, {
  Item,
} from "./BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { flushSync } from "react-dom";
import UISelect from "../../../Components/BASE-UI/Select";
import { useFetcher } from "react-router";
import FormTextInput from "./FormTextInput";

export function CaracteristicasCard({
  mercadoria,
  atributos,
  readOnly,
}: {
  mercadoria: IMercadoria;
  atributos: IAtributo[];
  readOnly?: boolean;
}) {
  //  const atributosMap = useMemo(() => {
  //   const map = new Map<string, string>();
  //   atributos.forEach((at) => map.set(at.id.toString(), at.nome));
  //   return map;
  // }, [atributos]);

  const [caracteristicas, setCaracteristicas] = useState(() => {
    if (!mercadoria.caracteristicas) return [];
    // Cada item já vem da tabela de junção (Mercadoria_Atributos) como
    // { id: atributoId, nome, tipo, valor }. 'key' aqui representa o
    // atributoId, mantendo compatibilidade com o formData esperado
    // (caracteristicas[i][key] / caracteristicas[i][value]).
    return mercadoria.caracteristicas.map((c, index) => ({
      id: Date.now() + index,
      key: String(c.id),
      value: String(c.valor),
    }));
  });

  const corAtributoId = useMemo(
    () => atributos.find((a) => a.nome.toLowerCase() === "cor"),
    [atributos],
  )?.id;

  const caracteristicasFiltradas = useMemo(
    () => caracteristicas.filter((c) => c.key != corAtributoId?.toString()),
    [corAtributoId, caracteristicas],
  );

  const atributosItems = useMemo(() => {
    return atributos.map((at) => ({
      label: at.nome,
      value: at.id,
    }));
  }, [atributos]);

  const usedKeys = useMemo(() => {
    return new Set(caracteristicas.map((c) => String(c.key)).filter(Boolean));
  }, [caracteristicas]);

  const handleKeyChange = (id: number, newKey: string) => {
    setCaracteristicas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, key: newKey, value: "" } : c)),
    );
  };

  const handleValueChange = (id: number, newValue: string) => {
    setCaracteristicas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: newValue } : c)),
    );
  };

  const overflowRef = useRef<HTMLDivElement>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Tags className="text-slate-400" size={20} />
          <h2 className="text-lg font-semibold text-slate-800">
            Características
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            flushSync(() => {
              setCaracteristicas([
                ...caracteristicas,
                { id: Date.now(), key: "", value: "" },
              ]);
            });

            lastElementRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "nearest",
            });
          }}
          className="flex items-center justify-center rounded-md bg-blue-500 p-1.5 text-white shadow-sm transition-colors not-disabled:hover:brightness-95 disabled:bg-blue-300"
          disabled={readOnly}
          title="Adicionar Característica"
        >
          <Plus size={18} />
        </button>
      </div>

      <div
        ref={overflowRef}
        className="flex max-h-75 min-h-28 flex-col gap-2 overflow-y-auto overscroll-contain pr-4"
      >
        {caracteristicasFiltradas.map((caracteristica, index) => (
          <div
            ref={
              index === caracteristicasFiltradas.length - 1
                ? lastElementRef
                : undefined
            }
            key={caracteristica.id}
            className="group relative grid h-full w-full grid-cols-12 items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 p-2 transition-colors hover:bg-slate-100"
          >
            <CaracteristicaRow
              atributos={atributos}
              atributosItems={atributosItems}
              caracteristica={caracteristica}
              index={index}
              readOnly={readOnly}
              usedKeys={usedKeys}
              onKeyChange={(newKey) =>
                handleKeyChange(caracteristica.id, newKey)
              }
              onValueChange={(newValue) =>
                handleValueChange(caracteristica.id, newValue)
              }
              onRemove={() =>
                setCaracteristicas(
                  caracteristicas.filter((c) => c.id !== caracteristica.id),
                )
              }
            />
          </div>
        ))}
        {caracteristicasFiltradas.length === 0 && (
          <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
            <p className="text-sm italic">Nenhuma característica adicionada.</p>
            {!readOnly && (
              <button
                type="button"
                onClick={() =>
                  setCaracteristicas([
                    ...caracteristicas,
                    { id: Date.now(), key: "", value: "" },
                  ])
                }
                className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline"
              >
                Adicionar primeira característica
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const getAtributoValorInput = (
  atributoType: AtributoTypesType | "text",
  index: number,
  caracteristicaValue: string,
  setCaracteristicaValue: (val: string) => void,
  readOnly?: boolean,
) => {
  const baseInputClass =
    "h-fit w-full grow rounded-lg border text-sm text-slate-800 transition-all border border-gray-300 bg-white py-2 pr-2 pl-3 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500 appearance-none shadow-sm outline-none hover:border-gray-400";

  switch (atributoType) {
    case "boolean":
      return (
        <>
          <label
            className="mb-1 ml-1 text-sm font-semibold text-gray-800"
            htmlFor={`caracteristicas[${index}][value]`}
          >
            Sim/Não
          </label>
          <UISelect
            placeholder="Qualquer"
            items={[
              { label: "Sim", value: "true" },
              { label: "Não", value: "false" },
            ]}
            className={baseInputClass}
            disabled={readOnly}
            name={`caracteristicas[${index}][value]`}
            id={`caracteristicas[${index}][value]`}
            value={caracteristicaValue === "" ? null : {label: caracteristicaValue, value: caracteristicaValue}}
            onValueChange={(val) => setCaracteristicaValue(val?.value?.toString() || "")}
          />
        </>
      );
    case "number":
      return (
        <>
          <label
            className="mb-1 ml-1 text-sm font-semibold text-gray-800"
            htmlFor={`caracteristicas[${index}][value]`}
          >
            Valor
          </label>
          <input
            required
            type="number"
            name={`caracteristicas[${index}][value]`}
            id={`caracteristicas[${index}][value]`}
            value={caracteristicaValue}
            onChange={(e) => setCaracteristicaValue(e.target.value)}
            readOnly={readOnly}
            className={baseInputClass}
          />
        </>
      );
    case "text":
    default:
      return (
        <>
          <label
            className="mb-1 ml-1 text-sm font-semibold text-gray-800"
            htmlFor={`caracteristicas[${index}][value]`}
          >
            Texto
          </label>
          <input
            required
            type="text"
            name={`caracteristicas[${index}][value]`}
            id={`caracteristicas[${index}][value]`}
            value={caracteristicaValue}
            onChange={(e) => setCaracteristicaValue(e.target.value)}
            readOnly={readOnly}
            className={baseInputClass}
          />
        </>
      );
  }
};

function CaracteristicaRow({
  atributosItems,
  index,
  caracteristica,
  readOnly,
  onRemove,
  atributos,
  usedKeys,
  onKeyChange,
  onValueChange,
}: {
  atributosItems: Item[];
  index: number;
  atributos: IAtributo[];
  caracteristica: { id: number; key: string; value: string };
  readOnly?: boolean;
  onRemove: () => void;
  usedKeys: Set<string>;
  onKeyChange: (val: string) => void;
  onValueChange: (val: string) => void;
}) {
  const selectedId = caracteristica.key
    ? Number(caracteristica.key)
    : undefined;

  const atributoSelecionado = atributos.find((at) => at.id === selectedId);
  const atributoType = atributoSelecionado?.tipo || "text";

  const selectedAtributoItem =
    selectedId && atributoSelecionado
      ? {
          label: atributoSelecionado.nome,
          value: selectedId,
        }
      : null;

  // 4. Filtra os items, removendo todos que estão no usedKeys,
  // exceto se for o item atualmente selecionado por essa mesma linha
  const filteredAtributosItems = useMemo(() => {
    return atributosItems.filter((item) => {
      const isUsed = usedKeys.has(String(item.value));
      const isCurrentSelection =
        String(item.value) === String(caracteristica.key);
      return !isUsed || isCurrentSelection;
    });
  }, [atributosItems, usedKeys, caracteristica.key]);

  const handleSelectedAtributoChange = (val: Item | null) => {
    onKeyChange(val ? String(val.value) : "");
  };

  const createAtributoFetcher = useFetcher();

  const createAtributoNomeRef = useRef<HTMLInputElement>(null);
  const createAtributoTypeRef = useRef<HTMLInputElement>(null);

  const handleCreateAtributo = async () => {
    if (!createAtributoNomeRef.current || !createAtributoTypeRef.current)
      return;
    await createAtributoFetcher.submit(
      {
        nome: createAtributoNomeRef.current.value,
        tipo: createAtributoTypeRef.current.value,
      },
      {
        action: "/gerente/atributos",
        method: "POST",
      },
    );
  };

  return (
    <>
      <div className="col-span-6">
        <AutoCompleteDropdown
          required
          readOnly={readOnly}
          classNames={{ input: "bg-white!" }}
          creationFetcher={createAtributoFetcher}
          createForm={({ defaultValue }: { defaultValue: string }) => (
            <div>
              <FormTextInput
                id=""
                label="Nome"
                placeholder="Nome fabricante"
                ref={createAtributoNomeRef}
                defaultValue={defaultValue}
              />
              <UISelect
                label="Tipo"
                placeholder="Selecione um tipo"
                inputRef={createAtributoTypeRef}
                items={[
                  { label: "Texto", value: "text" },
                  {
                    label: "Numero",
                    value: "number",
                  },
                  {
                    label: "Sim/Não",
                    value: "boolean",
                  },
                ]}
              />
            </div>
          )}
          createNew={handleCreateAtributo}
          items={filteredAtributosItems}
          label="Atributo"
          name={`caracteristicas[${index}][key]`}
          setSelectedItem={handleSelectedAtributoChange}
          selectedItem={selectedAtributoItem}
        />
      </div>
      <div className="col-span-6 flex h-full flex-col justify-center">
        {getAtributoValorInput(
          atributoType,
          index,
          caracteristica.value,
          onValueChange,
          readOnly,
        )}
      </div>
      <div className="absolute top-1 right-1 flex">
        <button
          type="button"
          onClick={onRemove}
          disabled={readOnly}
          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-500 disabled:invisible"
        >
          <X size={16} />
        </button>
      </div>
    </>
  );
}
