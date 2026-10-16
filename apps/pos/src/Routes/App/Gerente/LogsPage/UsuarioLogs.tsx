import { User } from "lucide-react";
import { useMemo } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { AuditLogList, useFilterParams } from "./AuditLog/AuditLogsList";
import {
  ApiListResponse,
  AuditLog,
  isAuditLogAction,
  isAuditLogLevel,
} from "@tauri-inventory/types";
import { getLogsUsuario } from "../../../../api/apiLogs";
import { getUsuarios } from "../../../../api/apiHelper";
import AutoCompleteDropdown, {
  Item,
} from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { AppError } from "../../Errors/AppError";
import { LogHydrateFallback } from "./shared/LogFallback";

export const HydrateFallback = LogHydrateFallback;
export const ErrorBoundary = AppError;

export async function loader({ url }: LoaderFunctionArgs) {
  // await new Promise((res) => setTimeout(res, 800));

  const page = Number(url.searchParams.get("page"));
  const userId = Number(url.searchParams.get("userId"));
  const targetUserId = Number(url.searchParams.get("targetUserId"));
  let action = url.searchParams.get("action");
  let level = url.searchParams.get("level");

  let logs: ApiListResponse<AuditLog> = { count: 0, data: [] };

  if (!isNaN(targetUserId) && targetUserId > 0) {
    logs = await getLogsUsuario({
      page: page || 1,
      userId: userId || undefined,
      action: isAuditLogAction(action) ? action : undefined,
      level: isAuditLogLevel(level) ? level : undefined,
      userIdTarget: targetUserId,
    });
  }

  const users = await getUsuarios(true);
  const usersItems: Item[] = users.map((user) => ({
    label: user.nome,
    value: user.id,
  }));
  return {
    logs,
    usersItems,
    users,
  };
}

export function Component() {
  const { logs, usersItems } = useLoaderData<typeof loader>();
  const { searchParams, updateFilters } = useFilterParams();

  const targetUserId = searchParams.get("targetUserId") ?? undefined;

  const targetUserIdItem = useMemo(
    () =>
      usersItems.find(
        (i) => i.value !== null && String(i.value) === targetUserId,
      ) ?? null,
    [targetUserId, usersItems],
  );

  return (
    <AuditLogList
      logs={logs}
      title={
        targetUserIdItem
          ? `Auditoria — ${targetUserIdItem.label}`
          : "Logs por Usuario"
      }
      description={
        targetUserIdItem
          ? `Ações registradas em relação ao Usuario #${targetUserIdItem.value}`
          : "Selecione um Usuario"
      }
      emptyMessage="Nenhuma ação registrada para este usuario"
      emptyIcon={User}
      usersItems={usersItems}
      actions={
        <AutoCompleteDropdown
          items={usersItems}
          classNames={{ input: "bg-white" }}
          name="userIdTarget"
          label="Usuário"
          textSize="small"
          selectedItem={targetUserIdItem}
          placeholder="Selecione o usuário alvo"
          setSelectedItem={(item) =>
            updateFilters({ targetUserId: item?.value?.toString() })
          }
        />
      }
    />
  );
}
