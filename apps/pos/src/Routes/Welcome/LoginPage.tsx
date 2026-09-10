import { useEffect, useState } from "react";
import { apiLogin } from "../../api/apiHelper";
import {
  ActionFunction,
  Form,
  Link,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
} from "react-router";
import { ApiStatusCheck } from "../../context/contexts";
import { Bolt, Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import ConfigModal from "../ConfigOptions/ConfigModal";

export default function LoginPage() {
  const fetcher = useFetcher();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<boolean>(false);
  const [cfgModal, setCfgModal] = useState(false);

  const { apiStatus, isOfflineMode } = useLoaderData<{
    apiStatus: ApiStatusCheck;
    isOfflineMode: boolean;
  }>();

  useEffect(() => {
    setError(Boolean(fetcher.data));
  }, [fetcher.data]);

  return (
    <>
      <div className="grid h-full w-full place-items-center">
        <div className="flex flex-col gap-4">
          <div className="grid h-12 w-full place-items-center">
            <h1 className="text-2xl font-semibold text-cmblue text-shadow-md">
              Entrar
            </h1>
          </div>
          <fetcher.Form method="POST" className="flex flex-col gap-4">
            <SecureInput
              inputName="usuario"
              inputId="usuario"
              inputValue={usuario}
              setInputValue={setUsuario}
              autoFocus
              error={{ data: fetcher.data, error: error }}
              setError={setError}
            />
            <SecureInput
              inputId="senha"
              inputName="senha"
              inputType="password"
              inputValue={senha}
              setInputValue={setSenha}
              error={{ data: fetcher.data, error: error }}
              setError={setError}
            />
            <p
              className={`h-4 w-full text-center text-cmred transition-all ease-in ${error ? "opacity-100" : "opacity-0"}`}
            >
              {(fetcher.data?.message &&
                error &&
                fetcher.data.message.response) ||
                ""}
            </p>
            <div className="flex w-full justify-center pt-4">
              <button
                type="submit"
                className="cursor-pointer rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white hover:brightness-90"
                disabled={fetcher.state !== "idle"}
              >
                <div className="flex items-center">
                  {fetcher.state !== "idle" && (
                    <Loader2 className="animate-spin" />
                  )}
                  {isOfflineMode ? "Entrar Offline" : "Entrar"}
                </div>
              </button>
            </div>
          </fetcher.Form>
        </div>
        {/* <button
          type="button"
          onClick={() => setCfgModal(true)}
          className="absolute bottom-4 left-4"
        >
          <Bolt />
        </button> */}
      </div>
      {/* <AnimatePresence>
        {cfgModal && <ConfigModal onClose={() => setCfgModal(false)} />}
      </AnimatePresence> */}
    </>
  );
}

export interface SecureInputProps {
  inputName: string;
  inputId?: string;
  inputType?: React.HTMLInputTypeAttribute;
  inputValue: string | number;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  onBlur?: () => void;
  autoFocus?: boolean;
  error: { data: string; error: boolean };
  setError: React.Dispatch<React.SetStateAction<any>>;
}

function SecureInput({
  inputName,
  inputId,
  inputType = "text",
  inputValue,
  setInputValue,
  onBlur,
  autoFocus = false,
  error,
  setError,
}: SecureInputProps): React.ReactElement {
  return (
    <div className="relative mt-6 flex flex-col">
      <input
        id={inputId}
        name={inputId}
        type={inputType}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setError(false);
        }}
        onBlur={onBlur}
        autoFocus={autoFocus}
        className={`peer rounded-lg border-2 bg-transparent p-1 text-xl text-neutral-700 transition-all ease-in focus:border-gray-400 focus:outline-none ${
          error.error ? "border-red-500/70" : "border-gray-300/70"
        }`}
      />
      <label
        htmlFor={inputId}
        className={`pointer-events-none absolute transition-all duration-200 ${
          String(inputValue).length > 0
            ? "-top-6 left-0 text-sm text-gray-600"
            : "top-1.5 left-2 text-xl text-gray-400 peer-focus:-top-6 peer-focus:left-0 peer-focus:text-sm peer-focus:text-gray-600"
        }`}
      >
        {inputName}
      </label>
    </div>
  );
}
