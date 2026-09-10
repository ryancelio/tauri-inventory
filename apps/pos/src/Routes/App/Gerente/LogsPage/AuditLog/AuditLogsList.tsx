import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ChevronDown, Loader2, type LucideIcon } from "lucide-react";
import { LogRow } from "./LogRow";
import { EmptyState } from "../shared/EmptyState";
import { usePageParam, Pagination } from "../shared/pagination";
import { AuditLog } from "@tauri-inventory/types";
import { ACAO_ITEMS, AUDIT_LOG_PAGE_SIZE, LEVEL_ITEMS } from "./constants";
import UISelect from "../../../Components/BASE-UI/Select";
import AutoCompleteDropdown, {
  Item,
} from "../../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import {
  Form,
  useLocation,
  useNavigation,
  useSearchParams,
} from "react-router";
import { AnimatePresence, motion } from "motion/react";

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

      console.log(patch)
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
 * geral, por mercadoria, por usuário, por fabricante etc.
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
  // formRef,
}: AuditLogListProps) {
  const [page] = usePageParam();
  const isEmpty = logs.data.length === 0;
  const navigation = useNavigation();

  // const [searchParams,setSearchParams] = useSearchParams();
  const { searchParams, updateFilters } = useFilterParams();
  const action = searchParams.get("action") ?? undefined;
  const level = searchParams.get("level") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;

  const hasFilter = action !== undefined || level !== undefined || userId !== undefined;

  useEffect(() => {
  if (hasFilter) {
    setExpanded(true);
  }
}, [hasFilter]);

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


  const [expanded, setExpanded] = useState(hasFilter);

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header
        className={`relative flex w-full shrink-0 flex-col gap-4 overflow-clip border-b border-slate-200 transition-[max-height] duration-300 ease-out ${
          expanded ? "max-h-56 pb-12" : "max-h-36 pb-4"
        }`}
      >
        <div className="flex w-full flex-wrap justify-between">
          <AnimatePresence>
            <div>
              <motion.h1
                key={title}
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                className="text-xl font-semibold tracking-tight text-slate-900"
              >
                {title}
              </motion.h1>

              {description && (
                <motion.p
                  key={description}
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  className="mt-0.5 text-sm text-slate-500"
                >
                  {description}
                </motion.p>
              )}
            </div>
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <AnimatePresence>
                <motion.div
                  key={logs.count}
                  initial={{ opacity: 0.2, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", duration: 0.35 }}
                  className="text-2xl font-semibold text-slate-900 tabular-nums"
                >
                  {logs.count}
                </motion.div>

                <p className="text-xs text-slate-500" key={"logs label"}>
                  {logs.count === 1 ? "registro" : "registros"}
                </p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Form
          // ref={formRef}
          method="GET"
          // key={location.pathname.split("/")[3] + location.search}
          className="grid w-full grid-cols-4 items-center gap-2"
        >
          {actions && (
            <div className="col-span-4">
              <div className="flex items-center justify-between gap-4">
                {actions}
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="grid size-8 place-items-center rounded-full bg-gray-200/40 transition-transform duration-300 hover:bg-gray-200 hover:shadow-sm"
                  style={{
                    transform: expanded ? "rotate(180deg)" : undefined,
                  }}
                >
                  <ChevronDown />
                </button>
              </div>
            </div>
          )}

          <UISelect
            items={ACAO_ITEMS}
            name="action"
            onValueChange={(item) =>{
              updateFilters({ action: item?.value?.toString() })}
            }
            label="Ação"
            // defaultValue={}
            value={actionItem}
            allowEmpty
            disabled={actions !== undefined && !expanded}
          />

          <UISelect
            items={LEVEL_ITEMS}
            label="Nível"
            placeholder="Nivel da log"
            onValueChange={(item) =>
                {console.log(item);
              updateFilters({ level: item?.value?.toString() })}
            }
            allowEmpty
            // defaultValue={level ? LEVEL_ITEMS.find((item) => item.value == level) : null}
            value={levelItem}
            disabled={actions !== undefined && !expanded}
            name="level"
          />

          <AutoCompleteDropdown
            label="Usuario"
            items={usersItems}
            name="userId"
            placeholder="Usuario"
            disabled={actions !== undefined && !expanded}
            classNames={{ input: "bg-white" }}
            setSelectedItem={(item) =>
              updateFilters({ userId: item?.value?.toString() })
            }
            selectedItem={userIdItem}
          />
        </Form>
      </header>

      <div className="relative min-h-0 flex-1">
        {navigation.state !== "idle" && (
          <>
            <motion.div className="absolute top-0 left-0 z-99 size-full animate-pulse bg-slate-100/75 shadow-[0_0_15px_10px_#f1f5f9] backdrop-blur-sm delay-100" />
            <Loader2
              strokeWidth={1}
              className="absolute top-1/2 left-1/2 z-100 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin text-slate-400 drop-shadow-sm"
            />
          </>
        )}
        {isEmpty ? (
          <EmptyState message={emptyMessage} icon={emptyIcon} />
        ) : (
          <div className="flex h-full min-h-0 flex-col gap-2.5">
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <div className="flex flex-col gap-2.5">
                <AnimatePresence>
                  {logs.data.map((log, index) => (
                    <LogRow key={log.id} log={log} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="shrink-0">
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
