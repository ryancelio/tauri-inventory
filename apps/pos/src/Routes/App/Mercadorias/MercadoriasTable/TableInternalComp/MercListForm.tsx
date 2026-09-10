import {
  PlusCircle,
  Search,
  X,
  SlidersHorizontal,
  Printer,
} from "lucide-react";
import { Form, Link, useLoaderData, useNavigate, useSearchParams } from "react-router";
import { useMemo, RefObject } from "react";
import { MercPageLoaderData } from "../MercadoriaPage";
import AutoCompleteDropdown from "../../MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

// const DEFAULT_ATTRIBUTES_BY_GROUP: Record<string, string[]> = {
//   Móveis: ["cor", "portas", "gavetas", "material"],
// };

// const DEFAULT_GRUPO = {
//   id: -1000,
//   categorias: [],
//   createdAt: "",
//   nome: "Todos",
//   updatedAt: "",
// };

export default function MercListForm({
  openReportModal,
  openDrawer,
  resetFormKey,
  formKey,
  submitForm,
  formRef,
  caracteristicasRef,
}: {
  openReportModal: () => void;
  openDrawer: () => void;
  resetFormKey: () => void;
  formKey: number;
  submitForm: (delay?: number) => void;
  formRef: RefObject<HTMLFormElement | null>;
  caracteristicasRef: RefObject<any>;
}) {
  const navigate = useNavigate();

  const { fabricantes, usuario, isOfflineMode } =
    useLoaderData<MercPageLoaderData>();

  // const query = new URL(location.href).searchParams;
    const [searchParams] = useSearchParams();

  const handleFormChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    if (!e.target.name) return;
    let delay = 500;
    switch (e.target.name) {
      case "descricao":
        delay = 500;
        break;
      case "fabricanteId":
        delay = 0;
        break;
      case "grupoId":
        delay = 0;
        break;
      case "categoriaId":
        delay = 0;
        break;
    }

    submitForm(delay);
  };

  const handleCleanFilter = () => {
    formRef.current?.reset();
    resetFormKey();
    caracteristicasRef.current = {};
    navigate("?");
  };

  const fabricanteItems = useMemo(() => {
    return fabricantes.map((fab) => ({ value: fab.id, label: fab.nome }));
  }, [fabricantes]);

  return (
    <>
      <Form
        id="merc-list-form"
        ref={formRef}
        method="GET"
        onChange={handleFormChange}
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
        className="flex w-full flex-col"
      >
        <div className="relative z-20 mb-4 flex w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 pb-7 shadow-sm transition-all">
          {/* Top Row: Main Search & New Button */}
          <button
            type="button"
            className="absolute right-3 bottom-1.5 flex cursor-pointer items-center justify-center text-xs font-semibold text-gray-600 hover:text-blue-600 disabled:text-gray-300"
            onClick={(e) => {
              e.preventDefault()
              handleCleanFilter()}}
            disabled={searchParams.size == 0}
          >
            <X size={16} className="mt-0.5" />
            <span className="">Remover filtros</span>
          </button>
          <button
            className="absolute top-1 right-1 size-8 cursor-pointer rounded-lg p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            type="button"
            onClick={openReportModal}
          >
            <Printer className="h-full w-full" />
          </button>
          <div className="flex flex-1 flex-col items-end gap-4 xl:flex-row">
            <div className="w-full min-w-60 flex-1 gap-1.5">
              <label
                htmlFor="descricao"
                className="text-sm font-semibold text-gray-800"
              >
                Descrição
              </label>
              <div className="relative">
                <Search
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="search"
                  name="descricao"
                  id="descricao"
                  placeholder="Pesquisar por descrição..."
                  className="block h-fit w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-lg text-gray-800 placeholder-gray-400 transition-all outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-200 disabled:opacity-70 data-readonly:bg-gray-50"
                />
              </div>
            </div>

            <div className="w-full shrink-0 xl:w-64">
              <AutoCompleteDropdown
                key={formKey}
                items={fabricanteItems}
                label="Fabricante"
                name="fabricanteId"
                onValueChange={() => submitForm(0)}
                placeholder={`Ex. ${fabricantes[0].nome}`}
              />
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => openDrawer()}
                className="flex h-10.5 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <SlidersHorizontal size={18} />
                <span className="hidden sm:inline">Filtros Avançados</span>
              </button>

              {usuario.funcao !== "vendedor" && (
                <Link
                  onClick={(e) => {
                    if (isOfflineMode) {
                      e.preventDefault();
                      console.log("CLicado mas nao navegado");
                    }
                  }}
                  to="./new"
                  className={`flex h-10.5 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-all ${isOfflineMode ? "cursor-not-allowed bg-blue-300" : "bg-blue-600 shadow-sm hover:bg-blue-700 active:inset-shadow-sm active:inset-shadow-black/20"}`}
                  title={
                    isOfflineMode ? "Nao permitido em modo offline" : undefined
                  }
                >
                  <PlusCircle size={18} />
                  <span className="hidden sm:inline">Nova Mercadoria</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </Form>
    </>
  );
}
