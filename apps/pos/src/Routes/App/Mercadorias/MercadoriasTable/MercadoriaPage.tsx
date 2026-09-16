import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  ApiListResponse,
  IAtributo,
  IFabricante,
  IGrupo,
  IMercadoria,
  MercadoriaFilter,
  UsuarioLogado,
} from "@tauri-inventory/types";
import {
  getAtributos,
  getFabricantes,
  getGrupos,
  getMercadorias,
} from "../../../../api/apiHelper";
import {
  Await,
  useLoaderData,
  useSearchParams,
  useAsyncError,
  useNavigate,
  LoaderFunctionArgs,
} from "react-router";
import { Loader2, TriangleAlert } from "lucide-react";
import { AppError } from "../../Errors/AppError";
import MercListForm from "./TableInternalComp/MercListForm";
import qs from "qs";
import MercadoriasListSkeleton from "../MercadoriaEdit/Skeleton/MercadoriaListSkeleton";
import { userContext } from "../../../../context/contexts";
import { getIsOfflineModeActive } from "../../../../backend/backendHelper";
import { useToast } from "../../../../context/Toast/ToastContext";
import MercadoriaListVirtual from "./MercadoriaListVirtual";
import { MercadoriaReport } from "../../../../Reports/MercadoriaReport";
import { AnimatePresence } from "motion/react";
import FormDrawer from "./TableInternalComp/FormDrawer";

function paramsToMercFilter(parsedQuery: any): MercadoriaFilter {
  const descricao = parsedQuery.descricao
    ? String(parsedQuery.descricao)
    : undefined;
  const key = Number(parsedQuery.key) || undefined;
  const fabricanteId = Number(parsedQuery.fabricanteId) || undefined;
  const categoriaId = Number(parsedQuery.categoriaId) || undefined;
  const grupoId = Number(parsedQuery.grupoId) || undefined;
  const exato = parsedQuery.exato || undefined;

  const descricaoFilter =
    exato === "on" ? { eq: descricao } : { contains: descricao };

  // const estoque02 = Number(parsedQuery.estoque02) || undefined;
  // const estoque03 = Number(parsedQuery.estoque03) || undefined;
  // const estoque04 = Number(parsedQuery.estoque04) || undefined;

  const estoque02 = parsedQuery.estoque02Positivo === "on" ? 0 : undefined;
  const estoque03 = parsedQuery.estoque03Positivo === "on" ? 0 : undefined;
  const estoque04 = parsedQuery.estoque04Positivo === "on" ? 0 : undefined;

  const observacoes = parsedQuery.observacoes
    ? String(parsedQuery.observacoes)
    : undefined;

  let caracteristicas = parsedQuery.caracteristicas || {};

  // const estoquePositivo = parsedQuery.estoquePositivo === "on";

  const limit = parsedQuery.limit ? Number(parsedQuery.limit) : 50;
  const page = parsedQuery.page ? Number(parsedQuery.page) : 1;

  const id = Number(parsedQuery.id) || undefined;

  return {
    filter: {
      id: { eq: id },
      key: { eq: key },
      descricao: descricaoFilter,
      fabricanteId: { eq: fabricanteId },
      categoriaId: { eq: categoriaId },
      grupoId: { eq: grupoId },
      estoque02: { gt: estoque02 },
      estoque03: { gt: estoque03 },
      estoque04: { gt: estoque04 },
      observacoes: { contains: observacoes },
      precoCusto: {},
      precoVenda: {},
      caracteristicas,
    },
    limit,
    page,
  } as MercadoriaFilter;
}

export const ErrorBoundary = AppError;

// Cache em memória para evitar requisições redundantes de dados auxiliares
// let cachedFabricantes: IFabricante[] | null = null;
// let cachedGrupos: IGrupo[] | null = null;
// let cachedAtributos: any[] | null = null;

export interface MercPageLoaderData {
  mercadorias: Promise<ApiListResponse<IMercadoria>>;
  fabricantes: IFabricante[];
  grupos: IGrupo[];
  atributos: IAtributo[];
  usuario: UsuarioLogado;
  isOfflineMode: boolean;
  filter: MercadoriaFilter;
}

