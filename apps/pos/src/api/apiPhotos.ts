import { invoke } from "@tauri-apps/api/core";
import { ApiResponse, IMercadoria, MercadoriaPhotosListing } from "@tauri-inventory/types";

export async function getMercPhotos(mercadoriaId: number) {
  return await invoke<MercadoriaPhotosListing[]>("get_merc_photos", {
    mercadoriaId,
  });
}

export async function getKeyPhotos(mercKey: number) {
  return await invoke<MercadoriaPhotosListing[]>("get_key_photos", {
    mercadoriaKey: mercKey,
  });
}

export async function uploadMercPhoto({
  changeAll,
  filePaths,
  mercadoria,
}: {
  filePaths: string[];
  mercadoria: IMercadoria;
  changeAll: boolean;
}) {
  if (changeAll) {
    return await invoke<ApiResponse>("upload_key_photo", {
      files: filePaths,
      mercKey: Number(mercadoria.key),
    });
  } else {
    return await invoke<ApiResponse>("upload_merc_photo", {
      files: filePaths,
      id: mercadoria.id,
    });
  }
}

export async function deleteKeyPhoto(id: number) {
    return await invoke<ApiResponse>("delete_key_photo",{id})
}

export async function deleteMercPhoto(id: number){
      return await invoke<ApiResponse>("delete_merc_photo", { id });

}