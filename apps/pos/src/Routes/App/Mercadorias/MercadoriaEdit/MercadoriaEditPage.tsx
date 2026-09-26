import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useParams,
  Await,
  useSearchParams,
} from "react-router";
import {
  ChevronLeft,
  Save,
  FileText,
  Package,
  DollarSign,
  Layers,
  Loader2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import {
  getMercadoriaCor,
  IFabricante,
  IGrupo,
  IMercadoria,
  MercadoriaPhotosListing,
  SimilarMerc,
  UsuarioLogado,
} from "@tauri-inventory/types";
import FormTextInput from "./FormComponents/FormTextInput";
import EstoqueDisplay from "./FormComponents/FormEstoqueDisplay";
import { MoneyInput } from "./FormComponents/MoneyInput";
import FullscreenInfoModal from "../../SharedComponents/InfoModal";
import { CaracteristicasCard } from "./FormComponents/CaracteristicasCard";
import MercadoriaFormSkeleton from "./Skeleton/MercEditFormSkeleton";
import SimilarMercInfoCard from "./FormComponents/SimilarMercInfoCard";
import EditSMercSelector from "./FormComponents/EditSMercSelector";
import { SimpleAddPhotoModal } from "./FormComponents/AddPhotoModal";
import { useToast } from "../../../../context/Toast/ToastContext";
import { AnimatePresence } from "motion/react";
import AutoCompleteDropdown, {
  Item,
} from "./FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import { confirm } from "@tauri-apps/plugin-dialog";
import GrupoCatDropdown from "./FormComponents/BASE-UI/AutoCompleteDropdown/GrupoCatAutoComplete";
import CreateButton from "./FormComponents/CreateButton";
import { uploadMercPhoto } from "../../../../api/apiHelper";
import ChangeKeyModal from "./FormComponents/ChangeKeyModal";
import FotosCard from "./FormComponents/FotosCard";

export interface MercEditLoader {
  pageData: Promise<{
    mercadoria: IMercadoria;
    fabricantes: IFabricante[];
    grupos: IGrupo[];
    // categorias: ICategoria[];
    atributos: any[];
    similarMercadoriasList: SimilarMerc[];
    mercPhotos: MercadoriaPhotosListing[];
    keyPhotos: MercadoriaPhotosListing[];
  }>;
  usuario: UsuarioLogado;
  isOfflineMode: boolean;
}

const criandoMercadoriaPlaceholder: SimilarMerc = {
  caracteristicas: [],
  descricao: "Criando Mercadoria",
  estoque02: 0,
  estoque03: 0,
  estoque04: 0,
  id: Date.now(),
  key: 999,
  precoVenda: "0",
};

export function MercadoriaEditPage() {
  const { pageData, usuario, isOfflineMode } = useLoaderData<MercEditLoader>();

  return (
    <Suspense fallback={<MercadoriaFormSkeleton />}>
      <Await resolve={pageData}>
        {(resolvedPageData) => (
          <MercadoriaEditPageContent
            pageData={resolvedPageData}
            usuario={usuario}
            isOfflineMode={isOfflineMode}
          />
        )}
      </Await>
    </Suspense>
  );
}

function MercadoriaEditPageContent({
  pageData,
  usuario,
  isOfflineMode,
}: {
  pageData: Awaited<MercEditLoader["pageData"]>;
  usuario: UsuarioLogado;
  isOfflineMode: boolean;
}) {
  const {
    mercadoria,
    // categorias,
    fabricantes,
    grupos,
    atributos,
    similarMercadoriasList,
    mercPhotos,
    keyPhotos,
  } = pageData;

  const [showModal, setShowModal] = useState(false);
  // const [showToast, setShowToast] = useState(false);
  const [showSimMercChangeModal, setShowSimMercChangeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);

  const [changeKey, setChangeKey] = useState(false);

  const [hasChanged, setHasChanged] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const isSuccess = searchParams.get("success") === "true";
    const actionType = searchParams.get("action");
    const msg = searchParams.get("msg");

    if (!actionType || isSuccess === undefined) return;

    toaster.toast({
      title:
        actionType === "created" ? "Criar Mercadoria" : "Editar Mercadoria",
      message: msg || undefined,
      type: isSuccess ? "success" : "error",
    });

    searchParams.delete("success");
    searchParams.delete("action");

    setSearchParams(searchParams, { replace: true });
  }, [searchParams]);

  // console.log(mercadoria);
  // let isCreate = window.location.href.split("/")[5] === "new";

  // const precoCompraRef = useRef<HTMLInputElement>(null);
  // const precoVendaRef = useRef<HTMLInputElement>(null);
  const [precoCusto, setPrecoCusto] = useState(
    Number(mercadoria.precoCusto) || 0,
  );
  const [precoVenda, setPrecoVenda] = useState(
    Number(mercadoria.precoVenda) || 0,
  );

  const [mercadoriaKey, setMercadoriaKey] = useState<number>(mercadoria.key);

  useEffect(() => {
    setMercadoriaKey(mercadoria.key);
  }, [mercadoria.key]);

  const cor = useMemo(() => {
    return getMercadoriaCor(mercadoria);
  }, [mercadoria]);

  const updateFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const createFabricanteFetcher = useFetcher();

  const createFabricanteValueRef = useRef<HTMLInputElement>(null);

  const handleCreateFabricante = async () => {
    if (!createFabricanteValueRef.current) return;
    const formData = new FormData();
    formData.set("nome", createFabricanteValueRef.current.value);
    await createFabricanteFetcher.submit(formData, {
      action: "/gerente/fabricantes",
      method: "POST",
    });
  };

  const toaster = useToast();

  useEffect(() => {
    if (updateFetcher.data) {
      if (!updateFetcher.data.ok) {
        setShowModal(true);
      } else {
        setHasChanged(false);
        toaster.toast({
          title: "Salvar Mercadoria",
          message: updateFetcher.data.response,
          type: "success",
        });
      }
    }
    if (createFabricanteFetcher.data) {
      toaster.toast({
        title: "Criar Fabricante",
        message: createFabricanteFetcher.data.response,
        type: "success",
      });
    }
  }, [updateFetcher.data]);

  function handlePrecoKeySubmitClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setShowSimMercChangeModal(true);
  }

  function leavePage(to: string | number) {
    if (hasChanged) {
      confirm("Sair da página? As alterações não serão salvas.").then(
        (leave) => {
          if (!leave) return;
          if (typeof to === "number") {
            navigate(to);
          } else {
            navigate(to);
          }
        },
      );
    } else {
      if (typeof to === "number") {
        navigate(to);
      } else {
        navigate(to);
      }
    }
  }

  function deleteHelper() {
    try {
      const formData = new FormData();
      formData.set("id", mercadoria.id.toString());
      deleteFetcher.submit(formData, {
        action: `/gerente/mercadorias/`,
        method: "DELETE",
      });
    } catch (e) {
      console.error(e);
    } finally {
      setShowDeleteModal(false);
    }
  }
  useEffect(() => {
    if (!deleteFetcher.data) {
      return;
    }
    toaster.toast({
      title: "Deletar Mercadoria",
      message: deleteFetcher.data.response,
      type: deleteFetcher.data.ok ? "success" : "error",
    });
  }, [deleteFetcher.data]);

  const fabricanteItems = useMemo<Item[]>(() => {
    return fabricantes.map((fab) => ({ label: fab.nome, value: fab.id }));
  }, [fabricantes]);

  const getMargem = useMemo(() => {
    const compra = Number(precoCusto);
    const venda = Number(precoVenda);
    const margem = ((venda - compra) / venda) * 100;

    if (isNaN(compra) || isNaN(venda) || isNaN(margem)) {
      return;
    }
    if (compra === 0 || venda === 0) {
      return;
    }
    return (
      <span
        className={`font-semibold ${margem >= 50 ? "text-green-800" : "text-red-700"}`}
      >{`${margem.toFixed(2)}%`}</span>
    );
  }, [precoCusto, precoVenda]);

  return (
    <>
      <AnimatePresence>
        {/* Request Modal */}
        {showModal && updateFetcher.data && (
          <FullscreenInfoModal
            title="Erro ao Salvar"
            information={updateFetcher.data.response}
            caution={!updateFetcher.data.ok}
            onClose={() => {
              setShowModal(false);
              if (updateFetcher.data.ok) {
                navigate(`/mercadorias?key=${mercadoria.key}`);
              }
            }}
          />
        )}
        {/* Similar Merc Change Modal */}
        {showSimMercChangeModal && (
          <EditSMercSelector
            similarMerc={similarMercadoriasList}
            mercadoria={mercadoria}
            onClose={() => setShowSimMercChangeModal(false)}
            precoCusto={precoCusto.toString()}
            precoVenda={precoVenda.toString()}
          />
        )}
        {showDeleteModal && (
          <FullscreenInfoModal
            information="Deseja deletar a mercadoria?"
            title={`Deletar mercadoria ${id}?`}
            onClose={() => setShowDeleteModal(false)}
            action={deleteHelper}
            actionLabel="Deletar"
            caution
          />
        )}
        {
          // Photos
          showAddPhotoModal && (
            <SimpleAddPhotoModal
              onClose={() => setShowAddPhotoModal((prev) => !prev)}
              actionTarget={uploadMercPhoto}
              mercadoria={mercadoria}
            />
          )
        }
        {changeKey && (
          <ChangeKeyModal
            action={setMercadoriaKey}
            mercKey={mercadoria.key}
            onClose={() => setChangeKey(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full w-full flex-col overflow-auto bg-slate-50">
        {/* Header Fixo / Barra de Ações */}
        <div className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => leavePage(-1)}
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full text-slate-600 transition-colors ease-out hover:bg-slate-100"
            >
              <ChevronLeft className="pr-0.5" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                {isEdit ? "Editar" : "Criar"} Mercadoria{" "}
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-400">
                  ID: {mercadoria.id}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-sm font-medium text-slate-400">
                  Key: {mercadoria.key}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {mercadoria.createdAt && mercadoria.updatedAt && (
              <div className="hidden items-center gap-4 rounded-lg border border-slate-200/60 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 md:flex">
                <p>
                  Criação:{" "}
                  {new Date(mercadoria.createdAt).toLocaleDateString("pt-BR")}
                </p>
                <div className="h-4 w-px bg-slate-300"></div>
                <p>
                  Atualização:{" "}
                  {new Date(mercadoria.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}

            {isEdit && (
              <button
                type="button"
                className="rounded-lg p-2 transition-all not-disabled:hover:bg-red-100 disabled:cursor-not-allowed"
                onClick={() => setShowDeleteModal(true)}
                disabled={isOfflineMode}
              >
                <Trash2 className="text-red-600" />
              </button>
            )}
            <button
              type="submit"
              form="mercadoria-form"
              title={
                isOfflineMode
                  ? "Desativado em modo offline"
                  : !hasChanged
                    ? "Sem alterações para salvar"
                    : updateFetcher.state !== "idle"
                      ? "Aguarde.."
                      : "Salvar alterações"
              }
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-blue-300"
              disabled={
                updateFetcher.state !== "idle" || isOfflineMode || !hasChanged
              }
            >
              {updateFetcher.state !== "idle" ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando
                </>
              ) : (
                <>
                  <Save size={20} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formulário Principal */}
        <div className="mx-auto w-full max-w-400 flex-1 p-4 sm:p-6 lg:p-8">
          <updateFetcher.Form
            method="post"
            id="mercadoria-form"
            key={mercadoria.id || "new"}
            onChangeCapture={() => setHasChanged(true)}
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            {usuario.funcao === "admin" && (
              <>
                <input type="hidden" name="key" value={mercadoriaKey} />
                <input type="hidden" name="id" value={mercadoria.id} />
                <input
                  type="hidden"
                  name="createdAt"
                  value={mercadoria.createdAt}
                />
              </>
            )}
            {/* ================= COLUNA ESQUERDA ================= */}
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-8">
              {/* Card: Informações Gerais */}
              <div className="flex flex-col gap-5 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Package className="text-slate-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Informações Gerais
                  </h2>
                </div>

                {/* ID e Descrição/Cor */}
                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-12">
                  <div className="flex flex-col justify-start md:col-span-8">
                    <FormTextInput
                      defaultValue={mercadoria.descricao}
                      id="descricao"
                      label="Descrição"
                      placeholder="Descrição da mercadoria"
                      readOnly={isOfflineMode}
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-start md:col-span-4">
                    <FormTextInput
                      defaultValue={cor}
                      id="cor"
                      label="Cor"
                      placeholder="Cor da mercadoria"
                      classNames={{
                        input:
                          "border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-slate-800",
                      }}
                      readOnly={isOfflineMode}
                    />
                  </div>
                </div>

                {/* Fabricante, Grupo e Categoria */}
                <div className="grid grid-cols-1 gap-5 pt-2 sm:grid-cols-3">
                  <div>
                    <AutoCompleteDropdown
                      required
                      creationFetcher={createFabricanteFetcher}
                      createForm={({
                        defaultValue,
                      }: {
                        defaultValue: string;
                      }) => (
                        <div>
                          <FormTextInput
                            id=""
                            label="Nome"
                            placeholder="Nome fabricante"
                            ref={createFabricanteValueRef}
                            defaultValue={defaultValue}
                          />
                        </div>
                      )}
                      items={fabricanteItems}
                      label="Fabricantes"
                      name="fabricanteId"
                      createNew={() => handleCreateFabricante()}
                      readOnly={isOfflineMode}
                      placeholder="Ex. TCIL"
                      defaultValue={
                        mercadoria.fabricante && {
                          label: mercadoria.fabricante.nome,
                          value: mercadoria.fabricante.id,
                        }
                      }
                    />
                  </div>
                  {/* <GrupoCategoriaSelect
                    grupos={grupos}
                    mercadoria={mercadoria}
                    readOnly
                  /> */}
                  <div className="col-span-2">
                    <GrupoCatDropdown
                      required
                      disabled={isOfflineMode}
                      creatable
                      grupos={grupos}
                      defaultGrupo={
                        mercadoria.categoria &&
                        grupos.find(
                          (grp) => grp.id === mercadoria.categoria.grupo.id,
                        )
                      }
                      defaultCat={mercadoria.categoria && mercadoria.categoria}
                      classNames={{ wrapper: "gap-4" }}
                    />
                  </div>
                </div>
              </div>

              {/* Card: Galeria de Fotos */}
              <FotosCard
                isEdit={isEdit}
                isOfflineMode={isOfflineMode}
                mercCor={cor}
                mercadoria={mercadoria}
                mercadoriaKey={mercadoriaKey}
                photos={{ id: mercPhotos, key: keyPhotos }}
                setShowAddPhotoModal={setShowAddPhotoModal}
              />
              {/* Card: Características Dinâmicas */}
              <CaracteristicasCard
                atributos={atributos}
                mercadoria={mercadoria}
                readOnly={isOfflineMode}
              />
              {/* Card: Observações */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <FileText className="text-slate-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Observações
                  </h2>
                </div>

                <div className="flex w-full flex-col gap-1">
                  <textarea
                    name="observacoes"
                    defaultValue={mercadoria.observacoes}
                    className="min-h-30 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 transition-all focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                    placeholder="Adicione notas e observações internas sobre esta mercadoria..."
                    readOnly={isOfflineMode}
                  />
                </div>
              </div>
            </div>

            {/* ================= COLUNA DIREITA ================= */}
            <div className="col-span-1 flex flex-col gap-6 lg:col-span-4">
              {/* Card: Preços */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <DollarSign className="text-slate-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Preço
                  </h2>
                  {isEdit && (
                    <div className="flex w-full justify-end">
                      <button
                        className="cursor-pointer rounded-lg bg-blue-500 px-2.5 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
                        onClick={handlePrecoKeySubmitClick}
                        disabled={isOfflineMode}
                      >
                        Alterar para variações
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div className="flex flex-col">
                      <label className="mb-1.5 ml-1 text-sm font-medium text-slate-600">
                        Custo
                      </label>
                      <MoneyInput
                        disabled={isOfflineMode}
                        // valueRef={precoCompraRef}
                        onChange={setPrecoCusto}
                        value={precoCusto}
                        initial={(mercadoria.precoCusto as string) || ""}
                        id="precoCusto"
                        required
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="mb-1.5 ml-1 text-sm font-medium text-slate-600">
                        Venda
                      </label>
                      <MoneyInput
                        // valueRef={precoVendaRef}
                        onChange={setPrecoVenda}
                        value={precoVenda}
                        initial={(mercadoria.precoVenda as string) || ""}
                        id="precoVenda"
                        disabled={isOfflineMode}
                        required
                      />
                    </div>
                  </div>
                  <div
                    className={`h-fit w-full items-center text-center text-[13px] ${precoCusto == 0 || precoVenda == 0 ? "invisible" : "visible"}`}
                  >
                    <p>
                      <span>Margem: </span>
                      {getMargem}
                    </p>
                  </div>
                </div>
                <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="text-slate-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Estoque
                  </h2>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <EstoqueDisplay
                    label="Loja 02"
                    id="estoque02"
                    defaultValue={mercadoria.estoque02 || 0}
                    disabled={
                      (usuario.local !== "02" &&
                        usuario.funcao !== "admin" &&
                        isEdit) ||
                      isOfflineMode
                    }
                  />
                  <EstoqueDisplay
                    label="Loja 03"
                    id="estoque03"
                    defaultValue={mercadoria.estoque03 || 0}
                    disabled={
                      (usuario.local !== "03" &&
                        usuario.funcao !== "admin" &&
                        isEdit) ||
                      isOfflineMode
                    }
                  />
                  <EstoqueDisplay
                    label="Loja 04"
                    id="estoque04"
                    defaultValue={mercadoria.estoque04 || 0}
                    disabled={
                      (usuario.local !== "04" &&
                        usuario.funcao !== "admin" &&
                        isEdit) ||
                      isOfflineMode
                    }
                  />
                </div>
              </div>

              {/* Card: Variações (Mesma Key) */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Layers className="text-slate-400" size={20} />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Mercadorias Relacionadas
                  </h2>
                  <button
                    type="button"
                    disabled={isOfflineMode || !isEdit}
                    className={`group flex size-fit rounded-lg bg-gray-100 p-1.5 text-xs font-semibold text-gray-500 transition-all not-disabled:cursor-pointer not-disabled:hover:shadow-sm not-disabled:hover:brightness-105 ${mercadoriaKey !== mercadoria.key ? "border border-red-500" : "border-0"}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setChangeKey(true);
                    }}
                  >
                    {isEdit
                      ? `Key ${mercadoriaKey !== -1 ? mercadoriaKey : "Nova"}`
                      : "Key Nova"}
                  </button>
                  <CreateButton
                    onClick={() =>
                      leavePage(
                        `/mercadorias/new?key=${mercadoria.key}&descricao=${mercadoria.descricao}&grupoId=${mercadoria.categoria.grupo.id}&fabricanteId=${mercadoria.fabricante.id}&categoriaId=${mercadoria.categoria.id}&precoCusto=${mercadoria.precoCusto}&precoVenda=${mercadoria.precoVenda}`,
                      )
                    }
                    disabled={isOfflineMode || !isEdit}
                    className="ml-auto"
                  />
                </div>
                <div className="flex max-h-dvh flex-col gap-3 overflow-y-auto overscroll-contain pr-2">
                  {!isEdit && (
                    <SimilarMercInfoCard
                      merc={criandoMercadoriaPlaceholder}
                      isCurrent
                    />
                  )}
                  {similarMercadoriasList.map((merc) => {
                    const isCurrent = merc.id === mercadoria.id;

                    return (
                      <SimilarMercInfoCard
                        key={merc.id}
                        merc={merc}
                        isCurrent={isCurrent}
                      />
                    );
                  })}
                  {similarMercadoriasList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                      <p className="text-sm italic">
                        Nenhuma mercadoria relacionada encontrada.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </updateFetcher.Form>
        </div>
      </div>
    </>
  );
}
