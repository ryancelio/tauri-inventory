import { IGrupo, UsuarioLogado } from "@tauri-inventory/types";
import { LayoutGrid, ChevronRight, Check, X, Loader2, Ban } from "lucide-react";
import { GroupEditButton } from "./CategoriasPage";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useToast } from "../../../context/Toast/ToastContext";

export function GrupoTile({
  grp,
  onClick,
  isSelected,
  usuario,
  isOfflineMode,
  onEdit,
  isEditing,
  isNew,
  handleDrop,
  onClose,
}: {
  grp: IGrupo;
  onClick: () => void;
  isSelected: boolean;
  usuario: UsuarioLogado;
  isOfflineMode: boolean;
  onEdit: (grp: IGrupo | null) => void;
  isEditing: boolean;
  isNew?: boolean;
  handleDrop?: (e: React.DragEvent, grupo: IGrupo) => void;
  onClose: () => void;
}) {
  const fetcher = useFetcher();
  const toaster = useToast();

  useEffect(() => {
    if (!fetcher.data) return;

    toaster.toast({
      title: isNew ? "Criar Grupo" : "Editar Grupo",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });
    if (fetcher.data.ok) {
      onClose();
    }
  }, [fetcher.data]);

  return (
    <GrupoTileWrapper
      handleDrop={handleDrop}
      grp={grp}
      isSelected={isSelected}
      onClick={onClick}
    >
      <fetcher.Form
        action="/gerente/grupos"
        method={isNew ? "POST" : "PUT"}
        className="min-w-0 flex-1 transition-all"
      >
        <h2 className="truncate font-medium text-slate-800">
          {isEditing || isNew ? (
            <>
              <input type="hidden" value={grp.id} name="id" />
              <input
                onClick={(e) => e.stopPropagation()}
                defaultValue={grp.nome}
                autoFocus
                type="text"
                name="nome"
                className="h-1/2 border-b border-slate-200 outline-0 focus:border-blue-500 focus:ring-0"
              />
            </>
          ) : (
            <>{grp.nome}</>
          )}
        </h2>

        <div className="flex w-full justify-between text-sm text-slate-500">
          <p>
            {!isEditing || grp.categorias?.length
              ? `${grp.categorias.length || 0} categorias`
              : "Editando..."}
          </p>
          {isEditing && (
            <div
              className="flex h-1/2 items-center gap-1 pt-1"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <button
                type="submit"
                className="h-full w-1/2 rounded-lg p-1 text-green-500 hover:bg-green-100"
              >
                {fetcher.state === "idle" ? (
                  <Check size={25} />
                ) : (
                  <Loader2 className="animate-spin" />
                )}
              </button>
              <X
                size={22}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(null);
                }}
                className="h-full w-1/2 rounded-lg p-1 text-red-500 hover:bg-red-100"
              />
            </div>
          )}
        </div>
      </fetcher.Form>
      {usuario.funcao !== "vendedor" && !isOfflineMode && !isEditing && (
        <GroupEditButton
          size={18}
          disabled={isOfflineMode}
          action={() => onEdit(grp)}
        />
      )}
      <ChevronRight
        size={18}
        className={`shrink-0 transition-all ${
          isSelected
            ? "text-slate-700 opacity-100"
            : "text-slate-500 opacity-0 group-hover:opacity-100"
        }`}
      />
    </GrupoTileWrapper>
  );
}

export function GrupoTileWrapper({
  children,
  grp,
  onClick,
  isSelected,
  handleDrop,
}: PropsWithChildren<{
  grp?: IGrupo;
  onClick: () => void;
  isSelected: boolean;
  handleDrop?: (e: React.DragEvent, grupo: IGrupo) => void;
}>) {
  const dragCounter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // 2. Função para quando o item arrastado entra na área
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (grp && handleDrop) {
      setIsDragOver(true);
    }
  };

  // 3. Função para quando o item arrastado sai da área
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    // A checagem de 'contains' previne que o evento dispare acidentalmente
    // quando o mouse passa por cima dos elementos "filhos" dentro da div.
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  // 4. Função atualizada de drop para limpar o estado visual
  const onDropHandler = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false); // Remove o highlight ao soltar
    if (grp && handleDrop) {
      handleDrop(e, grp);
    }
  };
  // 5. Lógica condicional de classes do Tailwind
  let wrapperClasses = isSelected
    ? "border-slate-300 bg-white shadow-sm"
    : "border-transparent hover:border-slate-200 hover:bg-white/80";

  // Sobrescreve as classes se o drag estiver por cima
  if (isDragOver) {
    wrapperClasses = isSelected
      ? "border-transparent bg-red-50/80 shadow-sm ring-2 ring-red-200"
      : "border-blue-500 border-dashed bg-blue-50 shadow-md ring-2 ring-blue-200";
  }

  return (
    <div
      key={grp?.id || Date.now()}
      onClick={onClick}
      onDragOver={grp && handleDrop ? handleDragOver : undefined}
      onDrop={grp && handleDrop ? onDropHandler : undefined}
      onDragEnter={grp && handleDrop ? handleDragEnter : undefined}
      onDragLeave={grp && handleDrop ? handleDragLeave : undefined}
      className={`group mb-2 w-full cursor-pointer rounded-xl border p-4 text-left transition-all select-none ${wrapperClasses}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`rounded-lg p-2 transition-all duration-100 ${
            isSelected
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600"
          } ${isDragOver && isSelected && "bg-red-400!"}`}
        >
          {isSelected && isDragOver ? (
            <Ban size={18} className="text-black opacity-100" />
          ) : (
            <LayoutGrid size={18} />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
