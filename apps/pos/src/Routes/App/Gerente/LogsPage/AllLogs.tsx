import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Factory,
  Inbox,
  Layers,
  Loader2,
  LogIn,
  Package,
  PencilLine,
  PlusCircle,
  Tag,
  Trash2,
  UserIcon,
} from "lucide-react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  useFetcher,
  useLoaderData,
  useNavigate,
  useRouteError,
  useSearchParams,
} from "react-router";
import { getAllLogs } from "../../../../api/apiLogs";
import { useReducedMotion, motion, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { string } from "zod";
import {
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
  AuditLog,
  isAuditLogLevel,
  isAuditLogAction,
} from "../../../../../../../packages/types/database/Logs";
import { AuditLogList } from "./AuditLog/AuditLogsList";
import { getUsuarios } from "../../../../api/apiHelper";
import { Item } from "../../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import QueryString from "qs";
import { timeout } from "../../../../Helpers/delay";

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

  const users = await getUsuarios();

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

  // const navigate = useNavigate();
  const [searchParams,setSearchParams] = useSearchParams();

  const formRef = useRef(null);

  const submitForm = () => {
    if (!formRef.current) {
      return;
    }
    const datas = Object.fromEntries(new FormData(formRef.current).entries());
    const queryString = QueryString.stringify(datas,{skipNulls: true});
    // console.log(queryString);
    // navigate(`?${queryString}`, { replace: true });
    setSearchParams(queryString)
  };

  return (
    <AuditLogList
      logs={logs}
      usersItems={usersItems}
      submitForm={submitForm}
      // fetcherTarget={"/gerente/logs/all"}
      title="Registro de auditoria"
      description="Histórico de ações realizadas no sistema"
    />
  );
}
