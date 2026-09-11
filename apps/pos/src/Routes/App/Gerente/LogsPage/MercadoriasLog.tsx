import { Loader2, Package } from "lucide-react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { AuditLogList, useFilterParams } from "./AuditLog/AuditLogsList";
import {
  ApiListResponse,
  AuditLog,
  isAuditLogAction,
  isAuditLogLevel,
  MercadoriaSimple,
} from "@tauri-inventory/types";
import { getSingleMercadoria, getUsuarios } from "../../../../api/apiHelper";
import { getLogsMercadoria } from "../../../../api/apiLogs";
import { Item } from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import MercadoriaSimpleSelect from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/MercadoriaSImpleDropdown";

export function HydrateFallback() {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
}

export async function loader({ url }: LoaderFunctionArgs) {
  const page = Number(url.searchParams.get("page"));
  const mercIdForm = url.searchParams.get("mercId");
  const mercId = mercIdForm !== null ? Number(mercIdForm) : undefined;
  const userId = Number(url.searchParams.get("userId"));
  const action = url.searchParams.get("action");
  const level = url.searchParams.get("level");

  let mercDesc = url.searchParams.get("mercDesc");

  if (!mercDesc && mercId !== undefined) {
    const fetched = await getSingleMercadoria({ id: mercId, getDeleted: true });
    mercDesc = fetched.descricao;
  }

  let logs: ApiListResponse<AuditLog> = { count: 0, data: [] };
  let mercadoria: MercadoriaSimple | null = null;

  if (mercId && !isNaN(mercId) && mercId > 0 && mercDesc) {
    logs = await getLogsMercadoria({
      mercId,
      page: page || 1,
      userId: userId || undefined,
      action: isAuditLogAction(action) ? action : undefined,
      level: isAuditLogLevel(level) ? level : undefined,
    });
    mercadoria = { descricao: mercDesc, id: mercId };
  }

  const users = await getUsuarios(true);
  const usersItems: Item[] = users.map((user) => ({
    label: user.nome,
    value: user.id,
  }));

  return { logs, usersItems, users, mercadoria };
}

export function Component() {
  const { logs, usersItems, mercadoria } = useLoaderData<typeof loader>();
  const { updateFilters } = useFilterParams();

  return (
    <AuditLogList
      logs={logs}
      title={
        mercadoria
          ? `Auditoria — ${mercadoria.descricao}`
          : "Logs por Mercadoria"
      }
      description={
        mercadoria
          ? `Ações registradas para a mercadoria #${mercadoria.id}`
          : "Selecione uma mercadoria"
      }
      emptyMessage="Nenhuma ação registrada para esta mercadoria"
      emptyIcon={Package}
      usersItems={usersItems}
      actions={
        <div className="w-2/3">
          <MercadoriaSimpleSelect
            name="mercItem"
            label="Mercadoria"
            classNames={{ input: "bg-white" }}
            isLog={true}
            selectedItem={
              mercadoria
                ? { label: mercadoria.descricao, value: mercadoria.id }
                : null
            }
            onValueChange={(item) =>
              updateFilters({
                mercId: item?.value?.toString(),
                mercDesc: item?.label,
              })
            }
          />
        </div>
      }
    />
  );
}
