import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Lock, Tag, Trash2, User } from "lucide-react";
import { useLoaderData, useFetcher } from "react-router";
import { UsuarioListing } from "../../../../../../packages/types/database/Usuario";
import { useToast } from "../../../context/Toast/ToastContext";
import UISelect from "../Components/BASE-UI/Select";
import FullscreenModalWrapper from "../SharedComponents/FullscreenModal";
import { UsuarioPageLoaderData } from "./UsuariosPage";
import { confirm } from "@tauri-apps/plugin-dialog";
import { ActionResponse } from "../../Routers/routes";
import { AnimatePresence, motion } from "motion/react";

type UserFormState = {
  nome: string;
  usuario: string;
  funcao: string;
  senha: string;
  confirmarSenha: string;
};

export interface UsuarioModalErrors {
  nome?: string;
  usuario?: string;
  novaSenha?: string;
  funcao?: string;
}

const EMPTY_FORM_STATE: UserFormState = {
  nome: "",
  usuario: "",
  funcao: "",
  senha: "",
  confirmarSenha: "",
};

export default function AddUsuarioModal({
  local,
  onClose,
  usuario,
  isNew,
}: {
  local?: string;
  onClose: () => void;
  usuario?: UsuarioListing;
  isNew?: boolean;
}) {
  const [isAlterarSenha, setAlterarSenha] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { usuarioLogado } = useLoaderData<UsuarioPageLoaderData>();

  const fetcher = useFetcher<ActionResponse<UsuarioModalErrors>>();
  const isSubmitting = fetcher.state === "submitting";

  const toaster = useToast();
  const errors = fetcher.data?.errors;

  const formRef = useRef<HTMLFormElement>(null);

  /*
   * The initial state is kept in a ref because it should not change
   * while the user is editing the form.
   */
  const initialStateRef = useRef<UserFormState>({
    nome: usuario?.nome ?? "",
    usuario: usuario?.usuario ?? "",
    funcao: usuario?.funcao ?? "",
    senha: "",
    confirmarSenha: "",
  });

  /**
   * Extract only the values that are relevant for determining
   * whether the user changed anything.
   */
  const getFormState = (): UserFormState => {
    const form = formRef.current;

    if (!form) {
      return EMPTY_FORM_STATE;
    }

    const formData = new FormData(form);

    return {
      nome: String(formData.get("nome") ?? ""),
      usuario: String(formData.get("usuario") ?? ""),
      funcao: String(formData.get("funcao") ?? ""),
      senha: String(formData.get("senha") ?? ""),
      confirmarSenha: String(formData.get("confirmarSenha") ?? ""),
    };
  };

  const checkDirty = () => {
    const currentState = getFormState();
    const initialState = initialStateRef.current;

    const dirty =
      currentState.nome !== initialState.nome ||
      currentState.usuario !== initialState.usuario ||
      currentState.funcao !== initialState.funcao ||
      currentState.senha !== initialState.senha ||
      currentState.confirmarSenha !== initialState.confirmarSenha;

    setIsDirty(dirty);
  };
  useEffect(() => {
    checkDirty();
  }, [isAlterarSenha, checkDirty]);

  /**
   * Don't allow the modal to close while there are unsaved changes
   * without asking the user first.
   */
  const handleClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }

    confirm("Existem alterações não salvas. Deseja realmente sair?").then(
      (confirmed) => {
        if (confirmed) onClose();
      },
    );
  };

  useEffect(() => {
    if (!fetcher.data) return;

    toaster.toast({
      title: isNew ? "Criar Usuário" : "Editar Usuário",
      message: fetcher.data.response,
      type: fetcher.data.ok ? "success" : "error",
    });

    if (fetcher.data.ok) {
      // Submission succeeded, so there are no longer unsaved changes.
      setIsDirty(false);
      onClose();
    }
  }, [fetcher.data, isNew, onClose, toaster]);

  const handleDelete = async () => {
    const confirmed = await confirm(
      `Você tem certeza que deseja deletar o usuario ${usuario?.nome}?`,
      { title: "Deletar Usuário." },
    );
    if (!confirmed) return;
    await fetcher.submit(
      { id: usuario?.id ?? null },
      { action: "/gerente/usuarios", method: "DELETE" },
    );
  };

  return (
    <FullscreenModalWrapper handleClose={handleClose}>
      <div className="px-5 pt-5 pb-3">
        {!isNew && (
          <button
            type="button"
            onClick={() => handleDelete()}
            className="absolute top-5 right-5 size-fit rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-200"
          >
            <Trash2 className="w-full" />
          </button>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isNew ? "Adicionar" : "Editar"} Usuário
          </h2>

          {local && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-500">
              Loja selecionada:
              <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-blue-700">
                {local}
              </span>
            </p>
          )}
        </div>

        <fetcher.Form
          ref={formRef}
          action="/gerente/usuarios"
          method={isNew ? "POST" : "PUT"}
          onChange={checkDirty}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="local" value={local || usuario?.local} />

          <input type="hidden" value={usuario?.id} name="id" />

          <motion.div
            key={errors?.nome ? fetcher.data?.errors?.nome : undefined}
            initial={errors?.nome ? { x: 0 } : false}
            animate={errors?.nome ? { x: [0, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
          >
            <label
              htmlFor="nome"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Nome
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={18} />
              </div>

              <input
                type="text"
                id="nome"
                name="nome"
                required
                defaultValue={usuario?.nome}
                placeholder="Ex: João da Silva"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
            <FieldError message={errors?.nome} />
          </motion.div>

          <div>
            <label
              htmlFor="usuario"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Usuário
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Tag size={18} />
              </div>

              <input
                type="text"
                id="usuario"
                name="usuario"
                required
                defaultValue={usuario?.usuario}
                placeholder="Ex: joao.silva"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
              />
            </div>
          </div>

          {!isNew ? (
            <div
              className={`flex h-fit flex-col gap-1 overflow-hidden rounded-lg border-2 bg-gray-50 transition-all ease-out ${
                isAlterarSenha
                  ? "max-h-64 border-blue-500 shadow-sm shadow-blue-100"
                  : "max-h-12 border-gray-200"
              }`}
            >
              <div
                className="flex h-12 shrink-0 cursor-pointer items-center gap-1 bg-gray-50 p-2 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setAlterarSenha((value) => !value);
                }}
              >
                <div className="w-fit">Alterar Senha</div>

                <ChevronDown
                  className={`ml-auto text-gray-400 transition-all ease-out ${
                    isAlterarSenha && "rotate-180"
                  }`}
                />
              </div>

              <div
                className={`p-2 transition-all ${
                  isAlterarSenha ? "visible" : "invisible"
                }`}
              >
                <PasswordInput
                  isAlterarSenha={isAlterarSenha}
                  error={errors?.novaSenha}
                />
              </div>
            </div>
          ) : (
            <PasswordInput isNew isAlterarSenha error={errors?.novaSenha} />
          )}

          <div>
            <label
              className="mb-1.5 block text-sm font-semibold text-slate-700"
              htmlFor="funcao"
            >
              Função
            </label>

            <UISelect
              defaultValue={usuario?.funcao && {value: usuario.funcao, label: usuario.funcao}}
              className="h-12 text-[17px]"
              name="funcao"
              items={[
                {
                  label: "Vendedor",
                  value: "vendedor",
                },
                {
                  label: "Gerente",
                  value: "gerente",
                },
                ...(usuarioLogado.funcao === "admin"
                  ? [
                      {
                        label: "Admin",
                        value: "admin",
                      },
                    ]
                  : []),
              ]}
            />
          </div>

          <div className="mt-2 flex flex-col gap-1">
            {usuario?.id === usuarioLogado.id && (
              <div className="w-full items-center pt-2 text-center text-sm font-semibold text-red-700">
                Alterar o próprio usuário desconectará você.
              </div>
            )}

            <div className="flex gap-1">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-all duration-200 not-disabled:hover:bg-blue-700 not-disabled:hover:shadow-md not-disabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:text-gray-200 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {isNew ? "Criando..." : "Editando..."}
                  </>
                ) : isNew ? (
                  "Criar Usuário"
                ) : (
                  "Editar Usuário"
                )}
              </button>
            </div>
          </div>
        </fetcher.Form>
      </div>
    </FullscreenModalWrapper>
  );
}

