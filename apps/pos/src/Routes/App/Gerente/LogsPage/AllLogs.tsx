import { Loader2 } from "lucide-react";
import { LoaderFunctionArgs, useLoaderData, useRouteError } from "react-router";
import { getAllLogs } from "../../../../api/apiLogs";
import {
  isAuditLogLevel,
  isAuditLogAction,
} from "@tauri-inventory/types";
import { AuditLogList } from "./AuditLog/AuditLogsList";
import { getUsuarios } from "../../../../api/apiHelper";
import { Item } from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

export function HydrateFallback() {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
}

export function ErrorBoundary() {
  let error = useRouteError();
  console.log(error);
  return (
    <div className="grid size-full place-items-center border border-dotted border-red-500 bg-red-400">
      <div>Erro ao acessar logs.</div>
      <p>
        Tente novamente e, caso o erro persista, entre em contato com um
        administrador.
      </p>
    </div>
  );
}

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
