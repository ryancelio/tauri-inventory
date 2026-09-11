import {
  ApiListResponse,
  AuditLog,
  isAuditLogAction,
  isAuditLogLevel,
} from "@tauri-inventory/types";
import { Factory } from "lucide-react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { getFabricantes, getUsuarios } from "../../../../api/apiHelper";
import { getLogsFabricantes } from "../../../../api/apiLogs";
import AutoCompleteDropdown, {
  Item,
} from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { AuditLogList, useFilterParams } from "./AuditLog/AuditLogsList";

export async function loader({ url }: LoaderFunctionArgs) {
  const page = Number(url.searchParams.get("page"));
  const userId = Number(url.searchParams.get("userId"));
  const action = url.searchParams.get("action");
  const level = url.searchParams.get("level");

  const fabricanteId = Number(url.searchParams.get("fabricanteId"));
  let logs: ApiListResponse<AuditLog> = { count: 0, data: [] };

  if (!isNaN(fabricanteId) && fabricanteId > 0) {
    logs = await getLogsFabricantes({
      page: page || 1,
      userId: userId || undefined,
      action: isAuditLogAction(action) ? action : undefined,
      level: isAuditLogLevel(level) ? level : undefined,
      fabricanteId,
    });
  }

  const users = await getUsuarios(true);
  const usersItems: Item[] = users.map((user) => ({
    label: user.nome,
    value: user.id,
  }));

  const fabricantes = await getFabricantes(true);
  const fabricantesItems = fabricantes.map((fab) => ({
    label: fab.nome,
    value: fab.id,
  }));
  return {
    logs,
    usersItems,
    users,
    fabricantesItems,
    fabricante: fabricantes.find((fab) => fab.id === fabricanteId),
  };
}

export function Component() {
  const { fabricantesItems, fabricante, logs, usersItems } =
    useLoaderData<typeof loader>();

  const { updateFilters } = useFilterParams();

  return (
    <AuditLogList
      logs={logs}
      title={
        fabricante ? `Auditoria — ${fabricante.nome}` : "Logs por fabricante"
      }
      description={
        fabricante
          ? `Ações registradas em relação ao fabricante #${fabricante.id}`
          : "Selecione um fabricante"
      }
      emptyMessage="Nenhuma ação registrada para este fabricante"
      emptyIcon={Factory}
      usersItems={usersItems}
      actions={
        <div className="w-1/3">
          <AutoCompleteDropdown
            items={fabricantesItems}
            name="fabricanteId"
            label="fabricante"
            selectedItem={
              fabricante
                ? { label: fabricante.nome, value: fabricante.id }
                : undefined
            }
            placeholder="Selecione o Fabricante"
            classNames={{ input: "bg-white" }}
            setSelectedItem={(item) =>
              updateFilters({ fabricanteId: item?.value?.toString() })
            }
          />
        </div>
      }
    />
  );
}
