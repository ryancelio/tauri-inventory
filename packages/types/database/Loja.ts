import z from "zod";

export interface ILoja{
  id: number;
  nome: string;
  CNPJ: string;
  createdAt: string;
  updatedAt: string;
}

export const createLojaSchema = z.object({
  nome: z.string(),
  CNPJ: z.string(),
})

export type CreateLojaPayload = z.infer<typeof createLojaSchema>;
