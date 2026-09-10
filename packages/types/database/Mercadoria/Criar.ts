import z from "zod";

export const caracteristicasCreateSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type CaracteristicaCreate = z.infer<typeof caracteristicasCreateSchema>;


export const criarMercadoriaSchema = z.object({
  id: z.int().min(1).optional(),
  key: z.int().min(1).optional(),
  descricao: z.string(),
  fabricanteId: z.int().min(1),
  categoriaId: z.int().min(1),
  estoque02: z.int().optional(),
  estoque03: z.int().optional(),
  estoque04: z.int().optional(),
  caracteristicas: z.array(caracteristicasCreateSchema).optional(),
  observacoes: z.string().optional(),
  precoCusto: z.number().optional(),
  precoVenda: z.number().optional(),
});

export type MercadoriaCreate = z.infer<typeof criarMercadoriaSchema>;


