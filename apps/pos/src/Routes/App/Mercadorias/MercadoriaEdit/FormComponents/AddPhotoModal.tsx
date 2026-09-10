import { useEffect, useRef, useState, useCallback } from "react";
import FullscreenModalWrapper from "../../../SharedComponents/FullscreenModal";
import { useRevalidator } from "react-router";
import { Loader2, PlusCircle, Save, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "../../../../../context/Toast/ToastContext";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readFile, stat } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";
import { ApiResponse, IMercadoria } from "@tauri-inventory/types";
import { convertFileSrc } from "@tauri-apps/api/core";
import CheckboxComponent from "./BASE-UI/Checkbox/Checkbox";
import SwitchComponent from "./BASE-UI/Switch/Switch";

interface FilePayload {
  path: string;
  preview: string;
}

export function SimpleAddPhotoModal({
  onClose,
  actionTarget,
  mercadoria,
}: {
  onClose: () => void;
  actionTarget: ({
    filePaths,
    mercadoria,
    changeAll,
  }: {
    filePaths: string[];
    mercadoria: IMercadoria;
    changeAll: boolean;
  }) => Promise<ApiResponse>;
  mercadoria: IMercadoria;
}) {
  const MAX_FILES = 20;
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const toaster = useToast();
  const revalidator = useRevalidator();

  const id = mercadoria.id;

  const [isSaving, setIsSaving] = useState(false);

  const [changeAll, setChangeAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FilePayload[]>([]);
  const filesRef = useRef(files);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, []);

  const handleAddFiles = useCallback(
    async (paths: string[] | null) => {
      if (!paths?.length) return;

      const existing = new Set(filesRef.current.map((f) => f.path));

      const newPaths = paths.filter((path) => !existing.has(path));

      if (newPaths.length === 0) return;
      if (newPaths.length + existing.size > MAX_FILES) {
        toaster.error({
          title: "Número de imagens acima do permitido.",
        });
        return;
      }

      const statResults = await Promise.all(
        newPaths.map(async (path) => {
          try {
            const { size } = await stat(path);
            return { path, ok: size <= MAX_FILE_SIZE_BYTES };
          } catch {
            return { path, ok: false, error: true };
          }
        }),
      );

      const filteredPaths = statResults.filter((r) => r.ok).map((r) => r.path);
      const foundBigger = statResults.filter((r) => !r.ok && !r.error).length;

      if (foundBigger > 0) {
        toaster.warning({
          title: "Tamanho inválido",
          message: `${foundBigger} Imagens tem tamanho inválido e foram removidas.`,
        });
      }

      const payload = await Promise.all(
        filteredPaths.map(async (path) => {
          return {
            path,
            preview: convertFileSrc(path),
          };
        }),
      );

      // const payload = filteredPaths.map((path) => {
      //   return
      // })

      setFiles((prev) => [...prev, ...payload]);
    },
    [filesRef],
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    async function registerListener() {
      unlisten = await getCurrentWebview().onDragDropEvent(async (event) => {
        switch (event.payload.type) {
          case "enter":
            setIsDragging(true);
            break;

          case "over":
            break;

          case "leave":
            setIsDragging(false);
            break;

          case "drop":
            setIsDragging(false);
            handleAddFiles(event.payload.paths);

            break;
        }
      });
    }

    registerListener();

    return () => {
      unlisten?.();
    };
  }, []);

  const removeFile = useCallback((file: FilePayload) => {
    // Limpa a memória apenas da imagem removida
    URL.revokeObjectURL(file.preview);
    setFiles((current) => current.filter((f) => f !== file));
  }, []);

  const upload = useCallback(async () => {
    try {
      setIsSaving(true);
      if (files.length === 0) return;

      const filePaths = files.map((file) => file.path);
      const response = await actionTarget({ filePaths, mercadoria, changeAll });
      toaster.toast({
        title: "Imagem enviada",
        message: response.response,
        type: "success",
      });
      revalidator.revalidate();
      onClose();
    } catch (err) {
      toaster.toast({
        title: "Falha ao enviar imagens",
        message: err instanceof Error ? err.message : "Erro desconhecido.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [files, id, toaster, revalidator, actionTarget, changeAll, mercadoria]);

  async function openImageDialog() {
    const files = await open({
      multiple: true,
      directory: false,
      filters: [
        { extensions: ["png", "jpeg", "jpg", "webp"], name: "Somente Imagens" },
      ],
    });

    handleAddFiles(files);
  }

  return (
    <FullscreenModalWrapper handleClose={onClose} closeButton>
      <div className="z-60 mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-xl bg-slate-50 p-4 pt-6">
        <div className="">
          <h1 className="text-xl font-bold">Adicionar foto</h1>
          <p className="pl-1 text-gray-700">{mercadoria.descricao}</p>
        </div>

        {/* Área de Drop/Clique para Upload */}
        <div
          onClick={openImageDialog}
          className={`group grid aspect-video cursor-pointer place-items-center rounded-xl border-2 border-dotted p-6 transition-all ${
            isDragging
              ? "scale-[1.02] border-blue-500 bg-blue-100"
              : "border-slate-400 bg-slate-100 hover:border-blue-500 hover:bg-blue-50"
          }`}
        >
          {/* pointer-events-none adicionado para o ícone/texto não bloquear o Drop */}
          <div className="pointer-events-none flex flex-col items-center gap-2 text-slate-500 transition-colors group-hover:text-blue-500">
            <PlusCircle
              size={36}
              className={isDragging ? "text-blue-500" : ""}
            />
            <span
              className={`text-sm font-medium ${isDragging ? "text-blue-500" : ""}`}
            >
              {isDragging
                ? "Solte as fotos aqui"
                : "Clique ou arraste fotos aqui"}
            </span>
          </div>
        </div>

        {/* Listagem de Imagens Selecionadas / Estado Vazio */}
        <div className="flex w-full flex-col gap-2">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Imagens selecionadas ({files.length})
          </span>

          {files.length > 0 ? (
            <ul className="flex h-28 gap-2 overflow-auto py-1">
              {files.map((image) => (
                <li
                  key={image.path}
                  title={"Imagem enviada"}
                  className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300 bg-slate-200"
                >
                  <img
                    src={image.preview}
                    draggable={false}
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => removeFile(image)}
                    className="absolute top-1 right-1 rounded-full bg-white/60 p-1 shadow transition hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <X size={16} className="text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-100/50 text-slate-400">
              <ImageIcon size={24} className="opacity-50" />
              <span className="text-sm">Nenhuma imagem selecionada</span>
            </div>
          )}
        </div>

        {/* Botão de Ação */}
        <div className="flex max-h-12 min-h-10 border-t border-slate-200 pt-3 pb-2">
          <div className="mr-auto flex h-10 items-center justify-center">
            <SwitchComponent
              checked={changeAll}
              onChange={setChangeAll}
              labelLeft="Alterar para atual"
              labelRight="Alterar todos"
            />
          </div>
          <button
            className="flex h-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all not-disabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={upload}
            disabled={isSaving || files.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Enviando...
              </>
            ) : (
              <>
                <Save size={18} />
                Enviar Fotos
              </>
            )}
          </button>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
