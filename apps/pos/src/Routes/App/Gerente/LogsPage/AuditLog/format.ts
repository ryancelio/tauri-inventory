import { Caracteristica } from "@tauri-inventory/types";
import { CURRENCY_FIELDS, DATE_FIELDS, FIELD_LABELS } from "./constants";

export function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field;
}

export function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";

  if (CURRENCY_FIELDS.has(field)) {
    const num = typeof value === "string" ? Number(value) : (value as number);
    if (Number.isFinite(num)) {
      return num.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
  }

  if (typeof value === "boolean") return value ? "Sim" : "Não";

  if (DATE_FIELDS.has(field)) {
    return new Date(String(value)).toLocaleString("pt-BR");
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—"; // array vazio (ex: todas as caracts eram novas) não vira ""

    return value
      .map((carac: Caracteristica) => {
        if (!carac?.nome) return null; // defensivo: ignora item sem nome em vez de imprimir "undefined:"
        const valorFmt =
          carac.tipo === "boolean"
            ? carac.valor
              ? "Sim"
              : "Não"
            : (carac.valor?.toString() ?? "—");
        return `${carac.nome}: ${valorFmt}`;
      })
      .filter(Boolean)
      .join(" & ");
  }

  return String(value);
}

function formatRelative(date: Date) {
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour} h`;
  if (diffDay === 1) return "ontem";
  if (diffDay < 7) return `há ${diffDay} dias`;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return {
    full: d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    relative: formatRelative(d),
  };
}
