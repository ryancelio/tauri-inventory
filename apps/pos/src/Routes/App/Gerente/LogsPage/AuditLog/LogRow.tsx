import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { ACAO_CONFIG, NIVEL_CONFIG, ALVO_CONFIG } from "./constants";
import { formatDateTime } from "./format";
import { LogDetails } from "./LogDetails";
import { AuditLog, AuditLogLevel } from "@tauri-inventory/types";
import { getLogRedirectTarget } from "../shared/RowRedirect";
import { useNavigate, useSearchParams } from "react-router";
import { Menu } from "@base-ui/react";
import MenuComponent from "../../../Components/BASE-UI/Menu";

export function LogRow({ log, index }: { log: AuditLog; index: number }) {
  const navigate = useNavigate();
  const menuHandle = Menu.createHandle();

  const [expanded, setExpanded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const action = searchParams.get("action") || undefined;
  const level = searchParams.get("level") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;

  const prefersReducedMotion = useReducedMotion();

  const acao = ACAO_CONFIG[log.acao];
  const nivel = NIVEL_CONFIG[log.nivel];
  const alvo = ALVO_CONFIG[log.alvoTipo];
  const AcaoIcon = acao.icon;
  const AlvoIcon = alvo.icon;
  const NivelIcon = nivel.icon;

  const { full, relative } = formatDateTime(log.data);
  const hasDetails = Boolean(log.dados?.alteracoes || log.dados?.criacao);

  const nome = log.Usuario?.nome;
  const initials = nome
    ? nome
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className="group relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${nivel.barClassName}`}
        aria-hidden
      />

      <div
        onClick={() => {
          if (!hasDetails) {
            return;
          }
          setExpanded((e) => !e);
        }}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-4 py-3.5 pr-4 pl-5 text-left ${
          hasDetails ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${acao.className}`}
        >
          <AcaoIcon className="h-4 w-4" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-slate-900">{acao.label}</span>
            <span
              className="group/clickable inline-flex cursor-pointer items-center gap-1 text-sm text-slate-500 hover:text-blue-500"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!log.alvoId) {
                  return;
                }
                const redirectTarget = await getLogRedirectTarget(
                  log.alvoTipo,
                  log.alvoId,
                );
                if (redirectTarget) {
                  navigate(redirectTarget);
                }
              }}
            >
              <AlvoIcon className="h-3.5 w-3.5" />
              {alvo.label}
              {log.alvoId != null && (
                <span className="font-mono text-xs text-slate-400 group-hover/clickable:text-blue-400">
                  #{log.alvoId}
                </span>
              )}
            </span>
            {log.nivel !== AuditLogLevel.NORMAL && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${nivel.badgeClassName}`}
              >
                {NivelIcon && <NivelIcon className="h-3 w-3" />}
                {nivel.label}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <Menu.Trigger
              className="flex flex-wrap items-center hover:text-blue-500"
              handle={menuHandle}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                  {initials}
                </span>
                {nome ?? "Sistema"}
                {log.Usuario?.funcao && (
                  <span className="text-slate-400">· {log.Usuario.funcao}</span>
                )}
              </span>
            </Menu.Trigger>
            {log.ip && <span className="font-mono">{log.ip}</span>}
          </div>

          <MenuComponent
            menuHandle={menuHandle}
            items={[
              {
                // action: () => navigate(`?userId=${log.Usuario?.id}`),
                action: () =>
                  setSearchParams((searchParams) => {
                    searchParams.set(
                      "userId",
                      log.Usuario?.id.toString() || "",
                    );
                    return searchParams;
                  }),
                label: `Ações realizadas por ${log.Usuario?.nome}`,
              },
              {
                action: () =>
                  navigate(
                    `/gerente/logs/usuarios?userIdTarget=${log.Usuario?.id}`,
                  ),
                label: `Alterações realizadas sob ${log.Usuario?.nome}`,
              },
            ]}
          />
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-right text-xs text-slate-400" title={full}>
            <span className="block text-slate-500">{relative}</span>
            <span className="hidden sm:block">{full}</span>
          </span>
          {hasDetails && (
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-600"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 pl-13">
              <LogDetails dados={log.dados} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
