import { useCallback, useMemo, type ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";
import { LogRow } from "./LogRow";
import { EmptyState } from "../shared/EmptyState";
import { usePageParam, Pagination } from "../shared/pagination";
import { AuditLog } from "@tauri-inventory/types";
import { ACAO_ITEMS, AUDIT_LOG_PAGE_SIZE, LEVEL_ITEMS } from "./constants";
import UISelect from "../../../Components/BASE-UI/Select";
import AutoCompleteDropdown, {
  Item,
} from "../../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { Form, useNavigation, useSearchParams } from "react-router";
import { motion } from "motion/react";

interface AuditLogListProps {
  logs: { data: AuditLog[]; count: number };
  title: string;
  description?: string;
  usersItems: Item[];
  /** Ex.: filtros específicos da página (select de mercadoria, usuário, etc.) */
  actions?: ReactNode;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
}

export function useFilterParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateFilters = useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([key, value]) => {
            if (!value) next.delete(key);
            else next.set(key, value);
          });
          // filtering should reset pagination — but do it explicitly, not by accident
          if (Object.keys(patch).some((k) => k !== "page")) {
            next.delete("page");
          }
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  return { searchParams, updateFilters };
}

/**
 * Listagem de logs de auditoria, reutilizável em qualquer página:
 * geral, por mercadoria, por usuário, por fabricante, por loja etc.
 * A página só precisa buscar `logs` (já filtrado/paginado pelo loader)
 * e passar aqui — paginação e apresentação ficam por conta deste componente.
 */
export function AuditLogList({
  logs,
  title,
  description,
  actions,
  emptyMessage = "Nenhum registro encontrado",
  emptyIcon,
  usersItems,
}: AuditLogListProps) {
  const [page] = usePageParam();
  const isEmpty = logs.data.length === 0;
  const navigation = useNavigation();

  const { searchParams, updateFilters } = useFilterParams();
  const action = searchParams.get("action") ?? undefined;
  const level = searchParams.get("level") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;

  // derived, not duplicated — always in sync with the URL, no matter who changes it
  const actionItem = useMemo(
    () => ACAO_ITEMS.find((i) => i.value === action) ?? null,
    [action],
  );
  const levelItem = useMemo(
    () => LEVEL_ITEMS.find((i) => i.value === level) ?? null,
    [level],
  );
  const userIdItem = useMemo(
    () => usersItems.find((i) => i.value == userId) ?? null,
    [userId, usersItems],
  );

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col px-5 py-5">
      <header className="shrink-0 border-b border-slate-200 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="truncate text-lg font-semibold tracking-tight text-slate-900"
            >
              {title}
            </motion.h1>

            {description && (
              <motion.p
                key={description}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="mt-0.5 truncate text-sm text-slate-500"
              >
                {description}
              </motion.p>
            )}
          </div>

          <div className="shrink-0 text-right">
            <motion.div
              key={logs.count}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-2xl font-semibold text-slate-900 tabular-nums"
            >
              {logs.count}
            </motion.div>

            <p className="text-xs text-slate-500">
              {logs.count === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>

        <Form
          method="GET"
          className={`mt-4 grid w-full grid-cols-1 items-start gap-3 ${
            actions ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"
          }`}
        >
          {actions}

          <UISelect
            items={ACAO_ITEMS}
            name="action"
            label="Ação"
            allowEmpty
            value={actionItem}
            onValueChange={(item) =>
              updateFilters({ action: item?.value?.toString() })
            }
          />

          <UISelect
            items={LEVEL_ITEMS}
            name="level"
            label="Nível"
            placeholder="Nível do log"
            allowEmpty
            value={levelItem}
            onValueChange={(item) =>
              updateFilters({ level: item?.value?.toString() })
            }
          />

          <AutoCompleteDropdown
            label="Usuário"
            items={usersItems}
            name="userId"
            placeholder="Usuário"
            textSize="small"
            classNames={{ input: "bg-white" }}
            selectedItem={userIdItem}
            setSelectedItem={(item) =>
              updateFilters({ userId: item?.value?.toString() })
            }
          />
        </Form>
      </header>

      <div className="relative min-h-0 flex-1 pt-4">
        {navigation.state !== "idle" && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {isEmpty ? (
          <EmptyState message={emptyMessage} icon={emptyIcon} />
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="flex flex-col gap-2.5">
                {logs.data.map((log, index) => (
                  <LogRow key={log.id} log={log} index={index} />
                ))}
              </div>
            </div>

            <div className="h-fit shrink-0">
              <Pagination
                page={page}
                pageSize={AUDIT_LOG_PAGE_SIZE}
                total={logs.count}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