export const HydrateFallback = () => {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);

    const parsedQuery = qs.parse(url.search, {
      ignoreQueryPrefix: true,
      parseArrays: false,
      decoder(str, defaultDecoder, charset) {
        const num = Number(str);
        if (!isNaN(num) && str.trim() !== "") {
          return num;
        }
        if (str === "true") return true;
        if (str === "false") return false;
        return defaultDecoder(str, defaultDecoder, charset);
      },
    });

    const filter = paramsToMercFilter(parsedQuery);
    console.log(JSON.stringify(filter));
    const mercadorias = getMercadorias(filter);
    const usuario = context.get(userContext);

    if (!usuario) {
      throw new Error("Usuario deve estar logado.");
    }

    const isOfflineMode = await getIsOfflineModeActive();
    const fabricantes = await getFabricantes();
    const grupos = await getGrupos();
    const atributos = await getAtributos();

    return {
      mercadorias,
      usuario,
      fabricantes,
      // categorias: cachedCategorias,
      grupos,
      atributos,
      isOfflineMode,
      filter,
    };
  } catch (e: any) {
    // Verifica se o erro possui a estrutura específica retornada pelo Rust
    if (e?.code && e?.message?.response) {
      throw new Response(e.message.response, { status: e.code });
    }

    // Tratamento de fallback para erros inesperados
    const errorMessage =
      e instanceof Error
        ? e.message
        : "Erro inesperado ao carregar as mercadorias";
    throw new Response(errorMessage, { status: 500 });
  }
};

function MercadoriasError() {
  const error = useAsyncError() as any;
  const navigate = useNavigate();

  const errorMessage =
    error?.message?.response ||
    error?.message ||
    error?.data ||
    "Ocorreu um erro inesperado ao carregar as mercadorias. Verifique sua conexão com o servidor.";

  return (
    <div className="flex h-full grow flex-col items-center justify-center rounded-t-xl border-x border-t border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mb-4 rounded-full bg-red-50 p-4 text-red-500">
        <TriangleAlert size={48} strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-xl font-bold text-slate-800">
        Falha ao carregar mercadorias
      </h2>
      <p className="mb-6 max-w-md text-slate-500">{errorMessage}</p>
      <button
        onClick={() => navigate("/mercadorias")}
        className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-all hover:bg-blue-700 active:bg-blue-800"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

const LOJAS_PLACEHOLDERS = [
  {
    id: 1,
    nome: "02",
  },
  {
    id: 2,
    nome: "03",
  },
  {
    id: 3,
    nome: "04",
  },
];

export function Component() {
  const { mercadorias, usuario, filter, atributos, grupos } =
    useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();
  const [reportOpen, setReportOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const caracteristicasRef = useRef<any>({});

  const resetFormKey = useCallback(() => {
    setResetKey((prev) => prev + 1);
  }, [setResetKey]);

  const submitForm = (delay = 500) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!formRef.current) return;
      const formData = new FormData(formRef.current);
      const data = Object.fromEntries(formData.entries());

      for (const [key, value] of Object.entries(data)) {
        if(value === ""){
          delete data[key]
        }
      }

      if (Object.keys(caracteristicasRef.current).length > 0) {
        data.caracteristicas = caracteristicasRef.current;
      }

      const queryString = qs.stringify(data, { arrayFormat: "brackets",skipNulls: true });
      // navigate(`?${queryString}`, { replace: true });
      setSearchParams(queryString)

    }, delay);
  };

  const toaster = useToast();

  useEffect(() => {
    // TOAST INFO
    const msg = searchParams.get("msg");
    if (msg) {
      // Exiba sua notificação: toast.success(msg);

      toaster.toast({
        title: "Deletar Mercadoria",
        message: msg,
        type: "success",
      });

      searchParams.delete("msg");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <AnimatePresence>
        {reportOpen && (
          <MercadoriaReport
            onClose={() => setReportOpen(false)}
            filter={filter}
          />
        )}
      </AnimatePresence>
      {/* Drawer */}
      {/* <AnimatePresence mode="wait"> */}
      {/* {isDrawerOpen && ( */}
      <FormDrawer
        key={resetKey}
        atributos={atributos}
        caracteristicasRef={caracteristicasRef}
        grupos={grupos}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        lojasPlaceholder={LOJAS_PLACEHOLDERS}
        resetKey={resetKey}
        submitForm={submitForm}
      />
      {/* )} */}
      {/* </AnimatePresence> */}
      <div className="h-full w-full bg-slate-50/80 p-4 sm:p-6 lg:p-8 lg:py-1.5">
        <div className="flex h-full w-full flex-col overflow-hidden">
          {/* Header */}
          <div className="z-40 shrink-0">
            <MercListForm
              openReportModal={() => setReportOpen(true)}
              caracteristicasRef={caracteristicasRef}
              formKey={resetKey}
              formRef={formRef}
              openDrawer={() => setIsDrawerOpen(true)}
              resetFormKey={resetFormKey}
              submitForm={submitForm}
            />
          </div>
          <Suspense fallback={<MercadoriasListSkeleton />}>
            <Await resolve={mercadorias} errorElement={<MercadoriasError />}>
              {(resolvedMercadorias) => (
                <MercadoriaListVirtual
                  resolvedMercadorias={resolvedMercadorias}
                  usuario={usuario}
                />
              )}
            </Await>
          </Suspense>
        </div>
      </div>
    </>
  );
}
