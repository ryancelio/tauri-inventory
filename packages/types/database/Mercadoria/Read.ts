import { AtributoTypesType } from "../Atributo.js";
import { ICategoria } from "../Categoria.js";
import { IFabricante } from "../Fabricante.js";
import {
  BaseQuery,
  DateFilter,
  JsonFilter,
  NumberFilter,
  StringFilter,
} from "../FilterBase.js";
import { ILoja } from "../Loja.js";

export interface Caracteristica {
  id: number;
  nome: string;
  tipo: AtributoTypesType;
  valor: string | number | boolean;
}

export interface Estoque{
  id: number;
  estoque: number;
  loja: ILoja;
  createdAt: string;
  updatedAt: string;
}


// Retornado pelo sequelize, para ser enviado ao front-end
export interface IMercadoria {
  id: number;
  key: number;
  descricao: string;
  fabricante: IFabricante;
  categoria: ICategoria;
  /** Estoque por loja. Substitui as antigas colunas `estoque02/03/04`. */
  estoque: Estoque[];
  caracteristicas: Caracteristica[];
  observacoes: string;
  precoCusto: number | string;
  precoVenda: number | string;
  createdAt: string;
  updatedAt: string;
}

// Representação da tabela
export interface MercadoriaDB {
  id: number;
  key: number;
  descricao: string;
  fabricanteId: number;
  categoriaId: number;
  caracteristicas: Caracteristica[];
  observacoes: string;
  precoCusto: number | string;
  precoVenda: number | string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}


export interface MercadoriaReport {
  id: number;
  descricao: string;
  /** Um item por loja com estoque cadastrado. */
  estoque: ReportEstoque[];
  precoCusto: string;
  precoVenda: string;
  fabricante: MercReportFabricante;
}

export interface ReportEstoque {
  loja: ILoja;
  estoque: number;
}

interface MercReportFabricante {
  id: number;
  nome: string;
}

export interface MercadoriaSimple {
  id: number;
  descricao: string;
}


/**
 * Filtro de estoque por loja.
 *
 * A chave é o **id** da loja (`lojas.id`) e o valor é um `NumberFilter`
 * aplicado à coluna `Estoque.estoque` daquela loja.
 *
 * Substitui os campos fixos `estoque02`/`estoque03`/`estoque04`, que eram
 * colunas de `mercadorias`. Como as lojas agora são entidades, o número de
 * lojas é variável e não caberia em chaves fixas.
 *
 * Lojas selecionadas são combinadas com **AND**: `{ "1": { gt: 0 }, "2": { gt: 0 } }`
 * devolve mercadorias com estoque positivo na loja 1 **e** na loja 2 — o mesmo
 * comportamento do `estoque02 > 0 AND estoque03 > 0` anterior.
 *
 * @example
 * // "estoque positivo na loja 1" (checkbox `estoque1Positivo`)
 * { "1": { gt: 0 } }
 */
export type EstoqueFilter = Record<string, NumberFilter>;

export interface MercadoriaInternalFilter {
  id?: NumberFilter;
  key?: NumberFilter;
  descricao?: StringFilter;
  fabricanteId?: NumberFilter;
  categoriaId?: NumberFilter;
  grupoId?: NumberFilter;
  estoque?: EstoqueFilter;
  caracteristicas?: JsonFilter;
  observacoes?: StringFilter;
  precoCusto?: NumberFilter;
  precoVenda?: NumberFilter;
  createdAt?: DateFilter;
  updatedAt?: DateFilter;
}

export interface SimilarMerc {
  id: number;
  key: number;
  descricao: string;
  estoque: Estoque[];
  caracteristicas: Caracteristica[];
  precoVenda: string;
}

export type MercadoriaFilter = BaseQuery<MercadoriaInternalFilter>;

export interface MercadoriaKeyListing {
  id: number;
  key: number;
  descricao: string;
}

/**
 * Qualquer coisa que carregue estoque por loja: `IMercadoria`,
 * `SimilarMerc` e `MercadoriaReport` têm todos um array `estoque`, mas cada um
 * com um item levemente diferente. Só o que os helpers abaixo usam é comum.
 */
type ComEstoquePorLoja = {
  estoque?: { estoque: number | null; loja?: ILoja | null }[];
};

/** Soma o estoque da mercadoria em todas as lojas. */
export function getEstoqueTotal(mercadoria: ComEstoquePorLoja) {
  return (mercadoria.estoque ?? []).reduce(
    (total, item) => total + (item.estoque ?? 0),
    0,
  );
}

/**
 * Estoque da mercadoria numa loja específica, ou `0` se ela não tiver linha
 * em `Estoque` para essa loja.
 */
export function getEstoqueNaLoja(
  mercadoria: ComEstoquePorLoja,
  lojaId: number,
) {
  return (
    (mercadoria.estoque ?? []).find((item) => item.loja?.id === lojaId)
      ?.estoque ?? 0
  );
}

export function getDescricaoCompleta(mercadoria: IMercadoria | SimilarMerc) {
  const cor = mercadoria.caracteristicas.find((c) => c.id === 1)?.valor;
  if (mercadoria.caracteristicas && cor) {
    return `${mercadoria.descricao} ${cor}`;
  } else {
    return mercadoria.descricao;
  }
}

export function getMercadoriaCor(mercadoria: IMercadoria | SimilarMerc) {
  return (
    (mercadoria.caracteristicas &&
      mercadoria.caracteristicas
        .find((c) => c.nome === "cor")
        ?.valor.toString()) ||
    ""
  );
}
