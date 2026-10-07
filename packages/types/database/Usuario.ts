import { z } from "zod";
import { ILoja } from "./Loja.js";

export type Funcao = "vendedor" | "gerente" | "admin";

export interface IUsuario {
  id: number;
  nome: string;
  funcao: Funcao;
  local: ILoja;
  usuario: string;
  senhaHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioListing {
  id: number;
  nome: string;
  funcao: Funcao;
  local: ILoja;
  usuario: string;
  ativo: boolean,
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null,
}

export interface UsuarioDB {
  id: number;
  nome: string;
  funcao: Funcao;
  lojaId: number;
  usuario: string;
  senhaHash: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}

export const createUsuarioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter mais de 2 caracteres."),
  usuario: z.string().min(2, "Usuario deve ter mais de 2 carcateres"),
  senha: z.string().min(4, "Senha deve ter 4 caracteres ou mais"),
  lojaId: z.number(),
  funcao: z.enum(["vendedor", "gerente", "admin"]),
  ativo: z.boolean().optional(),
});

export type CriarUsuarioPayload = z.infer<typeof createUsuarioSchema>;

export interface UsuarioLogado {
  id: number;
  nome: string;
  funcao: Funcao;
  local: ILoja;
}
