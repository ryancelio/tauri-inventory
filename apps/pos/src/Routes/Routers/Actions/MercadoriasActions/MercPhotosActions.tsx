import { invoke } from "@tauri-apps/api/core";
import { ApiResponse } from "@tauri-inventory/types";
import { deleteMercPhoto } from "../../../../api/apiHelper";

export async function AddMercadoriaPhotoAction(images: File[], id: number) {
  return await invoke<ApiResponse>("upload_merc_photo", {
    images,
    id: Number(id),
  });
}

export async function DeleteMercadoriaPhotoAction(id: number) {
  return await deleteMercPhoto(id)
}
