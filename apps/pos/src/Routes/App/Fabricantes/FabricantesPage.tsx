import { LoaderFunction, useFetcher, useLoaderData } from "react-router";
import { getFabricantes } from "../../../api/apiHelper";
import { useMemo, useState, useEffect } from "react";
import {
  Pencil,
  Search,
  Trash2,
  Package,
  ChevronDown,
  X,
} from "lucide-react";
import FullscreenInfoModal from "../SharedComponents/InfoModal";
import FabricanteModal from "./FabricanteModal";
import { userContext } from "../../../context/contexts";
import { IFabricante, UsuarioLogado } from "@tauri-inventory/types";
import { useToast } from "../../../context/Toast/ToastContext";
import { getIsOfflineModeActive } from "../../../backend/backendHelper";
import { AnimatePresence, motion } from "motion/react";
import CreateButton from "../Mercadorias/MercadoriaEdit/FormComponents/CreateButton";
import DeleteFabModal from "./DeleteFabModal";

export const loader: LoaderFunction = async ({ context }) => {
  const fabricantes = await getFabricantes();
  const isOfflineMode = await getIsOfflineModeActive();
  const usuario = context.get(userContext);
  return { fabricantes, usuario, isOfflineMode };
};

export interface FabricantesPageLoaderData {
  fabricantes: IFabricante[];
  usuario: UsuarioLogado;
  isOfflineMode: boolean;
}

