import z from "zod";

export const caracteristicasCreateSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type CaracteristicaCreate = z.infer<typeof caracteristicasCreateSchema>;


/**
 * Estoque de uma mercadoria numa loja.
 *
 * Substitui as colunas fixas `estoque02`/`estoque03`/`estoque04`: como as lojas
 * são entidades com quantidade variável, o estoque é uma lista indexada por
 * `lojaId` e gravada na tabela `Estoque`.
 */
export const estoqueInputSchema = z.object({
  lojaId: z.int().min(1),
  // Sem `.min(0)`: as colunas antigas (`z.int()`) aceitavam saldo negativo, e
  // estoque negativo é legítimo (venda a entregar, ajuste de inventário).
  estoque: z.int(),
});

export type EstoqueInput = z.infer<typeof estoqueInputSchema>;

export const criarMercadoriaSchema = z.object({
  id: z.int().min(1).optional(),
  key: z.int().min(1).optional(),
  descricao: z.string(),
  fabricanteId: z.int().min(1),
  categoriaId: z.int().min(1),
  estoque: z.array(estoqueInputSchema).optional(),
  // `.nullable()` porque `formDataHelper` manda `null` quando a mercadoria não
  // tem nenhuma característica — sem isso o POST voltava 400.
  caracteristicas: z.array(caracteristicasCreateSchema).nullable().optional(),
  observacoes: z.string().optional(),
  precoCusto: z.number().optional(),
  precoVenda: z.number().optional(),
});

export type MercadoriaCreate = z.infer<typeof criarMercadoriaSchema>;


