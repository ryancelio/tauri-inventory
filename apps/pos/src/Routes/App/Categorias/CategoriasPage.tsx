import { LoaderFunction, useFetcher, useLoaderData } from "react-router";
import { getGrupos } from "../../../api/apiHelper";
import { GrupoCategorias, IGrupo, UsuarioLogado } from "@tauri-inventory/types";
import { useMemo, useState } from "react";
import { Pencil, FolderKanban, Tags, Search, Trash2 } from "lucide-react";
import { userContext } from "../../../context/contexts";
import { getIsOfflineModeActive } from "../../../backend/backendHelper";
import { GrupoTile } from "./GrupoTile";
import CategoriaTile from "./CategoriaTile";
import { AnimatePresence, motion } from "motion/react";
import { GrupoDeleteModal } from "./GrupoDeleteModals";
import { useToast } from "../../../context/Toast/ToastContext";
import FullscreenInfoModal from "../SharedComponents/InfoModal";
import CreateButton from "../Mercadorias/MercadoriaEdit/FormComponents/CreateButton";
import { CategoriaDeleteModal } from "./CategoriaDeleteModal";

export const loader: LoaderFunction = async ({ context }) => {
  const grupos = await getGrupos();
  const isOfflineMode = await getIsOfflineModeActive();
  const usuario = context.get(userContext);

  return { grupos, usuario, isOfflineMode };
};

