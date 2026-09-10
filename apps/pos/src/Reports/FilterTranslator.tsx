import { MercadoriaInternalFilter } from "@tauri-inventory/types";

export interface FilterLookups {
  atributos?: Record<number, string>;
  fabricantes?: Record<number, string>;
  categorias?: Record<number, string>;
  grupos?: Record<number, string>;
}

const fieldLabels: Record<keyof MercadoriaInternalFilter, string> = {
  id: "ID",
  key: "Código",
  descricao: "Descrição",
  fabricanteId: "Fabricante",
  categoriaId: "Categoria",
  grupoId: "Grupo",
  estoque02: "Estoque 02",
  estoque03: "Estoque 03",
  estoque04: "Estoque 04",
  caracteristicas: "Características",
  observacoes: "Observações",
  precoCusto: "Preço de Custo",
  precoVenda: "Preço de Venda",
  createdAt: "Data de Criação",
  updatedAt: "Data de Atualização",
};

export function parseFiltrosParaTexto(
  filtro?: MercadoriaInternalFilter,
  lookups?: FilterLookups,
): string[] {
  if (!filtro) return [];

  const descricoesFiltro: string[] = [];

  const formatValue = (key: string, val: any): string => {
    if (key === "fabricanteId" && lookups?.fabricantes?.[val])
      return lookups.fabricantes[val];
    if (key === "categoriaId" && lookups?.categorias?.[val])
      return lookups.categorias[val];
    if (key === "grupoId" && lookups?.grupos?.[val]) return lookups.grupos[val];

    if (typeof val === "number" && key.toLowerCase().includes("preco")) {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(val);
    }
    if (
      typeof val === "string" &&
      (key.includes("At") || key.includes("data"))
    ) {
      try {
        return new Date(val).toLocaleDateString("pt-BR");
      } catch {
        return val;
      }
    }
    return String(val);
  };

  const formatCondition = (key: string, conditionObj: any): string => {
    if (typeof conditionObj !== "object") return "";

    if (conditionObj.eq !== undefined) {
      return `: ${formatValue(key, conditionObj.eq)}`;
    }
    if (conditionObj.contains !== undefined) {
      return `contém "${conditionObj.contains}"`;
    }
    if (conditionObj.in !== undefined && Array.isArray(conditionObj.in)) {
      return `nas opções [${conditionObj.in.map((v: string) => formatValue(key, v)).join(", ")}]`;
    }

    // Intervalos com verificação de igualdade
    if (conditionObj.gte !== undefined && conditionObj.lte !== undefined) {
      if (conditionObj.gte === conditionObj.lte) {
        return `: ${formatValue(key, conditionObj.gte)}`;
      }
      return `entre ${formatValue(key, conditionObj.gte)} e ${formatValue(key, conditionObj.lte)}`;
    }

    const parts: string[] = [];
    if (conditionObj.gte !== undefined)
      parts.push(`>= ${formatValue(key, conditionObj.gte)}`);
    if (conditionObj.gt !== undefined)
      parts.push(`> ${formatValue(key, conditionObj.gt)}`);
    if (conditionObj.lte !== undefined)
      parts.push(`<= ${formatValue(key, conditionObj.lte)}`);
    if (conditionObj.lt !== undefined)
      parts.push(`< ${formatValue(key, conditionObj.lt)}`);

    return parts.join(" e ");
  };

  Object.entries(filtro).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    const label = fieldLabels[key as keyof MercadoriaInternalFilter] || key;

    // 1. Regra das Características (Cada uma vira uma Tag)
    if (key === "caracteristicas") {
      Object.entries(value).forEach(([charKey, charValue]) => {
        if (charValue === undefined || charValue === null) return;

        const condText = formatCondition(charKey, charValue);
        if (condText) {
          const formatado = condText.startsWith(": ")
            ? condText.substring(2)
            : condText;

          const nomeAtributo =
            lookups?.atributos?.[Number(charKey)] || `Atributo ${charKey}`;

          // Adiciona a característica atual diretamente na array (virando uma Tag no PDF)
          descricoesFiltro.push(`${nomeAtributo}: ${formatado}`);
        }
      });
      return;
    }

    // 2. Regra do Estoque (Positivo)
    if (key.startsWith("estoque")) {
      const keys = Object.keys(value);
      if (keys.length === 1 && value.gt === 0) {
        descricoesFiltro.push(`${label}: Positivo`);
        return;
      }
    }

    // 3. Processamento dos demais campos
    const condText = formatCondition(key, value);
    if (condText) {
      if (condText.startsWith(":")) {
        descricoesFiltro.push(`${label}${condText}`);
      } else {
        descricoesFiltro.push(`${label} ${condText}`);
      }
    }
  });

  return descricoesFiltro;
}
