import FullscreenModalWrapper from "../../App/SharedComponents/FullscreenModal";
import { startUpdate, UpdateMetadata } from "../../../backend/backendHelper";
import { confirm } from "@tauri-apps/plugin-dialog";

export default function AppUpdateModal({
  onClose,
  update,
}: {
  onClose: () => void;
  update: UpdateMetadata;
}) {
  return (
    <FullscreenModalWrapper handleClose={onClose}>
      <div className="p-4">
        <div>
          <h1 className="mb-4 text-lg font-semibold">Atualização encontrada</h1>
          <p>
            Versao atual:{" "}
            <span className="ml-auto font-semibold">
              {update.current_version}
            </span>
          </p>
          <p>
            Nova versão:{" "}
            <span className="ml-auto font-semibold">{update.version}</span>
          </p>
        </div>
        <div className="mt-3 rounded-lg bg-slate-200 p-3 text-slate-700 inset-shadow-2xs">
          <p className="pb-2 font-semibold text-slate-900">
            Notas da atualização:
          </p>
          <p>{update.body}</p>
        </div>
        <div className="mt-auto flex justify-end gap-3 pt-3">
          <button
            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:brightness-95 active:brightness-105"
            onClick={onClose}
          >
            Adiar
          </button>
          <button
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:brightness-95 active:brightness-105"
            onClick={() => {
              confirm("Baixar e Instalar atualização? O app será reiniciado.")
                .then((confirmed) => {
                  if (confirmed) {
                    startUpdate();
                  }
                })
                .catch((error) => {
                  console.error(error);
                });
            }}
          >
            Atualizar
          </button>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
