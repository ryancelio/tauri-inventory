import { GrupoCategorias, IGrupo } from "@tauri-inventory/types";
import AutoCompleteDropdown, { Item } from "./AutoCompleteDropdown";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import FormTextInput from "../../FormTextInput";
import { useToast } from "../../../../../../../context/Toast/ToastContext";

export default function GrupoCatDropdown({
  grupos,
  onChangeValue,
  defaultCat,
  defaultGrupo,
  classNames,
  textSize,
  form,
  required = false,
  disabled = false,
  creatable = false,
}: {
  grupos: IGrupo[];
  onChangeValue?: () => void;
  defaultGrupo?: IGrupo;
  defaultCat?: GrupoCategorias;
  classNames?: { wrapper?: string };
  textSize?: "small" | "large";
  form?: string;
  required?: boolean;
  disabled?: boolean;
  creatable?: boolean;
}) {
  const grupoItems = useMemo<Item[]>(() => {
    return grupos.map((grp) => ({ label: grp.nome, value: grp.id }));
  }, [grupos]);

  const defaultGrupoItem = () => {
    if (!defaultGrupo) return null;
    return grupoItems.find((item) => item.value === defaultGrupo.id) || null;
  };

  const [selectedGrupoItem, setSelectedGrupoItem] = useState<Item | null>(
    defaultGrupoItem,
  );

  const defaultCatItem = defaultCat
    ? { label: defaultCat.nome, value: defaultCat.id }
    : null;

  const [selectedCategoriaItem, setSelectedCategoriaItem] =
    useState<Item | null>(defaultCatItem);

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Not first render
    onChangeValue?.();
  }, [selectedCategoriaItem, selectedGrupoItem]);

  const categoriaItems = useMemo(() => {
    if (!selectedGrupoItem) return [];
    const grupoCat = grupos.find((grp) => grp.id === selectedGrupoItem?.value);
    if (!grupoCat) return [];
    return grupoCat.categorias.map((cat) => ({
      label: cat.nome,
      value: cat.id,
    }));
  }, [selectedGrupoItem, grupos]);

  const onGrupoValueChange = (val: Item | null) => {
    setSelectedGrupoItem(val);
    // If any upstream change is needed.
    // if (onChangeValue) onChangeValue();
    setSelectedCategoriaItem(null);
    // setTimeout(() => onChangeValue?.(), 0);
  };

  const onCategoriaValueChange = (val: Item | null) => {
    setSelectedCategoriaItem(val);
    // If any upstream change is needed.
    // if (onChangeValue) onChangeValue();
    // setTimeout(() => onChangeValue?.(), 0);
  };

  const creationFetcher = useFetcher();
  const toaster = useToast();

  const grupoInputRef = useRef<HTMLInputElement>(null);
  const categoriaInputRef = useRef<HTMLInputElement>(null);

  const handleCreateGrupo = () => {
    try {
      const nome = grupoInputRef.current?.value;
      if (!nome) return;

      creationFetcher.submit(
        { nome },
        { action: "/gerente/grupos", method: "POST" },
      );
    } catch (e) {
      toaster.toast({
        title: "Falha ao criar grupo",
        type: "error",
      });
    }
  };
  const handleCreateCategoria = () => {
    try {
      const nome = categoriaInputRef.current?.value;
      const grupoId = selectedGrupoItem?.value;
      if (!nome || !grupoId) return;

      creationFetcher.submit(
        { nome, grupoId },
        { action: "/gerente/categorias", method: "POST" },
      );
    } catch (e) {
      toaster.toast({
        title: "Falha ao criar categoria",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (creationFetcher.data) {
      toaster.toast({
        title: creationFetcher.data.ok ? "Sucesso" : "Falha",
        message: creationFetcher.data.response,
        type: creationFetcher.data.ok ? "success" : "error",
      });
    }
  }, [creationFetcher.data]);

  return (
    <div className={`flex flex-row gap-1 ${classNames?.wrapper}`}>
      <AutoCompleteDropdown
        required={required}
        form={form}
        items={grupoItems}
        selectedItem={selectedGrupoItem}
        setSelectedItem={onGrupoValueChange}
        // onValueChange={onGrupoValueChange}
        name="grupoId"
        label="Grupo"
        placeholder="Ex. Móveis"
        textSize={textSize}
        readOnly={disabled}
        creationFetcher={creationFetcher}
        createNew={creatable ? handleCreateGrupo : undefined}
        createForm={
          creatable
            ? ({ defaultValue }) => (
                <div>
                  <FormTextInput
                    defaultValue={defaultValue}
                    id=""
                    label="Nome do grupo"
                    placeholder="Nome..."
                    ref={grupoInputRef}
                  />
                </div>
              )
            : undefined
        }
      />
      <AutoCompleteDropdown
        required={required}
        form={form}
        items={categoriaItems}
        name="categoriaId"
        // onValueChange={onCategoriaValueChange}
        selectedItem={selectedCategoriaItem}
        setSelectedItem={onCategoriaValueChange}
        disabled={!selectedGrupoItem}
        readOnly={disabled}
        creationFetcher={creationFetcher}
        label="Categoria"
        placeholder={
          !selectedGrupoItem
            ? "Selecione o grupo"
            : categoriaItems.length > 0
              ? `Ex. ${categoriaItems[0].label}`
              : "Nenhuma categoria encontrada"
        }
        textSize={textSize}
        createNew={creatable ? handleCreateCategoria : undefined}
        createForm={
          creatable
            ? ({ defaultValue }) => (
                <div>
                  <FormTextInput
                    defaultValue={defaultValue}
                    id=""
                    label="Nome da categoria"
                    placeholder="Nome..."
                    ref={categoriaInputRef}
                  />
                </div>
              )
            : undefined
        }
      />
    </div>
  );
}
