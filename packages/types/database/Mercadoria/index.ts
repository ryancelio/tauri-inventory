export type { CaracteristicaCreate, MercadoriaCreate } from "./Criar.js";
export { criarMercadoriaSchema, caracteristicasCreateSchema } from "./Criar.js";

export type {
  Caracteristica,
  IMercadoria,
  MercadoriaDB,
  MercadoriaFilter,
  MercadoriaInternalFilter,
  MercadoriaKeyListing,
  MercadoriaReport,
  MercadoriaSimple,
  SimilarMerc,
} from "./Read.js";
export {
  getDescricaoCompleta,
  getEstoqueTotal,
  getMercadoriaCor,
} from "./Read.js";

export type { MercadoriaUpdate, SimilarMercUpdate } from "./Atualizar.js";
export {
  updateMercadoriaSchema,
  similarMercUpdateSchema,
} from "./Atualizar.js";
