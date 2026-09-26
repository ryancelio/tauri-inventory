import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Save, Server, Loader2, RotateCw } from "lucide-react";
import { ApiResponse } from "@tauri-inventory/types";
import { useToast } from "../../context/Toast/ToastContext";
import {
  getApiUrl,
  getIsOfflineModeActive,
  getLastBackupDate,
  setLocalDbPassword,
} from "../../backend/backendHelper";
import ConfigAvançada from "./ModalAvancadas";
import FullscreenModalWrapper from "../App/SharedComponents/FullscreenModal";
import { setApiUrl as RustSetApiUrl } from "../../backend/backendHelper";
import { confirm } from "@tauri-apps/plugin-dialog";
import VersionConfig from "./VersionConfig";

// 1. Criamos uma tipagem para guardar o estado inicial
interface InitialState {
  apiUrl: string;
}

export default function ConfigModal({ onClose }: { onClose: () => void }) {
  const toast = useToast();

  // Estado Inicial para comparação (Dirty Checking)
  const [initialData, setInitialData] = useState<InitialState>({
    apiUrl: "",
  });

  // Estados principais
  const [apiUrl, setApiUrl] = useState("");
  const [updateDbPass, setUpdateDbPass] = useState(false);
  const [dbPass, setDbPass] = useState("");
  const [lastBackup, setLastBackup] = useState("");


  const hasChanged = useMemo(() => {
    const urlChanged = apiUrl !== initialData.apiUrl;
    const passChanged = updateDbPass && dbPass.trim() !== "";
    return urlChanged || passChanged;
  }, [apiUrl, updateDbPass, dbPass, initialData]);

  const handleClose = useCallback(() => {
    if (!hasChanged) {
      onClose();
      return;
    }
    confirm("Allterações nao salvas, deseja fechar?", {
      kind: "warning",
      title: "Fechar Configuração",
    }).then((value) => {
      if (value) {
        onClose();
      }
    });
  }, [hasChanged, onClose]);

  // Estados de loading da tela
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApiChecking, setIsApiChecking] = useState(false);

  // Estado de feedback da API
  const [apiCheckResponse, setApiCheckResponse] = useState({
    error: false,
    message: "",
  });


  useEffect(() => {
    let isMounted = true; // Previne atualizações de estado caso o componente desmonte

    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [url, offline, backup] =
          await Promise.all([
            getApiUrl(),
            getIsOfflineModeActive(),
            getLastBackupDate(false),
          ]);

        if (isMounted) {
          setApiUrl(url);
          setIsOffline(offline);
          setLastBackup(backup);
        }
        setInitialData({ apiUrl: url });
      } catch (e: any) {
        console.error(e);
        if (isMounted) {
          toast.toast({
            title: "Erro de Carregamento",
            message: e.response || "Erro ao carregar configurações.",
            type: "error",
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSave = async () => {
    if (
      apiCheckResponse.error &&
      !window.confirm("Não foi possível conectar à URL. Salvar mesmo assim?")
    ) {
      return;
    }

    // Validação de segurança para a senha
    if (updateDbPass && dbPass.trim() === "") {
      toast.toast({
        title: "Atenção",
        message: "A nova senha não pode estar vazia.",
        type: "error",
      });
      return;
    }

    setIsSaving(true);

    try {
      // 3. LÓGICA DE ENVIO SELETIVO (Dirty Checking)
      const promessasDeSalvamento = [];

      // Só envia a API URL se ela for diferente do que foi carregado inicialmente
      if (apiUrl !== initialData.apiUrl) {
        promessasDeSalvamento.push(RustSetApiUrl(apiUrl));
      }

      // Só envia a senha se o usuário ativou o switch (garantindo que ele quer mudar)
      if (updateDbPass) {
        promessasDeSalvamento.push(setLocalDbPassword(dbPass));
      }

      // Se nada mudou, podemos apenas avisar e fechar
      if (promessasDeSalvamento.length === 0) {
        onClose();
        return;
      }

      await Promise.all(promessasDeSalvamento);

      toast.toast({
        title: "Sucesso",
        message: "Configurações salvas com sucesso!",
        type: "success",
      });

      // Atualiza o estado inicial para o novo estado (caso o modal continue aberto)
      setInitialData({ apiUrl });

      // Reseta o switch de senha por segurança
      setUpdateDbPass(false);
      setDbPass("");
    } catch (e: any) {
      console.error("Erro ao salvar:", e);
      toast.toast({
        title: "Erro ao salvar",
        message: "Falha ao salvar configurações.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const checkApiURL = async () => {
    const trimmedUrl = apiUrl.trim();
    if (!trimmedUrl) return; // Não verifica se o input estiver vazio

    setIsApiChecking(true);

    const hasProtocol = /^(https?|ftp):\/\//i.test(trimmedUrl);
    let payload = trimmedUrl;

    if (!hasProtocol) {
      payload = `http://${trimmedUrl}`;
      setApiUrl(payload); // Atualiza o visual do input
    }

    try {
      const res = await invoke<ApiResponse>("check_api_url", { url: payload });
      setApiCheckResponse({ error: false, message: res.response });
    } catch (e: any) {
      // Lida com a estrutura RustApiError do seu backend
      setApiCheckResponse({
        error: true,
        message:
          e?.message?.response ||
          e?.response ||
          "Falha ao conectar com o servidor",
      });
    } finally {
      setIsApiChecking(false);
    }
  };

  return (
    <FullscreenModalWrapper handleClose={handleClose}>
      <div className="flex flex-col p-6">
        <button
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          onClick={handleClose}
          type="button"
        >
          <X size={20} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600">
            <Server size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Configurações</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Ajuste as preferências do sistema
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Carregando dados...</p>
          </div>
        ) : (
          <div className="flex grow flex-col gap-2">
            <div className="mb-5 flex flex-col gap-2">
              <div className="flex flex-col border-b border-gray-100 pb-2">
                <label
                  htmlFor="apiUrl"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  URL da API
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="apiUrl"
                    value={apiUrl}
                    onBlur={checkApiURL}
                    onFocus={() =>
                      setApiCheckResponse({ error: false, message: "" })
                    }
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="Ex: http://servidorceliomoveis.ddns.net"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      setApiCheckResponse({ error: false, message: "" });
                      checkApiURL();
                    }}
                    disabled={isApiChecking}
                    className="flex shrink-0 items-center justify-center rounded-xl bg-slate-100 p-2.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                  >
                    <RotateCw
                      className={`h-5 w-5 ${
                        apiCheckResponse.error
                          ? "text-red-500"
                          : apiCheckResponse.message
                            ? "text-green-500!"
                            : ""
                      } ${isApiChecking ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                <p
                  className={`mt-1 h-5 pl-2 text-xs font-medium transition-colors ${
                    apiCheckResponse.error ? "text-red-500" : "text-green-600"
                  }`}
                >
                  {apiCheckResponse.message}
                </p>
                <VersionConfig />
              </div>

              <ConfigAvançada
                lastBackup={lastBackup}
                isOffline={isOffline}
                dbPass={dbPass}
                setDbPass={setDbPass}
                updateDbPass={updateDbPass}
                setUpdateDbPass={setUpdateDbPass}
                setLastBackupDate={setLastBackup}
              />
            </div>

            <div className="mt-4 flex justify-between gap-2 pt-4">
              <button
                onClick={() => {
                  handleClose();
                }}
                className="w-1/3 rounded-lg bg-gray-100 transition-all duration-200 ease-out not-active:hover:shadow-sm active:inset-shadow-xs"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={isSaving || isLoading || !hasChanged}
                className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-all not-disabled:hover:bg-blue-700 not-disabled:hover:shadow-md not-disabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Salvando Alterações....
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </FullscreenModalWrapper>
  );
}
