import { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { ProgressState } from "./UpdateTypes";

export async function updateProgressLoader(): Promise<ProgressState> {
  try {
    const raw = await invoke<ProgressState>("get_update_state");
    return {
      status: raw.status ?? "idle",
      downloaded: raw.downloaded ?? 0,
      total: raw.total ?? null,
      message: raw.message,
    };
  } catch {
    return { status: "idle", downloaded: 0, total: null };
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function UpdateProgress() {
  const initial = useLoaderData() as ProgressState;
  const [state, setState] = useState<ProgressState>(initial);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    const unlistenPromise = win.listen<ProgressState>(
      "update://progress",
      ({ payload }) => {
        setState({
          status: payload.status ?? "idle",
          downloaded: payload.downloaded ?? 0,
          total: payload.total ?? null,
          message: payload.message,
        });
      },
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const pct =
    state.total && state.total > 0
      ? Math.min(100, Math.round((state.downloaded / state.total) * 100))
      : null;

  if (state.status === "error") {
    return (
      <div className="flex h-screen w-screen flex-col gap-3 overflow-hidden bg-white p-4 text-slate-800">
        <div className="flex items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold text-red-600">
            !
          </span>
          <h1 className="text-sm font-semibold">Falha ao atualizar</h1>
        </div>
        <p className="min-h-0 flex-1 overflow-auto rounded-md border border-red-200 bg-red-50 p-2 text-xs text-slate-700">
          {state.message || "Erro desconhecido ao baixar a atualização."}
        </p>
        <p className="text-[11px] text-slate-500">
          A versão instalada não foi alterada. Feche e reabra o aplicativo para
          continuar usando.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const ok = await copyToClipboard(state.message ?? "");
              setCopied(ok);
            }}
            className="flex-1 rounded-lg bg-slate-200 px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-300"
          >
            {copied ? "Copiado!" : "Copiar erro"}
          </button>
          <button
            onClick={() => getCurrentWindow().close()}
            className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-white p-4 text-slate-800">
      <p className="text-sm">
        {state.status === "finished" ? "Reiniciando…" : "Baixando atualização…"}
      </p>
      <progress
        value={pct ?? undefined}
        max={100}
        className="w-full"
      />
      {pct !== null && <span className="text-xs text-slate-500">{pct}%</span>}
    </div>
  );
}