import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import {
  forceUpdateCheck,
  getPendingUpdate,
} from "../../backend/backendHelper";
import { UpdateMetadata } from "../Routers/Init/UpdateTypes";
import { useToast } from "../../context/Toast/ToastContext";
import { Loader2 } from "lucide-react";
import { confirm } from "@tauri-apps/plugin-dialog";

export default function VersionConfig() {
  const [appVersion, setAppVersion] = useState("");
  const [updateDisponivel, setUpdateDisponivel] =
    useState<UpdateMetadata | null>(null);
  const toaster = useToast();

  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    (async () => {
      const verionRes = await getVersion();
      const update = await getPendingUpdate();

      setAppVersion(verionRes);
      setUpdateDisponivel(update);
    })();
  }, []);

  const handleForceUpdateCheck = async () => {
    setIsChecking(true);
    try {
      const update = await forceUpdateCheck();
      if (update) {
        toaster.info({
          title: "Atualização encontrada",
          message: `Nova versão: ${update.version} disponível.`,
        });
      } else {
        toaster.success({
          title: "Nenhum update encontrado.",
          message: "Seu app está atualizado.",
        });
      }
    } catch (e) {
      console.error(e);
      toaster.error({
        title: "Falha ao checar atualizações.",
        message: "Se o erro persistir, entre em contato com um administrador",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex justify-between">
      <div className="flex flex-col gap-1">
        <p>
          Versão Atual: <span className="font-bold ml-auto">{appVersion}</span>
        </p>
        {updateDisponivel !== null && (
          <div>
            <button
              onClick={() => {
                confirm(
                  `Atualizar para versão ${updateDisponivel.version}? O app será reiniciado.`,
                  { okLabel: "Atualizar", cancelLabel: "Adiar" },
                ).then((confirmed) => {
                  if (confirmed) {
                    // startUpdate()
                    console.log("Atualizar!");
                  }
                });
              }}
              className="focus:ring-0 text-blue-500 cursor-pointer hover:text-blue-600"
            >
              Atualiação Disponível:{" "}
              <span className="font-bold ml-auto">{updateDisponivel.version}</span>
            </button>
          </div>
        )}
      </div>
      <button
        className="flex h-10 gap-2 rounded-lg bg-blue-500 px-3 py-2 text-white not-disabled:hover:brightness-95 active:brightness-105 disabled:brightness-90 disabled:contrast-75"
        onClick={handleForceUpdateCheck}
        disabled={isChecking}
      >
        {isChecking && (
          <span>
            <Loader2 className="animate-spin" />
          </span>
        )}
        Checar Atualização
      </button>
    </div>
  );
}
