import { IUsuario, MercadoriaCreate, MercadoriaUpdate } from "@tauri-inventory/types";

export function getAllowedFields(user: IUsuario, mercadoria: MercadoriaCreate | MercadoriaUpdate) {
  let defaultFields = [
    "descricao",
    "key",
    "fabricanteId",
    "categoriaId",
    "observacoes",
    "precoCusto",
    "precoVenda",
  ];
  switch (user.local) {
    case "02":
      defaultFields.push("estoque02");
      delete mercadoria.estoque03;
      delete mercadoria.estoque04;
      break;
    case "03":
      defaultFields.push("estoque03");
      delete mercadoria.estoque02;
      delete mercadoria.estoque04;
      break;
    case "04":
      defaultFields.push("estoque04");
      delete mercadoria.estoque02;
      delete mercadoria.estoque03;
      break;
  }

  return defaultFields;
}
