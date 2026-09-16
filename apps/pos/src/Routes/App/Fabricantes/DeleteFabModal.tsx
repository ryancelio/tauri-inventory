import { IFabricante } from "@tauri-inventory/types";
import { FetcherWithComponents, useLoaderData } from "react-router";
import { useEffect, useState } from "react";
import { getFabricanteMercCount } from "../../../api/apiHelper";
import { useToast } from "../../../context/Toast/ToastContext";
import FullscreenModalWrapper from "../SharedComponents/FullscreenModal";
import { Loader2, AlertTriangle } from "lucide-react";
import { FabricantesPageLoaderData } from "./FabricantesPage";
import UISelect from "../Components/BASE-UI/Select";
import AutoCompleteDropdown from "../Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";

export default function DeleteFabModal({
  fabricante,
  fetcher,
  onClose,
}: {
  fabricante: IFabricante;
  onClose: () => void;
  fetcher: FetcherWithComponents<any>;
}) {
  const [fabMercCount, setFabMercCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Novos estados para a lógica de exclusão
  const [selectedNewFab, setSelectedNewFab] = useState("");
  const [cooldown, setCooldown] = useState(5);
  const [showCascadeConfirm, setShowCascadeConfirm] = useState(false);

  const toaster = useToast();
  const { fabricantes } = useLoaderData<FabricantesPageLoaderData>();

  // Fetch da contagem
  useEffect(() => {
    const fetchMercCount = async () => {
      try {
        setLoading(true);
        setFabMercCount(await getFabricanteMercCount(fabricante.id));
      } catch (e) {
        toaster.toast({
          title: "Falha",
          message: "Falha ao receber contagem de mercadorias",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMercCount();
  }, [fabricante, toaster]);

  // Lógica do Cooldown regressivo
  useEffect(() => {
    if (!loading && fabMercCount > 0 && cooldown > 0 && !showCascadeConfirm) {
      const timer = window.setTimeout(() => setCooldown((c) => c - 1), 1);
      return () => window.clearTimeout(timer);
    }
  }, [loading, fabMercCount, cooldown, showCascadeConfirm]);

  const handleSimpleDelete = () => {
    fetcher.submit(
      {
        id: fabricante.id.toString(),
        cascade: "false",
      },
      {
        method: "DELETE",
        action: "/gerente/fabricantes",
      },
    );
    onClose();
  };

  const handleReassignDelete = () => {
    if (!selectedNewFab) {
      toaster.toast({
        title: "Atenção",
        message: "Selecione um fabricante para receber as mercadorias.",
        type: "warning",
      });
      return;
    }
    fetcher.submit(
      {
        id: fabricante.id.toString(),
        newFabricanteId: selectedNewFab,
      },
      {
        method: "POST",
        action: "/gerente/fabricantes/reassign",
      },
    );
    onClose();
  };

  const handleCascadeDelete = () => {
    fetcher.submit(
      {
        id: fabricante.id,
        cascade: "true",
      },
      {
        method: "DELETE",
        action: "/gerente/fabricantes",
      },
    );
    onClose();
  };

  // Lista de fabricantes filtrando o que está sendo excluído
  const fabricantesDisponiveis =
    fabricantes?.filter((f) => f.id !== fabricante.id) || [];

  return (
    <FullscreenModalWrapper handleClose={onClose}>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-lg bg-white p-6 text-gray-800 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Verificando vínculos...</p>
          </div>
        ) : showCascadeConfirm ? (
          // ==========================================
          // TELA 3: CONFIRMAÇÃO DA EXCLUSÃO EM CASCATA
          // ==========================================
          <div className="animate-in fade-in flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-8 w-8" />
              <h2 className="text-xl font-bold">Confirmação</h2>
            </div>

            <p className="text-gray-600">
              Você está prestes a excluir o fabricante{" "}
              <strong>{fabricante.nome}</strong> e{" "}
              <strong>TODAS AS {fabMercCount} MERCADORIAS</strong> vinculadas a
              ele. Essa ação apagará os produtos do sistema.
            </p>
            <p className="font-bold text-red-600">
              Tem certeza ABSOLUTA que deseja continuar?
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCascadeConfirm(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium transition hover:bg-gray-300"
              >
                Cancelar e Voltar
              </button>
              <button
                onClick={handleCascadeDelete}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
              >
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        ) : fabMercCount === 0 ? (
          // ==========================================
          // TELA 1: EXCLUSÃO SIMPLES (0 VÍNCULOS)
          // ==========================================
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Excluir Fabricante</h2>
            <p className="text-gray-600">
              Deseja realmente excluir o fabricante{" "}
              <strong>{fabricante.nome}</strong>? Ele não possui nenhuma
              mercadoria vinculada, a exclusão é segura.
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium transition hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSimpleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        ) : (
          // ==========================================
          // TELA 2: EXCLUSÃO COM VÍNCULOS (TRANSFERIR OU CASCATA)
          // ==========================================
          <div className="flex flex-col gap-5">
            <div className="text-amber-550 flex items-center gap-3 border-b pb-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-800">
                Atenção: Fabricante em Uso
              </h2>
            </div>

            <p className="text-gray-600">
              O fabricante <strong>{fabricante.nome}</strong> possui{" "}
              <strong>{fabMercCount} mercadorias</strong> vinculadas a ele. O
              que você deseja fazer?
            </p>

            {/* Opção A: Transferir */}
            <div className="flex flex-col gap-3 rounded-md border border-blue-100 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">
                Opção Recomendada: Transferir Mercadorias
              </h3>
              <p className="text-sm text-blue-800">
                Mova as mercadorias para outro fabricante antes de excluir este.
              </p>

              {/* <select
                className="w-full rounded border border-gray-300 bg-white p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={selectedNewFab}
                onChange={(e) => setSelectedNewFab(e.target.value)}
              >
                <option value="">Selecione o novo fabricante...</option>
                {fabricantesDisponiveis.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select> */}
              <AutoCompleteDropdown items={fabricantesDisponiveis.map((fab) => ({label: fab.nome,value: fab.id}))}/>

              <button
                onClick={handleReassignDelete}
                className="mt-2 w-full rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:brightness-95"
              >
                Transferir e Excluir
              </button>
            </div>

            {/* Opção B: Exclusão em Cascata (Perigoso) */}
            <div className="flex flex-col gap-3 rounded-md border border-red-100 p-4">
              <h3 className="font-semibold text-red-700">Zona de Perigo</h3>

              <button
                disabled={cooldown > 0}
                onClick={() => setShowCascadeConfirm(true)}
                className="w-full rounded border border-red-600 px-4 py-2 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cooldown > 0
                  ? `Excluir Fabricante e Mercadorias (${cooldown}s)`
                  : "Excluir Fabricante e Mercadorias"}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 font-medium text-gray-600 shadow-sm transition hover:bg-gray-100"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        )}
      </div>
    </FullscreenModalWrapper>
  );
}
