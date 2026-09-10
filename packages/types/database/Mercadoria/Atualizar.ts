import z from "zod";
import { caracteristicasCreateSchema } from "./Criar.js";

export const similarMercUpdateSchema = z.object({
  precoCusto: z.number().optional(),
  precoVenda: z.number().optional(),
  caracteristicas: z.array(caracteristicasCreateSchema).optional(),
});

export type SimilarMercUpdate = z.infer<typeof similarMercUpdateSchema>;

export const updateMercadoriaSchema = z.object({
  id: z.int().optional().nullable(),
  key: z.int().min(1).optional(),
  descricao: z.string().optional(),
  fabricanteId: z.int().min(1).optional(),
  categoriaId: z.int().min(1).optional(),
  estoque02: z.int().optional(),
  estoque03: z.int().optional(),
  estoque04: z.int().optional(),
  caracteristicas: z.array(caracteristicasCreateSchema).optional(),
  observacoes: z.string().optional(),
  precoCusto: z.number().optional(),
  precoVenda: z.number().optional(),
});

export type MercadoriaUpdate = z.infer<typeof updateMercadoriaSchema>;