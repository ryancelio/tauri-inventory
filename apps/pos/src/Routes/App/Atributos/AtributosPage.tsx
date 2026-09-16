import {
  LoaderFunction,
  useFetcher,
  useLoaderData,
} from "react-router";
import { getAtributos } from "../../../api/apiHelper";
import { IAtributo, UsuarioLogado } from "@tauri-inventory/types";
import AddAtributoModal from "./AddAtributoModal";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Lock,
  Search,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import FullscreenInfoModal from "../SharedComponents/InfoModal";
import { userContext } from "../../../context/contexts";
import { getIsOfflineModeActive } from "../../../backend/backendHelper";
import { useToast } from "../../../context/Toast/ToastContext";
import { AnimatePresence } from "motion/react";
import CreateButton from "../Mercadorias/MercadoriaEdit/FormComponents/CreateButton";

export const loader: LoaderFunction = async ({ context }) => {
  const atributos = await getAtributos();
  const usuario = context.get(userContext);
  const isOfflineMode = await getIsOfflineModeActive();

  return { atributos, usuario, isOfflineMode };
};

const TIPO_META: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  text: {
    label: "Texto",
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
  },
  number: {
    label: "Número",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
  },
  boolean: {
    label: "Sim/Não",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
};

export function Component() {
  const { atributos, usuario, isOfflineMode } = useLoaderData<{
    atributos: IAtributo[];
    usuario: UsuarioLogado;
    isOfflineMode: boolean;
  }>();
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<IAtributo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<IAtributo | null>(
    null,
  );

  const fetcher = useFetcher();
  const toaster = useToast();
  useEffect(() => {
    if (!fetcher.data) return;
    toaster.toast({
      title: "Deletar atributo",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });
    if (fetcher.data.ok) {
      setShowDeleteConfirm(null);
    }
  }, [fetcher.data]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof IAtributo;
    direction: "asc" | "desc";
  } | null>(null);

  const canManage = usuario.funcao !== "vendedor" && !isOfflineMode;

  const filteredAndSortedAtributos = useMemo(() => {
    let result = [...atributos];

    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      result = result.filter(
        (att) =>
          att.nome.toLowerCase().includes(lowerCaseTerm) ||
          att.tipo.toLowerCase().includes(lowerCaseTerm),
      );
    }

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: string | number = a[sortConfig.key];
        let bValue: string | number = b[sortConfig.key];

        if (sortConfig.key === "createdAt" || sortConfig.key === "updatedAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [atributos, searchTerm, sortConfig]);

  const requestSort = (key: keyof IAtributo) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof IAtributo) => {
    if (sortConfig?.key !== key)
      return (
        <ArrowUpDown
          size={14}
          className="text-slate-300 group-hover:text-slate-400"
        />
      );
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={14} className="text-blue-600" />
    ) : (
      <ArrowDown size={14} className="text-blue-600" />
    );
  };

  const isLockedRow = (att: IAtributo) =>
    att.id === 1 && att.nome.toLowerCase() === "cor";

  const columnCount = 4 + (canManage ? 1 : 0);
  const hasResults = filteredAndSortedAtributos.length > 0;
  const hasAnyAtributos = atributos.length > 0;

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <>
      <AnimatePresence>
        {showAdd && <AddAtributoModal onClose={() => setShowAdd(false)} />}
        {showEdit && (
          <AddAtributoModal
            onClose={() => setShowEdit(null)}
            isEdit
            atributo={showEdit}
          />
        )}
        {showDeleteConfirm && (
          <FullscreenInfoModal
            infoElement={
              <h1>
                Deseja apagar o atributo:{" "}
                <span className="font-bold">{showDeleteConfirm.nome}</span>
              </h1>
            }
            actionLabel="Confirmar"
            title="Deletar"
            caution
            fetcher={fetcher}
            onClose={() => setShowDeleteConfirm(null)}
            action={async () => {
              const formData = new FormData();
              formData.set("id", showDeleteConfirm.id.toString());
              await fetcher.submit(formData, {
                action: "../gerente/atributos/",
                method: "DELETE",
              });
            }}
          />
        )}
      </AnimatePresence>

      <div className="h-full w-full overflow-hidden bg-slate-50 p-5">
        <div className="mx-auto flex h-full flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Cabeçalho */}
          <div className="flex shrink-0 flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
                  Características
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-medium text-slate-500">
                    {atributos.length}
                  </span>
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Características usadas para descrever mercadorias.
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-3 sm:w-auto">
              {isOfflineMode && (
                <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 md:flex">
                  <WifiOff size={13} />
                  Modo offline
                </span>
              )}

              <div className="group relative flex-1 sm:flex-none">
                <Search
                  size={17}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500"
                />
                <input
                  type="text"
                  placeholder="Buscar por nome ou tipo"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pr-9 pl-10 text-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none sm:w-64"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Limpar busca"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {canManage && (
                <CreateButton
                  label="Criar Atributo"
                  onClick={() => setShowAdd(true)}
                  disabled={isOfflineMode}
                />
              )}
            </div>
          </div>

          {/* Tabela de Dados */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-slate-50/95 text-xs text-gray-500 uppercase backdrop-blur-sm">
                  <tr>
                    <th
                      className="group cursor-pointer px-6 py-3 font-semibold tracking-wide transition-colors select-none hover:bg-slate-100"
                      onClick={() => requestSort("nome")}
                    >
                      <div className="flex items-center gap-1.5">
                        <p
                          className={
                            sortConfig?.key === "nome" ? "text-blue-600" : ""
                          }
                        >
                          Nome
                        </p>
                        {getSortIcon("nome")}
                      </div>
                    </th>
                    <th
                      className="group cursor-pointer px-6 py-3 font-semibold tracking-wide transition-colors select-none hover:bg-slate-100"
                      onClick={() => requestSort("tipo")}
                    >
                      <div className="flex items-center gap-1.5">
                        <p
                          className={
                            sortConfig?.key === "tipo" ? "text-blue-600" : ""
                          }
                        >
                          Tipo
                        </p>
                        {getSortIcon("tipo")}
                      </div>
                    </th>
                    <th
                      className="group cursor-pointer px-6 py-3 font-semibold tracking-wide transition-colors select-none hover:bg-slate-100"
                      onClick={() => requestSort("createdAt")}
                    >
                      <div className="flex items-center gap-1.5">
                        <p
                          className={
                            sortConfig?.key === "createdAt"
                              ? "text-blue-600"
                              : ""
                          }
                        >
                          Criado em
                        </p>
                        {getSortIcon("createdAt")}
                      </div>
                    </th>
                    <th
                      className="group cursor-pointer px-6 py-3 font-semibold tracking-wide transition-colors select-none hover:bg-slate-100"
                      onClick={() => requestSort("updatedAt")}
                    >
                      <div className="flex items-center gap-1.5">
                        <p
                          className={
                            sortConfig?.key === "updatedAt"
                              ? "text-blue-600"
                              : ""
                          }
                        >
                          Atualizado em
                        </p>
                        {getSortIcon("updatedAt")}
                      </div>
                    </th>

                    {canManage && (
                      <th className="px-6 py-3 text-right font-semibold tracking-wide">
                        Ação
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {hasResults ? (
                    filteredAndSortedAtributos.map((att) => {
                      const locked = isLockedRow(att);
                      const editable = canManage && !locked;
                      return (
                        <tr
                          key={att.id}
                          className={`group transition-colors ${
                            editable
                              ? "cursor-default select-none hover:bg-blue-50"
                              : "hover:bg-slate-100"
                          }`}
                          onDoubleClick={() => {
                            if (!editable) return;
                            setShowEdit(att);
                          }}
                        >
                          <td className="px-6 py-3.5 font-medium text-gray-900">
                            {att.nome}
                          </td>
                          <td className="px-6 py-3.5">
                            <TipoCell tipo={att.tipo} />
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {formatDate(att.createdAt)}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {formatDate(att.updatedAt)}
                          </td>
                          {canManage && (
                            <td className="px-6 py-3.5">
                              <div className="flex justify-end">
                                {!locked ? (
                                  <button
                                    aria-label={`Deletar ${att.nome}`}
                                    className="rounded-md p-1.5 text-red-500/70 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                                    onClick={() => setShowDeleteConfirm(att)}
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 group-placeholder-shown:text-red-500 group-hover:bg-red-100">
                                    <Lock size={12} />
                                    Não alterável
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columnCount} className="px-6 py-16">
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          <div className="rounded-full bg-slate-100 p-3">
                            <Search size={22} className="text-slate-400" />
                          </div>
                          {hasAnyAtributos ? (
                            <>
                              <h2 className="font-medium text-slate-700">
                                Nenhum resultado para "{searchTerm}"
                              </h2>
                              <p className="text-sm text-slate-400">
                                Tente buscar por outro nome ou tipo.
                              </p>
                              <button
                                onClick={() => setSearchTerm("")}
                                className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                              >
                                Limpar busca
                              </button>
                            </>
                          ) : (
                            <>
                              <h2 className="font-medium text-slate-700">
                                Nenhum atributo cadastrado.
                              </h2>
                              {canManage && (
                                <>
                                  <p className="text-sm text-slate-400">
                                    Crie o primeiro atributo para começar.
                                  </p>
                                  <CreateButton
                                    label="Criar Atributo"
                                    onClick={() => setShowAdd(true)}
                                    disabled={isOfflineMode}
                                  />
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="w-full shrink-0 pt-2 text-center text-xs text-slate-400">
              {isOfflineMode ? (
                <p className="flex items-center justify-center gap-1.5">
                  <WifiOff size={12} />
                  Não é possível editar em modo offline
                </p>
              ) : (
                canManage && <p>Clique duas vezes em um item para editar.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TipoCell({ tipo }: { tipo: string }) {
  const meta = TIPO_META[tipo] ?? {
    label: tipo,
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
