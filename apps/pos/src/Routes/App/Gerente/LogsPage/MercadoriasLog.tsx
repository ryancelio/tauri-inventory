import { Loader2, Package } from "lucide-react";
import {
  LoaderFunctionArgs,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import { AuditLogList, useFilterParams } from "./AuditLog/AuditLogsList";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ApiListResponse,
  AuditLog,
  isAuditLogAction,
  isAuditLogLevel,
  MercadoriaSimpleResponse,
  UsuarioListing,
  UsuarioLogado,
} from "@tauri-inventory/types";
import {
  getMercadoriaSimpleListing,
  getSingleMercadoria,
  getUsuarios,
} from "../../../../api/apiHelper";
import { getLogsMercadoria } from "../../../../api/apiLogs";
import AutoCompleteDropdown, {
  Item,
} from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import MercadoriaSimpleSelect from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/MercadoriaSImpleDropdown";
import QueryString from "qs";

export function HydrateFallback() {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
}

export async function loader({ url }: LoaderFunctionArgs) {
  // await new Promise((res) => setTimeout(res, 800));

  const page = Number(url.searchParams.get("page"));
  const mercIdForm = url.searchParams.get("mercId");
  const mercId = mercIdForm !== null ? Number(mercIdForm) : undefined;
  
  let mercDesc = url.searchParams.get("mercDesc")?.toString();
  const userId = Number(url.searchParams.get("userId"));
  let action = url.searchParams.get("action");
  let level = url.searchParams.get("level");

  let logs: ApiListResponse<AuditLog> = { count: 0, data: [] };
  let mercadoria: MercadoriaSimpleResponse | null = null;


  console.log({mercDesc,mercId})

  if (mercDesc === undefined && mercId !== undefined) {
    const mercadoria = await getSingleMercadoria({
      id: mercId,
      getDeleted: true,
    });
    mercDesc = mercadoria.descricao;
  }

  if (mercId && !isNaN(mercId) && mercId > 0 && mercDesc !== undefined) {
    logs = await getLogsMercadoria({
      mercId: mercId,
      page: page || 1,
      userId: userId || undefined,
      action: isAuditLogAction(action) ? action : undefined,
      level: isAuditLogLevel(level) ? level : undefined,
    });
    mercadoria = { descricao: mercDesc, id: mercId };
  }

  const users = await getUsuarios();
  const usersItems: Item[] = users.map((user) => ({
    label: user.nome,
    value: user.id,
  }));
  return { logs, usersItems, users, mercadoria };
}

export function Component() {
  const { logs, usersItems, mercadoria } = useLoaderData<typeof loader>();
  // const navigate = useNavigate();
  const {  updateFilters } = useFilterParams();
  
  // const formRef = useRef<HTMLFormElement | null>(null);

  // const submitForm = () => {
  //   if (!formRef.current) {
  //     return;
  //   }
  //   let datas = Object.fromEntries(new FormData(formRef.current).entries());

  //   if (datas.mercItem && typeof datas.mercItem === "string") {
  //     const mercItem = JSON.parse(datas.mercItem);
  //     datas.mercId = mercItem?.value;
  //     datas.mercDesc = mercItem?.label;
  //     delete datas.mercItem;
  //   }
  //   // console.log("datas", datas);

  //   const queryString = QueryString.stringify(datas);
  //   setSearchParams(queryString)
  // };

  return (
    <AuditLogList
      logs={logs}
      // formRef={formRef}
      // submitForm={submitForm}
      // title={`Auditoria — ${mercadoria?.descricao || ""}`}
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
            selectedItem={mercadoria ? { label: mercadoria.descricao, value: mercadoria.id } : null}
            onValueChange={(item) =>
              updateFilters({ mercId: item?.value?.toString(), mercDesc: item?.label })
            }
          />
        </div>
      }
    />
  );
}
