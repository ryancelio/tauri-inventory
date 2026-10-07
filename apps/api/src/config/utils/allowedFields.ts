import { IUsuario } from "@tauri-inventory/types";

/**
 * Colunas de `mercadorias` que um usuário não-admin pode alterar.
 *
 * O estoque não aparece aqui: ele não é mais coluna de `mercadorias` (era
 * `estoque02`/`estoque03`/`estoque04`), e sim linhas de `Estoque`, gravadas por
 * `syncEstoque` no controller, que aplica o recorte por loja e valida o tipo.
 * Aqui só entram os campos que vão para o `update` do model.
 */
export function getAllowedFields(user: IUsuario) {
  const defaultFields = [
    "descricao",
    "key",
    "fabricanteId",
    "categoriaId",
    "observacoes",
    "precoCusto",
    "precoVenda",
  ];

  return defaultFields;
}
