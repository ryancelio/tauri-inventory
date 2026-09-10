import { TriangleAlert } from "lucide-react";
import { useRouteError, isRouteErrorResponse } from "react-router";

export function AppError() {
  let error = useRouteError();

  console.error(error);

  if (isRouteErrorResponse(error)) {
    return (
      <div className="w-full h-full p-2">
        <div className="bg-red-50 h-full w-full rounded-lg border-dotted border-3 border-red-400 grid place-items-center">
          <div className="flex flex-col gap-1 justify-center">
            <div className="flex items-center justify-center">
              <TriangleAlert className="text-yellow-300" size={40} />
              <span className="text-lg font-semibold">Erro {error.status}</span>
            </div>
            <div className="">{error.data}</div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <p>
          Erro: {error instanceof Error ? error.message : "Erro desconhecido"}
        </p>
      </div>
    );
  }
}
