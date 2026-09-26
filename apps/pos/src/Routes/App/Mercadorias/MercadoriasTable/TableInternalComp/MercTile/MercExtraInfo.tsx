import {
  Caracteristica,
  getMercadoriaCor,
  IMercadoria,
  MercadoriaPhotosListing,
} from "@tauri-inventory/types";
import { Boxes, ClipboardList, Image, Package2, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { getKeyPhotos, getMercPhotos } from "../../../../../../api/apiHelper";
import FullscreenImageViewer from "../../../../SharedComponents/ImagesContainers/FullscreenImageViewer";
import { AnimatePresence } from "motion/react";
import { useLoaderData } from "react-router";
import { loader } from "../../MercadoriaPage";
import { useToast } from "../../../../../../context/Toast/ToastContext";

// TODO - Use persisted value
// const API_URL = "http://localhost:8080";

function objectToGrid(
  caract: Caracteristica[],
  // atributosMap: Map<string, string>,
) {
  if (!caract || Object.keys(caract).length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      {caract.map((caracteristica) => (
        <div
          key={caracteristica.id}
          className="flex min-w-0 items-start gap-2 rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2"
        >
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />

          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
              {caracteristica.nome}
            </p>

            <p className="text-sm leading-snug font-medium wrap-break-word text-gray-800 capitalize">
              {caracteristica.tipo === "boolean"
                ? caracteristica.valor === "true"
                  ? "Sim"
                  : "Não"
                : caracteristica.valor}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MercExtraInfo({
  mercadoria,
  isExpanded,
}: {
  mercadoria: IMercadoria;
  isExpanded: boolean;
}) {
  const [mercPhotos, setMercPhotos] = useState<MercadoriaPhotosListing[]>([]);
  const [keyPhotos, setKeyPhotos] = useState<MercadoriaPhotosListing[]>([]);
  const [isPhotoFullscreenOpen, setPhotoFullscreenOpen] = useState(false);
  const { isOfflineMode, apiUrl } = useLoaderData<typeof loader>();
  const toaster = useToast();

  console.log(apiUrl)

  // const atributosMap = useMemo(() => {
  //   const map = new Map<string, string>();
  //   atributos.forEach((at) => map.set(at.id.toString(), at.nome));
  //   return map;
  // }, [atributos]);

  useEffect(() => {
    if (!isExpanded) return;
    if (mercPhotos.length > 0 || keyPhotos.length > 0) {
      return;
    }
    const fetchPhotos = async () => {
      try {
        setMercPhotos(await getMercPhotos(mercadoria.id));
        setKeyPhotos(await getKeyPhotos(mercadoria.key));
      } catch (e) {
        console.error(e);
        toaster.toast({
          title: "Fotos",
          message: `Falha ao receber fotos da mercadoria ${mercadoria.id}`,
          type: "error",
        });
      }
    };
    fetchPhotos();
  }, [mercadoria, isExpanded]);
  return (
    <>
      <AnimatePresence>
        {isPhotoFullscreenOpen && (
          <FullscreenImageViewer
            key="fullscreen-viewer"
            itemGroups={[
              {
                label: getMercadoriaCor(mercadoria),
                items: mercPhotos,
                baseUrl: `${apiUrl}/mercadorias-fotos/${mercadoria.id}`,
                deleteAction: "/gerente/mercadorias/photos",
              },
              {
                label: mercadoria.descricao.split(" ")[0],
                items: keyPhotos,
                baseUrl: `${apiUrl}/mercadorias-fotos/key/${mercadoria.key}`,
                deleteAction: "/gerente/mercadorias/photos/key",
              },
            ]}
            onClose={() => setPhotoFullscreenOpen(false)}
          />
        )}
      </AnimatePresence>
      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-b from-white to-gray-50/50 shadow-sm">
        <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-12">
          {/* LEFT */}
          <div className="flex min-w-0 flex-col gap-4 xl:col-span-8">
            {/* GALERIA + INFO */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* FOTO */}
              <div className="relative flex min-h-45 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-100 lg:col-span-4">
                {mercPhotos.length > 0 && isExpanded ? (
                  <button
                    type="button"
                    className="h-full w-full cursor-pointer p-1.5"
                    onClick={() => setPhotoFullscreenOpen(true)}
                  >
                    <img
                      src={`http://localhost:8080/mercadorias-fotos/${mercadoria.id}/thumb/${mercPhotos[0].url}`}
                      alt=""
                      className="h-full w-full rounded-xl transition-all hover:scale-105"
                    />
                  </button>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200 opacity-60" />

                    <div className="relative z-10 flex flex-col items-center text-gray-500">
                      <Image className="mb-2 h-9 w-9 opacity-70" />

                      <span className="px-4 text-center text-sm font-medium text-wrap">
                        {isOfflineMode
                          ? "Não disponivel offline"
                          : "Sem imagens"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* META INFO */}
              <div className="grid grid-cols-2 gap-3 lg:col-span-8">
                <InfoCard
                  icon={<Boxes className="h-4 w-4" />}
                  label="Grupo"
                  value={mercadoria.categoria.grupo?.nome || "-"}
                />

                <InfoCard
                  icon={<Tag className="h-4 w-4" />}
                  label="Categoria"
                  value={mercadoria.categoria?.nome || "-"}
                />

                <div className="col-span-2">
                  <div className="h-full rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-gray-500" />

                      <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                        Observações
                      </span>
                    </div>

                    <div className="custom-scrollbar max-h-30 overflow-y-auto text-sm leading-relaxed text-gray-700">
                      {mercadoria.observacoes || (
                        <span className="text-gray-400 italic">
                          Nenhuma observação cadastrada.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARACTERISTICAS */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Package2 className="h-4 w-4 text-gray-500" />

                <h4 className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Características
                </h4>
              </div>

              {mercadoria.caracteristicas &&
              mercadoria.caracteristicas.length > 0 ? (
                objectToGrid(mercadoria.caracteristicas)
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Nenhuma característica cadastrada.
                </p>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <div className="min-w-0 xl:col-span-4">
            <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Estoque por Loja
                </h4>

                <div className="text-xs font-medium text-gray-400">
                  {isOfflineMode ? "Verifique antes de vender" : "Tempo real"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <EstoqueDisplay estoque={mercadoria.estoque02} text="Loja 02" />

                <EstoqueDisplay estoque={mercadoria.estoque03} text="Loja 03" />

                <EstoqueDisplay estoque={mercadoria.estoque04} text="Loja 04" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        {icon}

        <span className="text-[11px] font-bold tracking-wider uppercase">
          {label}
        </span>
      </div>

      <p className="truncate text-sm font-semibold text-gray-800 capitalize">
        {value}
      </p>
    </div>
  );
}

function EstoqueDisplay({ estoque, text }: { estoque: number; text: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3">
      <div>
        <p className="text-xs font-bold tracking-wide text-gray-400 uppercase">
          Unidade
        </p>

        <p className="text-sm font-semibold text-gray-700">{text}</p>
      </div>

      <div
        className={`min-w-16 rounded-xl px-3 py-2 text-center text-lg font-bold ${
          estoque <= 0
            ? "bg-red-100 text-red-700"
            : estoque >= 3
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
        } `}
      >
        {estoque}
      </div>
    </div>
  );
}
