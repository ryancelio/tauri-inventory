import { invoke } from "@tauri-apps/api/core";
import {
  ApiListResponse,
  ApiResponse,
  IMercadoria,
  MercadoriaCreate,
  MercadoriaFilter,
  MercadoriaKeyListing,
  MercadoriaReport,
  MercadoriaSimple,
  SimilarMerc,
  SimilarMercUpdate,
} from "@tauri-inventory/types";

export async function getMercadorias(
  filter: MercadoriaFilter,
): Promise<ApiListResponse<IMercadoria>> {
  // console.log(JSON.stringify(filter, null, 2));

  // console.log(JSON.stringify(filter.filter?.caracteristicas, null, 2));
  return await invoke<ApiListResponse<IMercadoria>>("get_mercadorias", {
    filter,
  });
}

export async function getMercadoriaReport(filter: MercadoriaFilter) {
  return await invoke<ApiListResponse<MercadoriaReport>>(
    "get_mercadoria_report",
    { filter },
  );
}

export async function getSimilarMerc(key: number) {
  return await invoke<SimilarMerc[]>("get_similar_mercs", {
    key,
  });
}
export async function updateSimilarMerc({
  // all,
  key,
  mercadoria,
  selectedIds,
}: {
  // all: boolean;
  mercadoria: SimilarMercUpdate;
  key: number;
  selectedIds?: string[];
}) {
  console.log({ key, mercadoria, selectedIds });
  // if (all) {
  //   // Update many by KEY
  //   return await invoke<ApiResponse>("update_all_similar_mercs", {
  //     mercadoria,
  //     key,
  //   });
  // } else {
  // Update many where id in idList
  return await invoke<ApiResponse>("update_similar_by_id", {
    key: key,
    mercadoria: mercadoria,
    selectedIds: selectedIds,
  });
  // }
}

export async function getSingleMercadoria({
  id,
  getDeleted,
}: {
  id: number;
  getDeleted?: boolean;
}) {
  return await invoke<IMercadoria>("get_single_mercadoria", {
    id,
    getAll: getDeleted,
  });
}

export async function createMercadoria(mercadoria: MercadoriaCreate) {
  return await invoke<IMercadoria>("create_mercadoria", {
    mercadoria,
  });
}

export async function updateMercadoria(
  mercadoria: MercadoriaCreate,
  id: number,
) {
  console.log("action called");
  return await invoke<ApiResponse>("update_mercadoria", { mercadoria, id });
}

export async function deleteMercadoria(id: number | string) {
  return await invoke<ApiResponse>("delete_mercadoria", { id: Number(id) });
  // return { response: "Ok" };
}

export async function getMercadoriaKeyListing(query?: string) {
  return await invoke<MercadoriaKeyListing[]>("get_mercadoria_key_listing", {
    query,
  });
}

export async function getMercadoriaSimpleListing(query?: string) {
  return await invoke<MercadoriaSimple[]>("get_mercadorias_simple", {
    search: query,
  });
}
export async function getMercadoriaSimpleListingLog(query?: string) {
  return await invoke<MercadoriaSimple[]>("get_mercadorias_simple_log", {
    search: query,
  });
}
