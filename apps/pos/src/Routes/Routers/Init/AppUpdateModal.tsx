import FullscreenModalWrapper from "../../App/SharedComponents/FullscreenModal";
import { startUpdate, UpdateMetadata } from "../../../backend/backendHelper";

export default function AppUpdateModal({
  onClose,
  update,
}: {
  onClose: () => void;
  update: UpdateMetadata;
}) {
  return (
    <FullscreenModalWrapper handleClose={onClose}>
      <div>
        <div>
          <h1>Atualização encontrada</h1>
          <p>Versao atual: {update.current_version}</p>
          <p>Nova versão: {update.version}</p>
        </div>
        <div className="mt-auto flex">
          <button onClick={onClose}>Adiar</button>
          <button onClick={startUpdate}>Atualizar</button>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}