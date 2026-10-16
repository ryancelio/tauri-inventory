import { AlertCircle, Loader2, Plus, Store, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";

import FullscreenModalWrapper from "../../SharedComponents/FullscreenModal";

type CreateLojaResponse = {
  ok?: boolean;
  error?: string;
};

export default function CreateLojaModal({ onClose }: { onClose: () => void }) {
  const fetcher = useFetcher<CreateLojaResponse>();
  const isLoading = fetcher.state !== "idle";

  const [cnpj, setCnpj] = useState("");
  const [errorDismissed, setErrorDismissed] = useState(false);

  const error =
    fetcher.state === "idle" && !errorDismissed
      ? fetcher.data?.error
      : undefined;

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      onClose();
    }
  }, [fetcher.state, fetcher.data, onClose]);

  return (
    <FullscreenModalWrapper
      cardWrapperClass="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      handleClose={onClose}
    >
      <div className="w-full">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Store className="size-5" strokeWidth={1.8} />
            </div>

            <div>
              <h1
                id="create-loja-title"
                className="text-lg font-semibold tracking-tight text-slate-900"
              >
                Nova loja
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Informe os dados para realizar o cadastro.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* Formulário */}
        <fetcher.Form
          method="POST"
          aria-labelledby="create-loja-title"
          onSubmit={() => setErrorDismissed(false)}
          className="flex flex-col gap-5 px-6 py-6"
        >
          {/* Nome da loja */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nome"
              className="text-sm font-medium text-slate-700"
            >
              Nome da loja
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            </label>

            <input
              type="text"
              name="nome"
              id="nome"
              required
              minLength={2}
              maxLength={120}
              autoComplete="organization"
              placeholder="Ex.: Loja Centro"
              onChange={() => setErrorDismissed(true)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 transition duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {/* CNPJ */}
          <CnpjInput
            value={cnpj}
            onChange={(value) => {
              setCnpj(value);
              setErrorDismissed(true);
            }}
          />

          {/* Erro da requisição */}
          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                key={error}
                role="alert"
                aria-live="polite"
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="min-w-0 wrap-break-word">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ações */}
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-11 rounded-xl px-4 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={isLoading ? undefined : { scale: 1.01 }}
              whileTap={isLoading ? undefined : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-medium text-white shadow-sm shadow-blue-600/15 transition-colors duration-200 hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-500/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>Criando loja...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Criar loja</span>
                </>
              )}
            </motion.button>
          </div>
        </fetcher.Form>
      </div>
    </FullscreenModalWrapper>
  );
}

type CnpjInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 14);

  let formatted = digits;

  if (digits.length > 2) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }

  if (digits.length > 5) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }

  if (digits.length > 8) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }

  if (digits.length > 12) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  return formatted;
}

function CnpjInput({ value, onChange }: CnpjInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="cnpj" className="text-sm font-medium text-slate-700">
        CNPJ
        <span className="ml-1 text-red-500" aria-hidden="true">
          *
        </span>
      </label>

      <input
        type="text"
        name="CNPJ"
        id="cnpj"
        value={value}
        onChange={(event) => onChange(formatCnpj(event.target.value))}
        placeholder="00.000.000/0000-00"
        inputMode="numeric"
        autoComplete="off"
        maxLength={18}
        required
        pattern="[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}"
        title="Digite o CNPJ completo no formato 00.000.000/0000-00."
        aria-describedby="cnpj-hint"
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 tabular-nums transition duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      />

      <p id="cnpj-hint" className="text-xs text-slate-400">
        Digite os 14 dígitos do CNPJ da empresa.
      </p>
    </div>
  );
}
