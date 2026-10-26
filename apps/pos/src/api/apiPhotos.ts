import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import {
  ApiResponse,
  IMercadoria,
  MercadoriaPhotosListing,
} from "@tauri-inventory/types";
export interface BulkPhotoRequest {
  items: MercadoriaPhotosListing[];
  is_thumb: boolean;
  base_url: String;
}

export async function getMercImage({
  baseUrl,
  filename,
  isThumb,
}: {
  baseUrl: string;
  filename: string;
  isThumb: boolean;
  }) {
  const img_path = await invoke<string>("get_merc_images", {
    baseUrl,
    filename,
    isThumb
  });
  const img = convertFileSrc(img_path);
  return img;
}
export async function getMercImageBulk(imageRequest: BulkPhotoRequest) {
  console.log(imageRequest)
  const img_paths = await invoke<{id: number, path: string}[]>("get_merc_img_bulk", {
    requests: imageRequest,
  });
  const imgs = img_paths.map((img) => ({id: img.id, src: convertFileSrc(img.path)}));
  return imgs;
}

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
  return await invoke<ApiResponse>("delete_key_photo", { id });
}

export async function deleteMercPhoto(id: number) {
  return await invoke<ApiResponse>("delete_merc_photo", { id });
}
