import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import {
  forceUpdateCheck,
  getLastUpdateCheckDate,
  getPendingUpdate,
} from "../../backend/backendHelper";
import { UpdateMetadata } from "../Routers/Init/UpdateTypes";
import { useToast } from "../../context/Toast/ToastContext";
import { confirm } from "@tauri-apps/plugin-dialog";

export default function VersionConfig() {
  const [appVersion, setAppVersion] = useState("");
  const [lastUpdateCheckDate, setLastUpdateCheckDate] = useState("");

  const [updateDisponivel, setUpdateDisponivel] =
    useState<UpdateMetadata | null>(null);
  const toaster = useToast();

  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    (async () => {
      const verionRes = await getVersion();
      const update = await getPendingUpdate();
      let updateCheck = await getLastUpdateCheckDate();

      if (updateCheck) {
        updateCheck = new Date(updateCheck).toLocaleDateString("pt-BR");
      } else {
        updateCheck = "nunca";
      }

      setAppVersion(verionRes);
      setUpdateDisponivel(update);
      setLastUpdateCheckDate(updateCheck);
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
          Versão Atual: <span className="ml-auto font-bold">{appVersion}</span>
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
              className="cursor-pointer text-blue-500 hover:text-blue-600 focus:ring-0"
            >
              Atualiação Disponível:{" "}
              <span className="ml-auto font-bold">
                {updateDisponivel.version}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="w-fit gap-1">
        <button
          className={`flex h-10 w-fit gap-2 rounded-lg bg-blue-500 px-3 py-2 text-right text-white not-disabled:hover:brightness-95 active:brightness-105 disabled:brightness-90 disabled:contrast-75 ${isChecking && "animate-pulse"}`}
          onClick={handleForceUpdateCheck}
          disabled={isChecking}
        >
          <span className={`ml-auto`}>Checar Atualização</span>
        </button>
        <p className="w-full text-center text-xs">
          Ultima verificação: {lastUpdateCheckDate}
        </p>
      </div>
    </div>
  );
}
