import { useEffect, useState, useRef, useMemo } from "react";
import { Link2Icon, Plus, X } from "lucide-react";
import { IAtributo } from "@tauri-inventory/types";
import AutoCompleteDropdown from "../../MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { flushSync } from "react-dom";
import UISelect from "../../../Components/BASE-UI/Select";

export type AttrFilter = {
  id: number;
  atributoId: number | string | null;
  type: "text" | "number" | "boolean";
  // Text specific
  textValue: string;
  textExact: boolean;
  // Number specific
  numMin: string;
  numMax: string;
  numLinked: boolean;
  // Boolean specific
  boolValue: "true" | "false" | "";
};

export default function CaracteristicasFilter({
  atributos,
  onChange,
}: {
  atributos: IAtributo[];
  onChange: (filterObj: Record<string, any>) => void;
}) {
  const atributosItems = useMemo(
    () =>
      atributos.map((at) => ({
        label: at.nome,
        value: at.id,
      })),
    [atributos],
  );

  const atributosById = useMemo(
    () => Object.fromEntries(atributos.map((a) => [a.id, a])),
    [atributos],
  );

  const [filters, setFilters] = useState<AttrFilter[]>([]);
  const lastFilterStr = useRef<string>("");

  const lastFilterRef = useRef<HTMLDivElement>(null);

  // 1. Rastreia os IDs de atributos já selecionados nos filtros
  const usedAttributeIds = useMemo(() => {
    return new Set(
      filters
        .map((f) => String(f.atributoId))
        .filter((id) => id !== "null" && id !== "undefined" && id !== ""),
    );
  }, [filters]);

  const addFilter = () => {
    flushSync(() =>
      setFilters([
        ...filters,
        {
          id: Date.now(),
          atributoId: null,
          type: "text",
          textValue: "",
          textExact: false,
          numMin: "",
          numMax: "",
          numLinked: true,
          boolValue: "",
        },
      ]),
    );
    lastFilterRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilterKey = (id: number, atributoId: number | string | null) => {
    setFilters((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;

        const atributo =
          atributoId !== null ? atributosById[atributoId] : undefined;

        return {
          ...f,
          atributoId,
          type: atributo?.tipo ?? "text",
          // Resetamos os valores específicos para não misturar lógicas ao trocar de tipo
          textValue: "",
          numMin: "",
          numMax: "",
          boolValue: "",
        };
      }),
    );
  };

  const updateFilterValue = <K extends keyof AttrFilter>(
    id: number,
    field: K,
    value: AttrFilter[K],
  ) => {
    setFilters((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const updated = { ...f, [field]: value };
        // Sync min and max if linked
        if (updated.numLinked) {
          if (field === "numMin") {
            updated.numMax = value as string;
          } else if (field === "numMax") {
            updated.numMin = value as string;
          }
        }
        return updated;
      }),
    );
  };

  useEffect(() => {
    const filterObject: Record<string, any> = {};

    filters.forEach((f) => {
      if (f.atributoId === null) return;

      const key = String(f.atributoId);

      if (f.type === "boolean") {
        if (f.boolValue === "true") {
          filterObject[key] = { eq: true };
        } else if (f.boolValue === "false") {
          filterObject[key] = { eq: false };
        }
      } else if (f.type === "text") {
        if (!f.textValue) return;
        if (f.textExact) {
          filterObject[key] = { eq: f.textValue };
        } else {
          filterObject[key] = { contains: f.textValue };
        }
      } else if (f.type === "number") {
        const minVal = f.numMin !== "" ? Number(f.numMin) : undefined;
        const maxVal = f.numMax !== "" ? Number(f.numMax) : undefined;

        if (f.numLinked) {
          if (minVal !== undefined && !isNaN(minVal)) {
            filterObject[f.atributoId] = { eq: minVal };
          }
        } else {
          const conditions: any = {};
          if (minVal !== undefined && !isNaN(minVal)) {
            conditions.gte = minVal;
          }
          if (maxVal !== undefined && !isNaN(maxVal)) {
            conditions.lte = maxVal;
          }
          if (Object.keys(conditions).length > 0) {
            filterObject[f.atributoId] = conditions;
          }
        }
      }
    });

    const newStr = JSON.stringify(filterObject);
    if (lastFilterStr.current !== newStr) {
      lastFilterStr.current = newStr;
      onChange(filterObject);
    }
  }, [filters, onChange]);

  return (
    <div className="mt-4 flex max-h-full w-full flex-col gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between border-b pb-2">
        <label className="text-sm font-semibold text-gray-700">
          Filtrar por Características
        </label>
        <button
          type="button"
          onClick={addFilter}
          className="flex items-center gap-1 rounded p-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
          title="Adicionar filtro"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <div className="flex h-full flex-col gap-2 overflow-y-auto pr-1">
        {filters.map((f, idx) => {
          const filteredAtributosItems = atributosItems.filter((item) => {
            const isUsed = usedAttributeIds.has(String(item.value));
            const isCurrentSelection =
              String(item.value) === String(f.atributoId);
            return !isUsed || isCurrentSelection;
          });

          return (
            <div
              key={f.id}
              ref={idx === filters.length - 1 ? lastFilterRef : undefined}
              className="group relative flex flex-col gap-2 rounded-md border border-gray-100 bg-gray-50 p-3"
            >
              <div className="flex min-w-30 flex-1 flex-col">
                <button
                  type="button"
                  onClick={() => removeFilter(f.id)}
                  className="absolute top-0.5 right-0.5 z-50 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Remover"
                >
                  <X size={16} />
                </button>
                <AutoCompleteDropdown
                  // Utilizamos a lista já filtrada
                  items={filteredAtributosItems}
                  name={`attr-${f.id}`}
                  onValueChange={(selectedItem) =>
                    updateFilterKey(f.id, selectedItem?.value ?? null)
                  }
                  label={"Atributo"}
                  defaultValue={{
                    label:
                      f.atributoId != null
                        ? (atributosById[f.atributoId]?.nome ?? "")
                        : "",
                    value: Number(f.atributoId),
                  }}
                />
              </div>
              <div className="flex min-w-30 flex-[1.5] flex-col">
                <label className="mb-1 text-[10px] font-semibold text-gray-500 uppercase">
                  Valor
                </label>
                {f.type === "boolean" ? (
                  // 3. Utilizando o UISelect genérico com placeholder impeditivo (não selecionável)
                  <UISelect<string>
                    placeholder="Qualquer"
                    items={[
                      { label: "Sim", value: "true" },
                      { label: "Não", value: "false" },
                    ]}
                    value={f.boolValue === "" ? null : f.boolValue}
                    onValueChange={(val) =>
                      updateFilterValue(f.id, "boolValue", (val as any) || "")
                    }
                  />
                ) : f.type === "text" ? (
                  <div className="flex w-full flex-col gap-0.5">
                    <input
                      type="text"
                      value={f.textValue}
                      onChange={(e) =>
                        updateFilterValue(f.id, "textValue", e.target.value)
                      }
                      className="w-full min-w-15 rounded border border-gray-200 bg-white p-1.5 text-sm focus:border-blue-400 focus:outline-none"
                    />
                    <div className="flex items-center justify-start gap-1.5 pt-1">
                      <input
                        type="checkbox"
                        id={`exato-${f.id}`}
                        checked={f.textExact}
                        onChange={(e) =>
                          updateFilterValue(f.id, "textExact", e.target.checked)
                        }
                      />
                      <label
                        htmlFor={`exato-${f.id}`}
                        className="text-xs font-medium text-neutral-600"
                      >
                        Busca exata
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-start gap-1">
                    <div className="flex flex-1 flex-col gap-0.5">
                      <label
                        htmlFor={`min-${f.id}`}
                        className="text-[10px] text-gray-500"
                      >
                        {f.numLinked ? "Igual a:" : "Mínimo:"}
                      </label>
                      <input
                        id={`min-${f.id}`}
                        type="number"
                        value={f.numMin}
                        onChange={(e) =>
                          updateFilterValue(f.id, "numMin", e.target.value)
                        }
                        className="w-full min-w-15 rounded border border-gray-200 bg-white p-1.5 text-sm focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-end pt-4 pb-1.5">
                      <button
                        type="button"
                        className={`rounded-lg p-1.5 transition-colors ${
                          f.numLinked
                            ? "bg-blue-100 text-blue-600"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          const newLinked = !f.numLinked;
                          updateFilterValue(f.id, "numLinked", newLinked);
                          if (newLinked) {
                            updateFilterValue(f.id, "numMax", f.numMin);
                          }
                        }}
                        title={
                          f.numLinked
                            ? "Desvincular (Filtrar por intervalo)"
                            : "Vincular (Filtrar por valor exato)"
                        }
                      >
                        <Link2Icon size={16} />
                      </button>
                    </div>
                    {!f.numLinked && (
                      <div className="flex flex-1 flex-col gap-0.5">
                        <label
                          htmlFor={`max-${f.id}`}
                          className="text-[10px] text-gray-500"
                        >
                          Máximo:
                        </label>
                        <input
                          id={`max-${f.id}`}
                          type="number"
                          value={f.numMax}
                          onChange={(e) =>
                            updateFilterValue(f.id, "numMax", e.target.value)
                          }
                          className="w-full min-w-15 rounded border border-gray-200 bg-white p-1.5 text-sm focus:border-blue-400 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
