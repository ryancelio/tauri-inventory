import { useCallback, useState } from "react";
import FullscreenModalWrapper from "../../App/SharedComponents/FullscreenModal";

export default function AppUpdateModal({ onClose}: { onClose:() => void }) {

    const [updateSize,setUpdateSize] = useState(null);
    const [downloadedBytes,setDownloadedBytes] = useState(null);

  return (
    <FullscreenModalWrapper handleClose={onClose}>
      <div>
        <div>
          <h1>Atualização encontrada</h1>
          <p>Versao atual: X</p>
          <p>Nova versão: X</p>
        </div>
        <div className="mt-auto flex">
          {/* <button onClick={}>Adiar</button> */}
          {/* <button onClick={}>Atualizar</button> */}
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
