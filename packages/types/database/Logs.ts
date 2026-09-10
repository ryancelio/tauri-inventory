import type { AtributoTypesType } from "./Atributo.js";
import { Caracteristica } from "./Mercadoria/index.js";
import { UsuarioLogado } from "./Usuario.js";

export enum AuditLogTargetType {
  MERCADORIA = "MERCADORIA",
  FABRICANTE = "FABRICANTE",
  CATEGORIA = "CATEGORIA",
  GRUPO = "GRUPO",
  USUARIO = "USUARIO",
  ATRIBUTO = "ATRIBUTO",
}

export function isAuditLogTargetType(
  value: string | null,
): value is AuditLogTargetType {
  if (!value) return false;

  return Object.values(AuditLogTargetType).includes(
    value as AuditLogTargetType,
  );
}

export enum AuditLogAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  //   LOGOUT = "LOGOUT",
}
export function isAuditLogAction(
  value: string | null,
): value is AuditLogAction {
  if (!value) return false;
  return Object.values(AuditLogAction).includes(value as AuditLogAction);
}

export enum AuditLogLevel {
  NORMAL = "NORMAL",
  AVISO = "AVISO",
  CRITICO = "CRITICO",
}

export function isAuditLogLevel(value: string | null): value is AuditLogLevel {
  if (!value) return false;
  return Object.values(AuditLogLevel).includes(value as AuditLogLevel);
}

export type AuditChanges<T> = {
  [K in keyof T]?: {
    anterior: T[K];
    novo: T[K];
  };
};

export interface AuditData<T> {
  alteracoes?: AuditChanges<T>;
  criacao?: T;
}

export type PossibleLogs =
  | AtributoLog
  | GrupoLog
  | KeyPhotoLog
  | CategoriaLog
  | FabricanteLog
  | MercadoriaLog
  | MercadoriaPhotoLog;

export interface AuditLog {
  id: number;
  Usuario?: UsuarioLogado;
  alvoTipo: AuditLogTargetType;
  alvoId: number | null;
  acao: AuditLogAction;
  nivel: AuditLogLevel;
  dados: AuditData<PossibleLogs> | null;
  data: Date;
  ip: string | null;
}

export interface logCreate {
  usuarioId: number;
  alvoTipo: AuditLogTargetType;
  alvoId?: number | null;
  acao: AuditLogAction;
  nivel?: AuditLogLevel;
  dados?: AuditData<PossibleLogs> | null;
  data: Date;
  ip?: string | null;
}

export interface AtributoLog {
  id: number;
  nome: string;
  tipo: AtributoTypesType;
}

export interface CategoriaLog {
  id: number;
  nome: string;
  grupoId: number;
}

export interface FabricanteLog {
  id: number;
  nome: string;
}

export interface GrupoLog {
  id: number;
  nome: string;
}

export interface MercadoriaLog {
  id: number;
  key: number;
  descricao: string;
  fabricanteId: number;
  categoriaId: number;
  estoque02: number;
  estoque03: number;
  estoque04: number;
  caracteristicas: Caracteristica[],
  precoCusto: number | string;
  precoVenda: number | string;
}

export interface MercadoriaPhotoLog {
  id: number;
  url: string;
  mercadoriaId: number;
}

export interface KeyPhotoLog {
  id: number;
  url: string;
  mercadoriaKey: number;
}
