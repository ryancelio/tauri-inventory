import { MercadoriaCreate } from "@tauri-inventory/types";

export function formDataToMercadoria(formData: FormData): MercadoriaCreate{
  const data: Record<string, any> = Object.fromEntries(formData.entries());

  // Transforma Estoque, Key, preco e ID de String para numero
  for (const key in data) {
    // Nova regra: Define como undefined se for string vazia para essas chaves específicas
    if (
      data[key] === "" &&
      ["id", "key", "updatedAt", "createdAt"].includes(key)
    ) {
      data[key] = undefined;
      continue; // Pula a etapa de conversão numérica abaixo para esta chave
    }

    if (/(preco|estoque)/i.test(key)) {
      if (data[key] === "") {
        data[key] = 0;
        continue;
      }
      const num = Number(data[key]);
      if (!isNaN(num)) {
        data[key] = num;
      }
    }

    if (/(id|preco|estoque|key)/i.test(key)) {
      const num = Number(data[key]);
      if (data[key] !== "" && !isNaN(num)) {
        data[key] = num;
      }
    }
  }

  // Monta o array de caracteristicas a partir dos campos caracteristicas[i][key/value]
  const caracteristicasArray = Object.keys(data).reduce((acc: any[], key) => {
    const match = key.match(/^caracteristicas\[(\d+)\]\[(key|value)\]$/);

    if (match) {
      const index = parseInt(match[1], 10);
      const field = match[2];

      if (!acc[index]) acc[index] = {};
      acc[index][field] = data[key];
    }
    return acc;
  }, []);

  const caracteristicas = caracteristicasArray
    .filter(Boolean)
    .filter(
      (item) => item.key !== undefined && item.key !== null && item.key !== "",
    )
    .map((item) => ({
      key: String(item.key),
      value: item.value,
    }));

  const payload: Record<string, any> = {
    ...data,
    caracteristicas: caracteristicas.length > 0 ? caracteristicas : null,
  };

  Object.keys(payload).forEach((key) => {
    if (key.startsWith("caracteristicas[")) delete payload[key];
  });

  if (payload.cor) {
    if (!payload.caracteristicas) {
      payload.caracteristicas = [{ key: "1", value: payload.cor }];
    } else {
      payload.caracteristicas = [
        ...payload.caracteristicas.filter((c: any) => c.key !== "1"),
        { key: "1", value: payload.cor },
      ];
    }

    delete payload.cor;
  }
  
  if(payload.grupoId) delete payload.grupoId;

  
  return payload as MercadoriaCreate;
}
