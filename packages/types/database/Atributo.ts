import z from "zod"

export interface IAtributo {
  id: number;
  nome: string;
  tipo: AtributoTypesType;
  createdAt: string;
  updatedAt: string;
}

export interface IAtributoDB {
  id: number;
  nome: string;
  tipo: AtributoTypesType;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export const atributoCreateSchema = z.object({
id: z.int().optional(),
nome: z.string(),
tipo: z.literal(["text","number","boolean"])
})

export type atributoCreate = z.infer<typeof atributoCreateSchema>

export const atributoUpdateSchema = z.object({
id: z.int().optional(),
nome: z.string().optional(),
tipo: z.literal(["text","number","boolean"]).optional()
})

export type atributoUpdate = z.infer<typeof atributoUpdateSchema>


// export interface AtributoCreate {
//   id?: number;
//   nome: string;
//   tipo: AtributoTypesType;
// }

export interface MercadoriaAtributos {
  mercadoriaId: number | string;
  atributoId: number | string;
  valor: string | number | boolean;
}

export type AtributoTypesType = "text" | "number" | "boolean";
