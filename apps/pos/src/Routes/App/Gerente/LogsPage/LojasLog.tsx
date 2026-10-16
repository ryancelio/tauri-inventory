import {
  ApiListResponse,
  AuditLog,
  isAuditLogAction,
  isAuditLogLevel,
} from "@tauri-inventory/types";
import { Store } from "lucide-react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { getLojas, getUsuarios } from "../../../../api/apiHelper";
import { getLogsLojas } from "../../../../api/apiLogs";
import AutoCompleteDropdown, {
  Item,
} from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { AuditLogList, useFilterParams } from "./AuditLog/AuditLogsList";
import { AppError } from "../../Errors/AppError";
import { LogHydrateFallback } from "./shared/LogFallback";

export const HydrateFallback = LogHydrateFallback;
export const ErrorBoundary = AppError;

export async function loader({ url }: LoaderFunctionArgs) {
  const page = Number(url.searchParams.get("page"));
  const userId = Number(url.searchParams.get("userId"));
  const action = url.searchParams.get("action");
  const level = url.searchParams.get("level");

  const lojaId = Number(url.searchParams.get("lojaId"));
  let logs: ApiListResponse<AuditLog> = { count: 0, data: [] };

  if (!isNaN(lojaId) && lojaId > 0) {
    logs = await getLogsLojas({
      page: page || 1,
      userId: userId || undefined,
      action: isAuditLogAction(action) ? action : undefined,
      level: isAuditLogLevel(level) ? level : undefined,
      lojaId,
    });
  }

  const users = await getUsuarios(true);
  const usersItems: Item[] = users.map((user) => ({
    label: user.nome,
    value: user.id,
  }));

  const lojas = await getLojas();
  const lojasItems: Item[] = lojas.map((loja) => ({
    label: loja.nome,
    value: loja.id,
  }));

  return {
    logs,
    usersItems,
    users,
    lojasItems,
    loja: lojas.find((loja) => loja.id === lojaId),
  };
}

export function Component() {
  const { lojasItems, loja, logs, usersItems } = useLoaderData<typeof loader>();
  const { updateFilters } = useFilterParams();

  return (
    <AuditLogList
      logs={logs}
      title={loja ? `Auditoria — ${loja.nome}` : "Logs por Loja"}
      description={
        loja
          ? `Ações registradas em relação à loja #${loja.id}`
          : "Selecione uma loja"
      }
      emptyMessage="Nenhuma ação registrada para esta loja"
      emptyIcon={Store}
      usersItems={usersItems}
      actions={
        <AutoCompleteDropdown
          items={lojasItems}
          name="lojaId"
          label="Loja"
          placeholder="Selecione a loja"
          textSize="small"
          selectedItem={loja ? { label: loja.nome, value: loja.id } : null}
          classNames={{ input: "bg-white" }}
          setSelectedItem={(item) =>
            updateFilters({ lojaId: item?.value?.toString() })
          }
        />
      }
    />
  );
}
