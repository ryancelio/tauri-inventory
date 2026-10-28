import { ILoja } from "@tauri-inventory/types";
import {
  Boxes,
  Calendar,
  ChevronRight,
  CreditCard,
  EllipsisVertical,
  Package,
  PackageX,
  Pencil,
  Store,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDataLoader } from "../../../../Routers/AppRoutes/Gerente/Lojas/LojasDataRoute";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLoaderData } from "react-router";
import SimpleMenu from "../../../Components/BASE-UI/SimpleMenu";
import { useMemo, useState } from "react";
import CreateLojaModal from "../CreateLojaModal";
import { loader } from "../LojasPage";

export default function InternalData({
  loja,
  isFetching,
  lojaData,
  onEdit,
  onDelete,
}: {
  loja: ILoja | undefined;
    onEdit: (loja: ILoja | null) => void;
    onDelete: (loja: ILoja) => void;
  isFetching: boolean;
  lojaData: Awaited<ReturnType<typeof getDataLoader>> | undefined;
  }) {


  if (isFetching || !lojaData) {
    return (
      <div className="flex size-full flex-col overflow-y-auto">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="size-12 shrink-0 animate-pulse rounded-xl bg-slate-100" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-5 p-5">
          <div className="h-36 animate-pulse rounded-xl bg-slate-100" />
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!loja) {
    return null;
  }

  const {
    funcionariosAtivos,
    funcionariosInativos,
    mercadoriasPrincipais,
    lojaEstoqueTotal,
  } = lojaData;

  return (
    <>

    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto">
      <StoreHeader loja={loja} onEdit={onEdit} onDelete={onDelete}/>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <StatsPanel
          ativos={funcionariosAtivos.length}
          inativos={funcionariosInativos.length}
          mercadorias={mercadoriasPrincipais.count}
          unidades={lojaEstoqueTotal}
        />

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <FuncionariosCard
            funcionariosAtivos={funcionariosAtivos}
            totalInativos={funcionariosInativos.length}
          />
          <MercadoriasCard loja={loja} data={mercadoriasPrincipais} />
        </div>
      </div>
      </div>
    </>

  );
}

function StoreHeader({ loja, onEdit,onDelete }: { loja: ILoja, onEdit: (loja: ILoja) => void, onDelete: (loja: ILoja) => void; }) {
  const formatCNPJ = (cnpj: string) =>
    cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="shrink-0 border-b border-slate-200 px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <Store size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-slate-800">
              {loja.nome}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              #{loja.id}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard size={13} className="text-slate-400" />
              {formatCNPJ(loja.CNPJ)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              Criado em {formatDate(loja.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={13} className="text-slate-400" />
              Atualizado em {formatDate(loja.updatedAt)}
            </span>
          </div>
        </div>
        <div className="">
          <SimpleMenu
            menuItems={[
              {
                items: [
                  {
                    row: (
                      <div className="flex w-full items-center gap-2">
                        <Pencil size={16} className="text-slate-500" />
                        <span>Editar</span>
                      </div>
                    ),
                    onClick: () => onEdit(loja),
                  },
                  {
                    row: (
                      <div className="flex w-full items-center gap-2 text-red-600">
                        <Trash2 size={16} className="text-red-500" />
                        <span>Excluir</span>
                      </div>
                    ),
                    onClick: () => onDelete(loja),
                  },
                ],
              },
            ]}
          >
            <div
              className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300"
            >
              <EllipsisVertical size={18} />
            </div>
          </SimpleMenu>
        </div>
      </div>
      </div>
  );
}

function StatsPanel({
  ativos,
  inativos,
  mercadorias,
  unidades,
}: {
  ativos: number;
  inativos: number;
  mercadorias: number;
  unidades: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        <Stat
          icon={UserCheck}
          label="Funcionários ativos"
          value={ativos}
          emphasis
        />
        <Stat
          icon={Boxes}
          label="Unidades em estoque"
          value={unidades}
          emphasis
        />
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200">
        <Stat
          icon={Package}
          label="Mercadorias em estoque"
          value={mercadorias}
        />
        <Stat icon={UserX} label="Funcionários inativos" value={inativos} />
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  emphasis = false,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "flex flex-col gap-1 px-5 py-4"
          : "flex flex-col gap-0.5 px-5 py-3"
      }
    >
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon size={14} className="shrink-0 text-slate-400" />
        <span className="truncate">{label}</span>
      </span>
      <span
        className={
          emphasis
            ? "text-3xl font-semibold tracking-tight text-slate-900 tabular-nums"
            : "text-lg font-semibold text-slate-700 tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function CardShell({
  icon: Icon,
  title,
  badge,
  footer,
  delay,
  children,
}: {
  icon: LucideIcon;
  title: string;
  badge: React.ReactNode;
  footer?: React.ReactNode;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay, ease: "easeOut" }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        {badge}
      </div>

      <div className="custom-scrollbar max-h-72 flex-1 overflow-y-auto">
        {children}
      </div>

      {footer && (
        <div className="border-t border-slate-200 px-4 py-2.5">{footer}</div>
      )}
    </motion.div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <Icon size={22} className="text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function FuncionariosCard({
  funcionariosAtivos,
  totalInativos,
}: {
  funcionariosAtivos: { id: number; nome: string; funcao: string }[];
  totalInativos: number;
}) {
  return (
    <CardShell
      icon={Users}
      title="Equipe"
      delay={0.05}
      badge={
        <span className="text-xs font-medium text-slate-500">
          {funcionariosAtivos.length} ativo
          {funcionariosAtivos.length !== 1 && "s"}
        </span>
      }
      footer={
        <p className="text-xs text-slate-500">
          {totalInativos} funcionário{totalInativos !== 1 && "s"} inativo
          {totalInativos !== 1 && "s"}
        </p>
      }
    >
      {funcionariosAtivos.length > 0 ? (
        <div>
          {funcionariosAtivos.map((func, index) => (
            <motion.div
              key={func.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.1,
                delay: Math.min(index * 0.015, 0.12),
              }}
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 transition-colors last:border-none hover:bg-slate-50"
            >
              <span className="truncate text-sm font-medium text-slate-700">
                {func.nome}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 capitalize">
                {func.funcao}
              </span>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          message="Nenhum funcionário ativo nesta loja"
        />
      )}
    </CardShell>
  );
}

function MercadoriasCard({
  loja,
  data,
}: {
  loja: ILoja;
  data: Awaited<ReturnType<typeof getDataLoader>>["mercadoriasPrincipais"];
}) {
  return (
    <CardShell
      icon={Package}
      title="Mercadorias em estoque"
      delay={0.08}
      badge={
        <span className="text-xs font-medium text-slate-500">{data.count}</span>
      }
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Exibindo{" "}
            <span className="font-medium text-slate-700 tabular-nums">
              {data.data.length}
            </span>{" "}
            de{" "}
            <span className="font-medium text-slate-700 tabular-nums">
              {data.count}
            </span>
          </p>
          <Link
            to={`/mercadorias?estoque${loja.id}Positivo=on`}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          >
            Ver todas
            <ChevronRight size={14} />
          </Link>
        </div>
      }
    >
      {data.data.length > 0 ? (
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">
                ID
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500">
                Descrição
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500">
                Estoque
              </th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((merc, index) => {
              const estoqueNaLoja =
                merc.estoque.find((est) => est.loja.id === loja.id)?.estoque ||
                0;
              return (
                <motion.tr
                  key={merc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.1,
                    delay: Math.min(index * 0.015, 0.12),
                  }}
                  className="border-b border-slate-100 transition-colors last:border-none hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-400 tabular-nums">
                    {merc.id}
                  </td>
                  <td className="max-w-0 truncate px-4 py-3 font-medium text-slate-700">
                    {merc.descricao}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex min-w-8 justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        estoqueNaLoja > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {estoqueNaLoja}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <EmptyState
          icon={PackageX}
          message="Sem mercadorias em estoque nesta loja"
        />
      )}
    </CardShell>
  );
}
