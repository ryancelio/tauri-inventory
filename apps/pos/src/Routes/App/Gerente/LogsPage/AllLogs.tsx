import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { getAllLogs } from "../../../../api/apiLogs";
import { isAuditLogLevel, isAuditLogAction } from "@tauri-inventory/types";
import { AuditLogList } from "./AuditLog/AuditLogsList";
import { getUsuarios } from "../../../../api/apiHelper";
import { Item } from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { AppError } from "../../Errors/AppError";
import { LogHydrateFallback } from "./shared/LogFallback";

export const HydrateFallback = LogHydrateFallback;
export const ErrorBoundary = AppError;

export async function loader({ url }: LoaderFunctionArgs) {
  let page = Number(url.searchParams.get("page"));
  if (page === null || isNaN(page)) page = 1;
  const userId = Number(url.searchParams.get("userId"));
  let action = url.searchParams.get("action");
  let level = url.searchParams.get("level");

  const logs = await getAllLogs({
    page: page || 1,
    userId: userId || undefined,
    action: isAuditLogAction(action) ? action : undefined,
    level: isAuditLogLevel(level) ? level : undefined,
  });

  const users = await getUsuarios(true);

  const usersItems: Item[] = users.map((user) => ({
    label: user.nome,
    value: user.id,
  }));

  return {
    logs,
    usersItems,
  };
}

export function Component() {
  const { logs, usersItems } = useLoaderData<typeof loader>();

  return (
    <AuditLogList
      logs={logs}
      usersItems={usersItems}
      title="Registro de auditoria"
      description="Histórico de ações realizadas no sistema"
    />
  );
}