export function Component() {
  const { fabricantes, usuario, isOfflineMode } =
    useLoaderData<FabricantesPageLoaderData>();
  const fetcher = useFetcher();
  const [filter, setFilter] = useState("");
  const [editingFab, setEditingFab] = useState<IFabricante | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sortBy, setSortBy] = useState<"nome" | "id" | "createdAt">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<IFabricante | null>(
    null,
  );

  const actionData: { ok: boolean; response: string } = fetcher.data;
  const toaster = useToast();

  useEffect(() => {
    if (actionData) {
      if (!actionData.ok) {
        setShowInfoModal(true);
      } else {
        toaster.toast({
          title: "Sucesso",
          message: actionData.response || "Fabricante salvo com sucesso!",
          type: "success",
        });
      }
    }
  }, [actionData]);

  // Filtro e ordenação
  const filteredFabricantes = useMemo(() => {
    let result = [...fabricantes];

    // Aplicar filtro
    if (filter) {
      result = result.filter(
        (fab) =>
          fab.nome?.toLowerCase().includes(filter.toLowerCase()) ||
          fab.id?.toString().includes(filter),
      );
    }

    // Aplicar ordenação
    result.sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "nome") {
        return multiplier * a.nome.localeCompare(b.nome);
      } else if (sortBy === "id") {
        return multiplier * (a.id - b.id);
      } else {
        return (
          multiplier *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      }
    });

    return result;
  }, [fabricantes, filter, sortBy, sortOrder]);

  const handleSort = (column: "nome" | "id" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const stats = useMemo(
    () => ({
      total: fabricantes.length,
      filtered: filteredFabricantes.length,
      hasFilter: filter.length > 0,
    }),
    [fabricantes.length, filteredFabricantes.length, filter],
  );

  return (
    <>
      <AnimatePresence>
        {showInfoModal && actionData && (
          <FullscreenInfoModal
            title="Erro ao Salvar"
            information={actionData.response}
            caution={!actionData.ok}
            onClose={() => setShowInfoModal(false)}
          />
        )}
        {showConfirmModal && (
          <DeleteFabModal
            fabricante={showConfirmModal}
            fetcher={fetcher}
            onClose={() => setShowConfirmModal(null)}
          />
        )}
        {isCreating && (
          <FabricanteModal mode="create" onClose={() => setIsCreating(false)} />
        )}
        {editingFab && (
          <FabricanteModal
            fabricante={editingFab}
            mode="edit"
            onClose={() => setEditingFab(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full w-full flex-col overflow-hidden bg-linear-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/50"
        >
          {/* Cabeçalho Aprimorado */}
          <div className="shrink-0 border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Fabricantes
                  </h1>
                  <p className="text-sm text-slate-500">
                    {stats.hasFilter
                      ? `${stats.filtered} de ${stats.total} fabricantes`
                      : `${stats.total} fabricantes cadastrados`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou ID..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-64 rounded-xl border border-slate-200 bg-white/80 py-2.5 pr-10 pl-10 text-sm text-slate-700 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                  />
                  {filter && (
                    <button
                      onClick={() => setFilter("")}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {usuario.funcao !== "vendedor" && (
                  <CreateButton
                    className="rounded-xl px-4 py-2.5 shadow-lg shadow-blue-500/25 transition-all not-disabled:hover:shadow-xl not-disabled:hover:shadow-blue-500/30"
                    disabled={isOfflineMode}
                    label="Novo Fabricante"
                    onClick={() => setIsCreating(true)}
                  />
                )}
              </div>
            </div>

            {/* Indicador de modo offline
            {isOfflineMode && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-2 text-sm text-amber-700">
                <AlertCircle size={16} />
                <span>Modo offline ativo - edição desabilitada</span>
              </div>
            )} */}
          </div>

          {/* Área da Tabela Aprimorada */}
          <div className="custom-scrollbar grow overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 bg-linear-to-b from-white to-slate-50/95">
                  <th
                    className="cursor-pointer border-b-2 border-slate-200 px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-700"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-2">
                      ID
                      {sortBy === "id" && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer border-b-2 border-slate-200 px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-700"
                    onClick={() => handleSort("nome")}
                  >
                    <div className="flex items-center gap-2">
                      Nome
                      {sortBy === "nome" && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="cursor-pointer border-b-2 border-slate-200 px-6 py-4 text-left text-xs font-bold tracking-wider text-slate-500 uppercase transition-colors hover:text-slate-700"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-2">
                      Data de Criação
                      {sortBy === "createdAt" && (
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        />
                      )}
                    </div>
                  </th>
                  {usuario.funcao !== "vendedor" && !isOfflineMode && (
                    <th className="border-b-2 border-slate-200 px-6 py-4 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFabricantes.length > 0 ? (
                  filteredFabricantes.map((fab, index) => (
                    <motion.tr
                      key={fab.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="group cursor-pointer transition-all duration-200 hover:bg-linear-to-r hover:from-blue-50/80 hover:to-transparent"
                      onDoubleClick={() => {
                        if (usuario.funcao === "vendedor" || isOfflineMode)
                          return;
                        setEditingFab(fab);
                      }}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                          <span className="text-[10px] opacity-60">#</span>
                          {fab.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-600 group-hover:from-blue-100 group-hover:to-blue-200 group-hover:text-blue-700">
                            {fab.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 group-hover:text-blue-600">
                            {fab.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-center text-sm text-slate-500">
                          {new Date(fab.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                      {usuario.funcao !== "vendedor" && !isOfflineMode && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFab(fab);
                              }}
                              className="rounded-lg p-2 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"
                              title="Editar fabricante"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowConfirmModal(fab);
                              }}
                              className="rounded-lg p-2 text-red-300 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                              title="Excluir fabricante"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={
                        usuario.funcao !== "vendedor" && !isOfflineMode ? 4 : 3
                      }
                      className="px-6 py-16"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                          {filter ? (
                            <Search className="h-8 w-8 text-slate-400" />
                          ) : (
                            <Package className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <p className="text-base font-medium text-slate-600">
                          {filter
                            ? "Nenhum fabricante encontrado"
                            : "Nenhum fabricante cadastrado"}
                        </p>
                        <p className="text-sm text-slate-400">
                          {filter
                            ? "Tente buscar com outros termos"
                            : "Clique em 'Novo Fabricante' para começar"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer com informações */}
          {filteredFabricantes.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-3">
              <p className="text-xs text-slate-500">
                Dica: Clique duas vezes em um fabricante para editá-lo
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
