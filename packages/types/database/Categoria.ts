import z from "zod";

export interface CategoriaGrupo {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategoria {
  id: number;
  nome: string;
  grupo: CategoriaGrupo;
  createdAt: string;
  updatedAt: string;
}

export const categoriaCreateSchema = z.object({
  id: z.int().optional(),
  nome: z.string(),
  grupoId: z.int(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type CategoriaCreate = z.infer<typeof categoriaCreateSchema>

export const categoriaUpdateSchema = z.object({
  id: z.int().optional(),
  nome: z.string().optional(),
  grupoId: z.int().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type CategoriaUpdate = z.infer<typeof categoriaUpdateSchema>

export interface CategoriaDB {
  id: number;
  nome: string;
  grupoId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

