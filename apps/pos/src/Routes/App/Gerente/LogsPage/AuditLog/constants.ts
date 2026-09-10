import {
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
} from "@tauri-inventory/types";
import {
  PlusCircle,
  PencilLine,
  Trash2,
  LogIn,
  AlertTriangle,
  AlertOctagon,
  Package,
  Factory,
  Tag,
  Layers,
  User as UserIcon,
  type LucideIcon,
  Timeline,
} from "lucide-react";
import { Item } from "../../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

/** Tamanho de página fixo pela API (limite hardcoded de 100 linhas por resposta). */
export const AUDIT_LOG_PAGE_SIZE = 100;

export const ACAO_CONFIG: Record<
  AuditLogAction,
  { label: string; icon: LucideIcon; className: string }
> = {
  [AuditLogAction.CREATE]: {
    label: "Criação",
    icon: PlusCircle,
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  [AuditLogAction.UPDATE]: {
    label: "Atualização",
    icon: PencilLine,
    className: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  [AuditLogAction.DELETE]: {
    label: "Exclusão",
    icon: Trash2,
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
  [AuditLogAction.LOGIN]: {
    label: "Login",
    icon: LogIn,
    className: "bg-violet-50 text-violet-700 ring-violet-600/20",
  },
};

export const NIVEL_CONFIG: Record<
  AuditLogLevel,
  {
    label: string;
    barClassName: string;
    badgeClassName: string;
    icon?: LucideIcon;
  }
> = {
  [AuditLogLevel.NORMAL]: {
    label: "Normal",
    barClassName: "bg-slate-200",
    badgeClassName: "bg-slate-50 text-slate-600 ring-slate-500/20",
  },
  [AuditLogLevel.AVISO]: {
    label: "Aviso",
    barClassName: "bg-amber-400",
    badgeClassName: "bg-amber-50 text-amber-700 ring-amber-600/20",
    icon: AlertTriangle,
  },
  [AuditLogLevel.CRITICO]: {
    label: "Crítico",
    barClassName: "bg-red-500",
    badgeClassName: "bg-red-50 text-red-700 ring-red-600/20",
    icon: AlertOctagon,
  },
};

export const ALVO_CONFIG: Record<
  AuditLogTargetType,
  { label: string; icon: LucideIcon }
> = {
  [AuditLogTargetType.MERCADORIA]: { label: "Mercadoria", icon: Package },
  [AuditLogTargetType.FABRICANTE]: { label: "Fabricante", icon: Factory },
  [AuditLogTargetType.CATEGORIA]: { label: "Categoria", icon: Tag },
  [AuditLogTargetType.GRUPO]: { label: "Grupo", icon: Layers },
  [AuditLogTargetType.USUARIO]: { label: "Usuário", icon: UserIcon },
  [AuditLogTargetType.ATRIBUTO]: { label: "Atributo", icon: Timeline },
};

export const ALVO_ITEMS: Item[] = [
  { value: AuditLogTargetType.MERCADORIA, label: "Mercadoria" },
  { value: AuditLogTargetType.FABRICANTE, label: "Fabricante" },
  { value: AuditLogTargetType.CATEGORIA, label: "Categoria" },
  { value: AuditLogTargetType.GRUPO, label: "Grupo" },
  { value: AuditLogTargetType.USUARIO, label: "Usuario" },
  { value: AuditLogTargetType.ATRIBUTO, label: "Atributi" },
];

export const ACAO_ITEMS: Item[] = [
  { value: AuditLogAction.CREATE, label: "Criação" },
  { value: AuditLogAction.UPDATE, label: "Atualização" },
  { value: AuditLogAction.DELETE, label: "Exclusão" },
  { value: AuditLogAction.LOGIN, label: "Login" },
];
export const LEVEL_ITEMS: Item[] = [
  { value: AuditLogLevel.AVISO, label: "Aviso" },
  { value: AuditLogLevel.CRITICO, label: "Crítico" },
  { value: AuditLogLevel.NORMAL, label: "Normal" },
];

export const FIELD_LABELS: Record<string, string> = {
  descricao: "Descrição",
  nome: "Nome",
  tipo: "Tipo",
  grupoId: "Grupo",
  fabricanteId: "Fabricante",
  categoriaId: "Categoria",
  estoque02: "Estoque (Loja 02)",
  estoque03: "Estoque (Loja 03)",
  estoque04: "Estoque (Loja 04)",
  precoCusto: "Preço de custo",
  precoVenda: "Preço de venda",
  url: "URL da foto",
  mercadoriaId: "Mercadoria",
  mercadoriaKey: "Key da mercadoria",
  key: "Key",
  createdAt: "Criado em",
  updatedAt: "Alterado em"
};

export const CURRENCY_FIELDS = new Set(["precoCusto", "precoVenda"]);
export const DATE_FIELDS = new Set(["createdAt","updatedAt"])
