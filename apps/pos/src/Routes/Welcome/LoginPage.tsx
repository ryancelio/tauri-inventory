import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import {
  AlertCircle,
  Bolt,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
  WifiOff,
} from "lucide-react";
import { loader } from "./LoginLayout";
import { AnimatePresence, motion } from "motion/react";
import ConfigModal from "../ConfigOptions/ConfigModal";

export default function LoginPage() {
  const fetcher = useFetcher();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [hasError, setHasError] = useState<boolean>(false);
  const [cfgModal, setCfgModal] = useState(false);

  const { isOfflineMode } = useLoaderData<typeof loader>();

  // Extrai mensagens de erro de múltiplos formatos possíveis do backend
  const getErrorMessage = (data: any): string => {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (data.message?.response) return data.message.response;
    if (data.message) return data.message;
    if (data.error) return data.error;
    return "Ocorreu um erro ao realizar o login. Tente novamente.";
  };

  const errorMessage = getErrorMessage(fetcher.data);
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data) {
      setHasError(true);
    }
  }, [fetcher.data]);

  return (
    <>
      <div className="relative flex size-full items-center justify-center bg-slate-50 p-4">
        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md rounded-2xl p-8 "
        >
          {/* Cabeçalho */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Acesso de Funcionário
            </h1>
            <p className="text-sm text-slate-500">
              Digite suas credenciais para continuar
            </p>

            {/* Badge do Modo Offline */}
            {isOfflineMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200"
              >
                <WifiOff className="size-3.5" />
                <span>Modo de Operação Offline</span>
              </motion.div>
            )}
          </div>

          {/* Form */}
          <fetcher.Form method="POST" className="space-y-4">
            <SecureInput
              inputId="usuario"
              inputName="usuario"
              label="Usuário"
              icon={User}
              inputValue={usuario}
              setInputValue={(val) => {
                setUsuario(val);
                setHasError(false);
              }}
              autoFocus
              hasError={hasError}
              disabled={isSubmitting}
            />

            <SecureInput
              inputId="senha"
              inputName="senha"
              label="Senha"
              inputType="password"
              icon={Lock}
              inputValue={senha}
              setInputValue={(val) => {
                setSenha(val);
                setHasError(false);
              }}
              hasError={hasError}
              disabled={isSubmitting}
            />

            {/* Banner de Erro Animado */}
            <AnimatePresence mode="wait">
              {hasError && errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                    <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
                    <span className="font-medium leading-relaxed">
                      {errorMessage}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>{isOfflineMode ? "Entrar Offline" : "Entrar"}</span>
              )}
            </button>
          </fetcher.Form>
        </motion.div>

        {/* Botão de Configurações */}
        <button
          type="button"
          onClick={() => setCfgModal(true)}
          title="Configurações do Sistema"
          className="absolute bottom-5 left-5 flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        >
          <Bolt className="size-5" />
        </button>
      </div>

      {/* Modal de Configuração */}
      <AnimatePresence>
        {cfgModal && <ConfigModal onClose={() => setCfgModal(false)} />}
      </AnimatePresence>
    </>
  );
}

// Interfaces e Componente de Input Reutilizável

export interface SecureInputProps {
  inputName: string;
  inputId: string;
  label?: string;
  inputType?: React.HTMLInputTypeAttribute;
  inputValue: string | number;
  setInputValue: (value: string) => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  icon?: React.ElementType;
}

function SecureInput({
  inputName,
  inputId,
  label,
  inputType = "text",
  inputValue,
  setInputValue,
  onBlur,
  autoFocus = false,
  hasError = false,
  disabled = false,
  icon: Icon,
}: SecureInputProps): React.ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = inputType === "password";
  const currentType = isPasswordType
    ? showPassword
      ? "text"
      : "password"
    : inputType;

  return (
    <div className="relative flex flex-col">
      <div className="relative flex items-center">
        {Icon && (
          <div className="pointer-events-none absolute left-3.5 text-slate-400">
            <Icon className="size-5" />
          </div>
        )}

        <input
          id={inputId}
          name={inputName}
          type={currentType}
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={onBlur}
          autoFocus={autoFocus}
          placeholder=" "
          aria-invalid={hasError}
          className={`w-full rounded-xl border bg-slate-50/50 py-3 text-slate-800 transition-all focus:bg-white focus:outline-none disabled:opacity-60 ${
            Icon ? "pl-11" : "pl-4"
          } ${isPasswordType ? "pr-11" : "pr-4"} ${
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          }`}
        />

        {/* Label Flutuante Melhorado */}
        <label
          htmlFor={inputId}
          className={`pointer-events-none absolute transition-all duration-150 ease-out ${
            Icon ? "left-11" : "left-4"
          } peer-focus:text-xs peer-focus:font-semibold peer-focus:-translate-y-3.5 peer-focus:text-blue-600 ${
            String(inputValue).length > 0
              ? "-translate-y-3.5 text-xs font-semibold text-slate-500"
              : "text-slate-400"
          } ${hasError ? "peer-focus:text-red-500" : ""}`}
        >
          {label || inputName}
        </label>

        {/* Toggle de Visibilidade de Senha */}
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}