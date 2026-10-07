export type {
  CaracteristicaCreate,
  EstoqueInput,
  MercadoriaCreate,
} from "./Criar.js";
export {
  criarMercadoriaSchema,
  caracteristicasCreateSchema,
  estoqueInputSchema,
} from "./Criar.js";

export type {
  Caracteristica,
  EstoqueFilter,
  IMercadoria,
  MercadoriaDB,
  MercadoriaFilter,
  MercadoriaInternalFilter,
  MercadoriaKeyListing,
  MercadoriaReport,
  MercadoriaSimple,
  ReportEstoque,
  SimilarMerc,
} from "./Read.js";
export {
  getDescricaoCompleta,
  getEstoqueNaLoja,
  getEstoqueTotal,
  getMercadoriaCor,
  Estoque,
} from "./Read.js";

export type { MercadoriaUpdate, SimilarMercUpdate } from "./Atualizar.js";
export {
  updateMercadoriaSchema,
  similarMercUpdateSchema,
} from "./Atualizar.js";
