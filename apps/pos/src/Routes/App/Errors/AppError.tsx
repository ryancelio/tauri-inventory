import { useEffect } from "react";
import { TriangleAlert, Loader2 } from "lucide-react";
import {
  isRouteErrorResponse,
  useRevalidator,
  useRouteError,
} from "react-router";

export function AppError() {
  let error = useRouteError();
  const revalidator = useRevalidator();

  console.error(error);

  // Ao falhar (geralmente por perda de conexão com a API), revalida o status
  // para que o MainLayout detecte o offline e exiba o modal de reconexão por
  // cima, além do feedback de erro nesta área de conteúdo.
  useEffect(() => {
    if (revalidator.state === "idle") {
      revalidator.revalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const message = isRouteErrorResponse(error)
    ? typeof error.data === "string"
      ? error.data
      : `Erro ${error.status}`
    : error instanceof Error
      ? error.message
      : "Erro desconhecido";

  return (
    <div className="grid size-full place-items-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-red-50 p-4 text-red-500">
          <TriangleAlert size={48} strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          Falha ao carregar os dados
        </h2>
        <p className="text-sm text-slate-500">
          {message ||
            "Não foi possível carregar esta tela. Verifique sua conexão com o servidor."}
        </p>
        <button
          onClick={() => revalidator.revalidate()}
          disabled={revalidator.state === "loading"}
          className="flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition-all hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {revalidator.state === "loading" && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Tentar Novamente
        </button>
      </div>
    </div>
  );
}
