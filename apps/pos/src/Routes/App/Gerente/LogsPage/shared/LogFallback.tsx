import { Loader2 } from "lucide-react";

/** Fallback de carregamento compartilhado por todas as rotas de logs. */
export function LogHydrateFallback() {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}
