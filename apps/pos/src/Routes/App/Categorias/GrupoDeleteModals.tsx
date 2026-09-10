import { IGrupo } from "@tauri-inventory/types";
import { useEffect } from "react";
import { useFetcher } from "react-router";
import FullscreenInfoModal from "../SharedComponents/InfoModal";
import { useToast } from "../../../context/Toast/ToastContext";

export function GrupoDeleteModal({
  grupo,
  onClose,
}: {
  grupo: IGrupo;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const toaster = useToast();

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.set("id", grupo.id.toString());

    fetcher.submit(formData, {
      action: "/gerente/grupos",
      method: "DELETE",
    });
  };

  useEffect(() => {
    if (!fetcher.data) return;
    console.log(fetcher.data);

    toaster.toast({
      title: "Deletar Grupo",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });
  }, [fetcher.data]);

  return (
    <FullscreenInfoModal
      fetcher={fetcher}
      onClose={onClose}
      title={`Deletar Grupo ${grupo.nome}?`}
      information="Todas as categorias associadas a ele serão perdidas"
      actionLabel="Deletar"
      action={handleSubmit}
      caution
    />
  );
}
