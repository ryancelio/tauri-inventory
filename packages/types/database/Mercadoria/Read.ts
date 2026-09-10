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

export interface Caracteristica {
  id: number;
  nome: string;
  tipo: AtributoTypesType;
  valor: string | number | boolean;
}


// Retornado pelo sequelize, para ser enviado ao front-end
export interface IMercadoria {
  id: number;
  key: number;
  descricao: string;
  fabricante: IFabricante;
  categoria: ICategoria;
  estoque02: number;
  estoque03: number;
  estoque04: number;
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
  estoque02: number;
  estoque03: number;
  estoque04: number;
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
  estoque02: number;
  estoque03: number;
  estoque04: number;
  precoCusto: string;
  precoVenda: string;
  fabricante: MercReportFabricante;
}

interface MercReportFabricante {
  id: number;
  nome: string;
}

export interface MercadoriaSimple {
  id: number;
  descricao: string;
}


export interface MercadoriaInternalFilter {
  id?: NumberFilter;
  key?: NumberFilter;
  descricao?: StringFilter;
  fabricanteId?: NumberFilter;
  categoriaId?: NumberFilter;
  grupoId?: NumberFilter;
  estoque02?: NumberFilter;
  estoque03?: NumberFilter;
  estoque04?: NumberFilter;
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
  estoque02: number;
  estoque03: number;
  estoque04: number;
  caracteristicas: Caracteristica[];
  precoVenda: string;
}

export type MercadoriaFilter = BaseQuery<MercadoriaInternalFilter>;

export interface MercadoriaKeyListing {
  id: number;
  key: number;
  descricao: string;
}

export function getEstoqueTotal(mercadoria: IMercadoria | SimilarMerc) {
  return mercadoria.estoque02 + mercadoria.estoque03 + mercadoria.estoque04;
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