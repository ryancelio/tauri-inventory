import { ILoja } from "@tauri-inventory/types";
import FullscreenModalWrapper from "../../SharedComponents/FullscreenModal";
import { TriangleAlert } from "lucide-react";
import { useFetcher } from "react-router";
import { action } from "./LojasPage";
import { useEffect } from "react";

export default function DeleteLojaModal({
  onClose,
  loja,
}: {
  onClose: () => void;
  loja: ILoja;
}) {
  const deleteFetcher = useFetcher<typeof action>();

  useEffect(() => {
    if (deleteFetcher.state === "idle") {
      if (deleteFetcher?.data?.ok) {
        onClose();
      } else if (deleteFetcher.data?.error) {
        console.error(deleteFetcher.data.error);
      }
    }
  }, [deleteFetcher.data, deleteFetcher.state]);
  const handleClose = () => {
    deleteFetcher.submit(
      { id: loja.id },
      { action: "/gerente/lojas", method: "DELETE" },
    );
  };
  return (
    <FullscreenModalWrapper handleClose={onClose} closeButton>
      <div className="flex flex-col gap-5 p-4">
        <h1 className="text-xl font-semibold text-slate-800">
          Apagar Loja {loja.nome}
        </h1>
        <div className="flex w-full justify-center">
          <div className="flex flex-col rounded-lg bg-slate-200 p-3 text-slate-600">
            <h2 className="text-lg font-semibold">{loja.nome}</h2>
            <p className="text-sm">
              <span className="font-semibold">cpf:</span> {loja.CNPJ}
            </p>
            <p className="text-sm">
              <span className="font-semibold">criada em:</span>{" "}
              {new Date(loja.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          {/*<div className="flex flex-col">
            <h1>
              <span className="font-semibold">{lojaData.numeroUsuarios}</span>{" "}
              usuarios
            </h1>
            <h1>
              <span className="font-semibold">{lojaData.numeroUsuarios}</span>{" "}
              mercadorias em estoque
            </h1>
          </div>*/}
        </div>
        <div>
          <p className="flex items-center gap-2 rounded-lg bg-red-600 p-1.5 text-white">
            <span className="">
              <TriangleAlert size={22} />
            </span>
            <span>
              Você perderá todos os dados relacionados a essa loja, o estoque
              será zerado, e os usuarios desativados.
            </span>
          </p>
        </div>
        <div className="mt-auto flex w-full justify-around gap-3">
          <button
            className="w-full rounded-lg py-2 transition-colors ease-out hover:bg-slate-200"
            onClick={() => onClose()}
          >
            Cancelar
          </button>
          <button
            className="w-full rounded-lg bg-red-500 py-2 font-semibold text-white transition-colors ease-out not-disabled:hover:brightness-90 not-disabled:active:brightness-110"
            onClick={() => handleClose()}
            disabled={deleteFetcher.state !== "idle"}
          >
            Deletar
          </button>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
