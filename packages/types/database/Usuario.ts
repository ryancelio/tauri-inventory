import { z } from "zod";

export type Funcao = "vendedor" | "gerente" | "admin";
export type Local = "02" | "03" | "04";

export interface IUsuario {
  id: number;
  nome: string;
  funcao: Funcao;
  local: Local;
  usuario: string;
  senhaHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioListing {
  id: number;
  nome: string;
  funcao: Funcao;
  local: Local;
  usuario: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsuarioDB {
  id: number;
  nome: string;
  funcao: Funcao;
  local: Local;
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
  local: z.enum(["02", "03", "04"]),
  funcao: z.enum(["vendedor", "gerente", "admin"]),
});

export type CriarUsuarioPayload = z.infer<typeof createUsuarioSchema>;

// export interface CriarUsuarioPayload {
//   nome: string;
//   usuario: string;
//   senha: string;
//   local: Local;
//   funcao: Funcao;
// }

export interface UsuarioLogado {
  id: number;
  nome: string;
  funcao: Funcao;
  local: Local;
}