export function Component() {
  const { grupos, usuario, isOfflineMode } = useLoaderData<{
    grupos: IGrupo[];
    usuario: UsuarioLogado;
    isOfflineMode: boolean;
  }>();

  const fetcher = useFetcher();

  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const selectedGrupo = useMemo(
    () => grupos.find((grp) => grp.id === selectedGrupoId) ?? null,
    [selectedGrupoId, grupos],
  );

  const [search, setSearch] = useState("");

  const [editCat, setEditCat] = useState<GrupoCategorias | null>(null);
  const [catChangeGrupo, setCatChangeGrupo] = useState<{
    cat: { id: number; nome: string };
    grp: IGrupo;
  } | null>(null);
  const [newCat, setNewCat] = useState(false);

  const [editGroup, setEditGroup] = useState<IGrupo | null>(null);
  const [newGroup, setNewGroup] = useState(false);

  const [deleteGrupo, setDeleteGrupo] = useState<IGrupo | null>(null);
  const [deleteCategoria, setDeleteCategoria] =
    useState<GrupoCategorias | null>(null);

  const toaster = useToast();

  const handleNewGroup = (val: boolean) => {
    setSelectedGrupoId(null);
    setEditCat(null);
    setEditGroup(null);
    setNewCat(false);

    setNewGroup(val);
  };
  const handleEditGroup = (grupo: IGrupo | null) => {
    setEditCat(null);
    setNewGroup(false);
    setNewCat(false);

    setEditGroup(grupo);
    if (grupo) {
      setSelectedGrupoId(grupo.id);
    }
  };
  const handleNewCat = (val: boolean) => {
    setEditCat(null);
    setNewGroup(false);

    setNewCat(val);
  };
  const handleSelectedGrupo = (grupo: IGrupo) => {
    setEditCat(null);
    setNewGroup(false);
    setNewCat(false);
    setEditGroup(null);

    setSelectedGrupoId(grupo.id);
  };

  const categoriasFiltradas = useMemo(() => {
    if (!selectedGrupo?.categorias) return [];

    return selectedGrupo.categorias.filter((cat) =>
      cat.nome.toLowerCase().includes(search.toLowerCase()),
    );
  }, [selectedGrupo, search, grupos]);

  const totalCategorias = selectedGrupo?.categorias?.length || 0;

  const handleDropCategoria = (e: React.DragEvent, grupo: IGrupo) => {
    e.preventDefault();
    const categoriaId = e.dataTransfer.getData("catId");
    const categoriaNome = e.dataTransfer.getData("catNome");
    if (!categoriaId) return;

    if (selectedGrupo?.id.toString() === grupo.id.toString()) return;

    setCatChangeGrupo({
      cat: { id: Number(categoriaId), nome: categoriaNome },
      grp: grupo,
    });
  };

  async function handleChangeCatGrupo(catId: number, grupoId: number) {
    const formData = new FormData();

    formData.set("id", catId.toString());
    formData.set("grupoId", grupoId.toString());

    fetcher.submit(formData, {
      action: "/gerente/categorias",
      method: "PUT",
    });
  }

  return (
    <>
      <AnimatePresence>
        {deleteGrupo && (
          <GrupoDeleteModal
            grupo={deleteGrupo}
            onClose={() => setDeleteGrupo(null)}
            key={deleteGrupo.id}
          />
        )}
        {deleteCategoria && (
          <CategoriaDeleteModal
            categoria={deleteCategoria}
            onClose={() => setDeleteCategoria(null)}
            key={deleteCategoria.id}
          />
        )}
        {catChangeGrupo && (
          <FullscreenInfoModal
            information={`Deseja enviar a categoria ${catChangeGrupo.cat.nome} para o grupo ${catChangeGrupo.grp.nome}`}
            onClose={() => setCatChangeGrupo(null)}
            title="Alterar categoria"
            actionLabel="Alterar"
            action={async () => {
              await handleChangeCatGrupo(
                catChangeGrupo.cat.id,
                catChangeGrupo.grp.id,
              );
              toaster.toast({
                title: "Alteração de categoria",
                message: `Categoria ${catChangeGrupo.cat.nome} alterada para ${catChangeGrupo.grp.nome} com sucesso!`,
                type: "success",
              });
            }}
            fetcher={fetcher}
            infoElement={
              <div>
                Deseja enviar a categoria{" "}
                <span className="font-bold">{catChangeGrupo.cat.nome}</span>{" "}
                para o grupo{" "}
                <span className="font-bold">{catChangeGrupo.grp.nome}</span>?
              </div>
            }
          />
        )}
      </AnimatePresence>
      <div className="h-full w-full overflow-hidden bg-slate-50 p-3 md:p-5">
        <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-full flex-col lg:flex-row">
            {/* Sidebar grupos */}
            <aside className="flex w-full flex-col border-b border-slate-200 bg-slate-50/60 lg:w-85 lg:border-r lg:border-b-0">
              {/* Header */}
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                    <FolderKanban size={22} />
                  </div>

                  <div>
                    <h1 className="text-lg font-semibold text-slate-800">
                      Grupos
                    </h1>

                    <p className="text-sm text-slate-500">
                      {grupos.length} grupo{grupos.length !== 1 && "s"}
                    </p>
                  </div>
                </div>

                {usuario.funcao !== "vendedor" && (
                  <CreateButton
                    className="mt-4 h-11 w-full"
                    onClick={() => handleNewGroup(true)}
                    disabled={isOfflineMode}
                    label="Novo Grupo"
                  />
                )}
              </div>

              {/* Lista grupos */}
              <div className="flex-1 overflow-y-auto p-2">
                {grupos.length > 0 ? (
                  <>
                    {grupos.map((grp) => {
                      const isSelected = selectedGrupo?.id === grp.id;

                      return (
                        <GrupoTile
                          handleDrop={handleDropCategoria}
                          key={grp.id}
                          grp={grp}
                          isOfflineMode={isOfflineMode}
                          isSelected={isSelected}
                          usuario={usuario}
                          onClick={() => {
                            handleSelectedGrupo(grp);
                          }}
                          isEditing={editGroup === grp}
                          onClose={() => handleEditGroup(null)}
                          onEdit={(grp) => handleEditGroup(grp)}
                        />
                      );
                    })}
                    {newGroup && (
                      <GrupoTile
                        onClose={() => handleNewGroup(false)}
                        grp={{
                          id: Date.now(),
                          categorias: [],
                          nome: "Novo Grupo",
                          createdAt: "",
                          updatedAt: "",
                        }}
                        isEditing
                        isNew
                        isOfflineMode={isOfflineMode}
                        isSelected
                        onClick={() => {}}
                        onEdit={() => setNewGroup(false)}
                        usuario={usuario}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <FolderKanban size={42} className="mb-4 text-slate-300" />

                    <h2 className="font-semibold text-slate-700">
                      Nenhum grupo encontrado
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Crie um grupo para começar a organizar suas categorias.
                    </p>
                  </div>
                )}
              </div>
            </aside>

            {/* Conteúdo */}
            <section className="flex min-h-0 flex-1 flex-col">
              {selectedGrupo ? (
                <>
                  {/* Header categorias */}
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="group grow">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                            <Tags size={20} />
                          </div>

                          <div>
                            <motion.h1
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              key={selectedGrupo.id}
                              className="text-xl font-semibold text-slate-800"
                            >
                              {selectedGrupo.nome}
                            </motion.h1>

                            <p className="text-sm text-slate-500">
                              {totalCategorias} categoria
                              {totalCategorias !== 1 && "s"}
                            </p>
                          </div>
                          {usuario.funcao !== "vendedor" && !isOfflineMode && (
                            <button
                              className="ml-4 cursor-pointer rounded-lg p-2 text-red-500 opacity-75 transition-colors hover:bg-red-100 hover:opacity-100"
                              onClick={() => setDeleteGrupo(selectedGrupo)}
                            >
                              <Trash2 />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        {/* Busca */}
                        <div className="relative">
                          <Search
                            size={18}
                            className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar categoria..."
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 sm:w-65"
                          />
                        </div>

                        {usuario.funcao !== "vendedor" && (
                          <CreateButton
                            disabled={isOfflineMode}
                            // className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 font-medium whitespace-nowrap text-white transition-all not-disabled:hover:brightness-95 disabled:cursor-not-allowed disabled:bg-blue-300"
                            label="Nova Categoria"
                            onClick={() => setNewCat(true)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lista categorias */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {categoriasFiltradas.length > 0 || newCat ? (
                      <div className="grid gap-3">
                        {categoriasFiltradas.map((cat) => (
                          <CategoriaTile
                            usuario={usuario}
                            cat={cat}
                            editAction={(val: GrupoCategorias | null) => {
                              if (isOfflineMode) return;
                              setEditCat(val);
                            }}
                            close={() => setEditCat(null)}
                            isEditing={editCat === cat}
                            isEditingDisabled={
                              usuario.funcao === "vendedor" || isOfflineMode
                            }
                            deleteAction={(val) => {
                              if (isOfflineMode) return;
                              setDeleteCategoria(val);
                            }}
                            key={cat.id}
                          />
                        ))}
                        {newCat ? (
                          <CategoriaTile
                            isNew
                            cat={{
                              id: Date.now(),
                              nome: "Nova Categoria",
                              createdAt: "",
                              updatedAt: "",
                            }}
                            close={() => handleNewCat(false)}
                            grupoId={selectedGrupo.id}
                            isEditing
                            usuario={usuario}
                          />
                        ) : (
                          usuario.funcao !== "vendedor" && (
                            <div className="flex w-full justify-center">
                              <CreateButton
                                // className="text-blue-500/60 not-disabled:hover:text-blue-500 disabled:text-blue-300"
                                className="bg-blue-500/60! not-disabled:hover:bg-blue-500!"
                                onClick={() => setNewCat(true)}
                                disabled={isOfflineMode}
                              />
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                        <Tags size={42} className="mb-4 text-slate-300" />
                        <h2 className="mb-4 font-semibold text-slate-700">
                          Nenhuma categoria encontrada
                        </h2>
                        {usuario.funcao !== "vendedor" && (
                          <CreateButton
                            disabled={isOfflineMode}
                            // className="cursor-pointer text-slate-500 transition-colors hover:text-blue-500"
                            onClick={() => setNewCat(true)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                      <FolderKanban size={30} className="text-slate-400" />
                    </div>

                    <h1 className="text-lg font-semibold text-slate-700">
                      Selecione um grupo
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                      Escolha um grupo na lateral para visualizar as categorias.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export function GroupEditButton({
  size,
  disabled,
  action,
}: {
  size: number;
  disabled?: boolean;
  action: () => void;
}) {
  return (
    <button
      className="items-center rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100"
      onClick={(e) => {
        e.stopPropagation();
        action();
      }}
      disabled={disabled}
    >
      <Pencil size={size} className="text-slate-700" />
    </button>
  );
}
