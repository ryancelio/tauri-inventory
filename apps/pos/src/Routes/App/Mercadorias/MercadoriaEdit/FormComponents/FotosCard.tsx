import { IMercadoria, MercadoriaPhotosListing } from "@tauri-inventory/types";
import { ImageIcon, Ban, Plus } from "lucide-react";
import ImageCarousel from "../../../SharedComponents/ImagesContainers/ImageCarousel";
import CreateButton from "./CreateButton";
import { Dispatch, SetStateAction } from "react";
const API_URL = "http://localhost:8080";

export default function FotosCard({
  isEdit,
  isOfflineMode,
  mercadoria,
  mercadoriaKey,
  photos,
  setShowAddPhotoModal,
  mercCor,
}: {
  isOfflineMode: boolean;
  isEdit: boolean;
  setShowAddPhotoModal: Dispatch<SetStateAction<boolean>>;
  mercadoria: IMercadoria;
  photos: { id: MercadoriaPhotosListing[]; key: MercadoriaPhotosListing[] };
  mercadoriaKey: number | string;
  mercCor: string;
}) {

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-3">
        <ImageIcon className="text-slate-400" size={20} />
        <h2 className="text-lg font-semibold text-slate-800">
          Galeria de Fotos
        </h2>
        <CreateButton
          onClick={() => setShowAddPhotoModal(true)}
          disabled={isOfflineMode || !isEdit}
          className="ml-auto"
        />
      </div>
      {photos.id.length == 0 ? (
        <div
          className={`grid h-48 w-full cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-400 transition-all hover:border-blue-400 hover:bg-slate-100 hover:text-blue-500 ${(isOfflineMode || !isEdit) && "pointer-events-none"}`}
          onClick={() => setShowAddPhotoModal((prev) => !prev)}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="mb-1 rounded-full bg-white p-3 shadow-sm">
              {isOfflineMode || !isEdit ? (
                <Ban size={24} className="text-inherit" />
              ) : (
                <Plus size={24} className="text-inherit" />
              )}
            </div>
            <span className="text-sm font-semibold">
              {isOfflineMode
                ? "Não é possivel adicionar imagens em modo offline."
                : isEdit
                  ? "Clique para adicionar imagens"
                  : "Adicione imagens apos a criação da mercadoria"}
            </span>
            <span className="text-xs font-medium opacity-70">
              PNG, JPG ou WEBP (Max. 5MB)
            </span>
          </div>
        </div>
      ) : (
        <div className="h-96 w-full">
          <ImageCarousel
            itemGroups={[
              {
                label: mercCor,
                items: photos.id,
                baseUrl: `${API_URL}/mercadorias-fotos/${mercadoria.id}`,
                deleteAction: "/gerente/mercadorias/photos",
              },
              {
                label: mercadoria.descricao.split(" ")[0],
                items: photos.key,
                baseUrl: `${API_URL}/mercadorias-fotos/key/${mercadoriaKey}`,
                deleteAction: "/gerente/mercadorias/photos/key",
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
