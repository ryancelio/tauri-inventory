import { ILoja } from "@tauri-inventory/types";
import {
  Boxes,
  Calendar,
  ChevronRight,
  CreditCard,
  Loader2,
  Package,
  PackageX,
  Store,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getDataLoader } from "../../../../Routers/AppRoutes/Gerente/Lojas/LojasDataRoute";
import { motion } from "motion/react";
import { Link } from "react-router";

export default function InternalData({
  selectedLoja,
  isFetching,
  lojaData,
}: {
  selectedLoja: ILoja | null;
  isFetching: boolean;
  lojaData: Awaited<ReturnType<typeof getDataLoader>> | undefined;
}) {
  if (isFetching || !lojaData) {
    return (
      <div className="flex size-full flex-col gap-2 overflow-y-auto">
        <div className="h-24 shrink-0 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/60 px-6 py-5" >
          <div className="h-full rounded-lg w-1/2 bg-slate-100 animate-pulse"/>
        </div>

        <div className="p-4 flex-col flex gap-6">
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 w-full shrink animate-pulse rounded-xl bg-slate-100 shadow-sm"
              />
            ))}
          </div>
          <div className="flex gap-5">
            {[1, 2].map((i) => (
              <div key={i}
              className="h-40 w-full shrink animate-pulse rounded-xl bg-slate-100 shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedLoja) {
    return null;
  }

  const {
    funcionariosAtivos,
    funcionariosInativos,
    mercadoriasPrincipais,
    lojaEstoqueTotal,
  } = lojaData;

  return (
    <div className="custom-scrollbar flex h-full flex-col overflow-y-auto">
      <StoreHeader loja={selectedLoja} />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            icon={UserCheck}
            label="Funcionários ativos"
            value={funcionariosAtivos.length}
            tone="blue"
            delay={0}
          />
          <KpiCard
            icon={UserX}
            label="Funcionários inativos"
            value={funcionariosInativos.length}
            tone="slate"
            delay={0.03}
          />
          <KpiCard
            icon={Package}
            label="Mercadorias em estoque"
            value={mercadoriasPrincipais.count}
            tone="emerald"
            delay={0.06}
          />
          <KpiCard
            icon={Boxes}
            label="Unidades em estoque"
            value={lojaEstoqueTotal}
            tone="violet"
            delay={0.09}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FuncionariosCard
            funcionariosAtivos={funcionariosAtivos}
            totalInativos={funcionariosInativos.length}
          />
          <MercadoriasCard loja={selectedLoja} data={mercadoriasPrincipais} />
        </div>
      </div>
    </div>
  );
}

function StoreHeader({ loja }: { loja: ILoja }) {
  const formatCNPJ = (cnpj: string) =>
    cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="shrink-0 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/60 px-6 py-5">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-xs">
          <Store size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-slate-800">
              {loja.nome}
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              #{loja.id}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard size={14} className="text-slate-400" />
              {formatCNPJ(loja.CNPJ)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              Criado em {formatDate(loja.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              Atualizado em {formatDate(loja.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const KPI_TONES = {
  blue: "bg-blue-50 text-blue-600",
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600",
} as const;

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: keyof typeof KPI_TONES;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors hover:border-blue-200"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${KPI_TONES[tone]}`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-slate-800 tabular-nums">
          {value}
        </p>
        <p className="text-xs leading-tight text-slate-500">{label}</p>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: 0.05, ease: "easeOut" }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">Equipe</h3>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {funcionariosAtivos.length} ativo
          {funcionariosAtivos.length !== 1 && "s"}
        </span>
      </div>

      <div className="custom-scrollbar max-h-64 flex-1 overflow-y-auto p-3">
        {funcionariosAtivos.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {funcionariosAtivos.map((func, index) => (
              <motion.div
                key={func.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.015 }}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 transition-colors hover:bg-slate-50"
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
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Users size={22} className="text-slate-300" />
            <p className="text-sm text-slate-500">
              Nenhum funcionário ativo nesta loja
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-2">
        <p className="text-xs text-slate-500">
          {totalInativos} funcionário{totalInativos !== 1 && "s"} inativo
          {totalInativos !== 1 && "s"}
        </p>
      </div>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: 0.08, ease: "easeOut" }}
      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-800">
            Mercadorias em estoque
          </h3>
        </div>
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {data.count}
        </span>
      </div>

      <div className="custom-scrollbar max-h-64 flex-1 overflow-y-auto">
        {data.data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">
                  Descrição
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">
                  Estoque
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((merc) => {
                const estoqueNaLoja =
                  merc.estoque.find((est) => est.loja.id === loja.id)
                    ?.estoque || 0;
                return (
                  <tr
                    key={merc.id}
                    className="border-b border-slate-50 transition-colors last:border-none hover:bg-slate-50"
                  >
                    <td className="px-4 py-2 text-slate-400 tabular-nums">
                      {merc.id}
                    </td>
                    <td className="max-w-0 truncate px-4 py-2 font-medium text-slate-700">
                      {merc.descricao}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          estoqueNaLoja > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {estoqueNaLoja}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <PackageX size={22} className="text-slate-300" />
            <p className="text-sm text-slate-500">
              Sem mercadorias em estoque nesta loja
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2">
        <p className="text-xs text-slate-500">
          Exibindo{" "}
          <span className="font-semibold text-slate-700 tabular-nums">
            {data.data.length}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-slate-700 tabular-nums">
            {data.count}
          </span>
        </p>
        <Link
          to={`/mercadorias?estoque${loja.id}Positivo=on`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
        >
          Ver todas
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}
