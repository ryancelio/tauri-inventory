import { useEffect, useState } from "react";
import { MercadoriaPhotosListing } from "@tauri-inventory/types";
import { getMercImageBulk } from "../../../../api/apiPhotos";

export interface CarouselGroup {
  label: string;
  items: MercadoriaPhotosListing[];
  baseUrl: string;
  deleteAction?: string;
}

export interface GroupMeta {
  label: string;
  deleteAction?: string;
}

export interface CarouselImage {
  id: number;
  src: string;
  thumbSrc: string;
  groupIndex: number;
}

interface CarouselState {
  images: CarouselImage[];
  groups: GroupMeta[];
  loading: boolean;
}

/**
 * Resolve full-size and thumbnail paths for every group through the Rust
 * backend (via `getMerc_img_bulk`), keeping full and thumb in a single entry.
 *
 * Callers should pass a stable `itemGroups` reference (e.g. from `useMemo`),
 * otherwise the whole gallery is refetched on unrelated re-renders.
 */
export function useCarouselImages(itemGroups: CarouselGroup[]): CarouselState {
  const [state, setState] = useState<CarouselState>({
    images: [],
    groups: [],
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    setState((prev) => ({ ...prev, loading: true }));

    (async () => {
      const results = await Promise.allSettled(
        itemGroups.map(async (group, groupIndex) => {
          if (group.items.length === 0) return [];

          const [full, thumbs] = await Promise.all([
            getMercImageBulk({
              base_url: group.baseUrl,
              is_thumb: false,
              items: group.items,
            }),
            getMercImageBulk({
              base_url: group.baseUrl,
              is_thumb: true,
              items: group.items,
            }),
          ]);

          const thumbById = new Map(
            thumbs.map((thumb) => [thumb.id, thumb.src]),
          );

          return full.map<CarouselImage>((photo) => ({
            id: photo.id,
            src: photo.src,
            thumbSrc: thumbById.get(photo.id) ?? photo.src,
            groupIndex,
          }));
        }),
      );

      if (cancelled) return;

      results.forEach((result, groupIndex) => {
        if (result.status === "rejected") {
          console.error(
            `Erro ao carregar fotos do grupo "${itemGroups[groupIndex]?.label}"`,
            result.reason,
          );
        }
      });

      setState({
        images: results.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        ),
        groups: itemGroups.map(({ label, deleteAction }) => ({
          label,
          deleteAction,
        })),
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [itemGroups]);

  return state;
}