function PasswordInput({
  isNew = false,
  isAlterarSenha,
  error,
}: {
  isNew?: boolean;
  isAlterarSenha?: boolean;
  error?: string;
}) {
  // const [internalError, setInternalError] = useState(error);
  // const onInputChange = useCallback(() => {
  //   if (internalError !== "" || internalError) {
  //     setInternalError("");
  //   }
  // }, []);
  return (
    <motion.div
      key={error}
      initial={error ? { x: 0 } : false}
      animate={error ? { x: [0, -6, 6, -4, 4, 0] } : {}}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-3"
    >
      <div>
        <label
          htmlFor="senha"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          {isNew ? "Senha" : "Nova Senha"}
        </label>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock size={18} />
          </div>

          <input
            type="password"
            id="senha"
            // onChange={onInputChange}
            name={isAlterarSenha ? "senha" : undefined}
            required={isNew || isAlterarSenha}
            placeholder="••••••••"
            className={`w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none ${
              isAlterarSenha ? "bg-white" : "bg-slate-50"
            }`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmarSenha"
          className="mb-1.5 block text-sm font-semibold text-slate-700"
        >
          {isNew ? "Confirmar Senha" : "Confirmar Nova Senha"}
        </label>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Lock size={18} />
          </div>

          <input
            type="password"
            id="confirmarSenha"
            name={isAlterarSenha ? "confirmarSenha" : undefined}
            required={isNew || isAlterarSenha}
            // onChange={onInputChange}
            placeholder="••••••••"
            className={`w-full rounded-xl border border-slate-200 py-2.5 pr-4 pl-10 text-slate-800 transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none ${
              isAlterarSenha ? "bg-white" : "bg-slate-50"
            }`}
          />
        </div>
        <FieldError message={error} />
      </div>
    </motion.div>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="overflow-hidden text-sm text-red-600"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
