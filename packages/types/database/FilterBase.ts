interface RangeOptions<T> {
  gt?: T;
  lt?: T;
  gte?: T;
  lte?: T;
}
interface Equal<T> {
  eq?: T;
}
interface In<T> {
  in?: T[];
}

export type NumberFilter = Equal<number> | RangeOptions<number>;

export type StringFilter = Equal<String> | { contains?: string };

export type DateFilter = Equal<String> | RangeOptions<string>;

export type EnumFilter<T> = Equal<T> | In<T>;

export type ArrayFilter<T> = {
  in?: T[];
};
export type JsonFilter = Record<
  string,
  StringFilter | NumberFilter | EnumFilter<string | number | boolean>
>;

export interface BaseQuery<T> {
  page?: number;
  limit?: number;
  /**
   * Coluna usada para ordenar. Só colunas reais da tabela são aceitas — cada
   * recurso pode ampliar a lista (mercadorias aceita também `estoqueTotal` e
   * `estoque.<lojaId>`); valor fora do whitelist é ignorado em vez de quebrar
   * a query.
   */
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  include?: string[];
  filter?: T;
}
