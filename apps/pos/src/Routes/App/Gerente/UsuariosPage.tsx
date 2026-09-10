import {
  ActionFunctionArgs,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "react-router";
import { getUsuarios } from "../../../api/apiHelper";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import AddUsuarioModal from "./UsuariosModal";
import { IUsuario, UsuarioListing } from "@tauri-inventory/types";
import { getIsOfflineModeActive } from "../../../backend/backendHelper";
import { userContext } from "../../../context/contexts";
import { AnimatePresence } from "motion/react";
import UsersCard from "./UserCard";
import {
  createUsuarioAction,
  deleteUsuarioAction,
  updateUsuarioAction,
} from "../../Routers/Actions/UsuariosActions";

export const loader: LoaderFunction = async ({ context }) => {
  const usuarios = await getUsuarios();
  const usuarioLogado = context.get(userContext);
  const isOfflineMode = await getIsOfflineModeActive();

  return { usuarios, isOfflineMode, usuarioLogado };
};

export interface UsuarioPageLoaderData {
  usuarios: IUsuario[];
  isOfflineMode: boolean;
  usuarioLogado: UsuarioListing;
}
export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const method = request.method;
    const formData = await request.formData();

    let response = { response: "Resposta desconhecida." };

    switch (method) {
      case "POST":
        response = await createUsuarioAction(formData);
        break;
      case "PUT":
        response = await updateUsuarioAction(formData);
        const usuario = context.get(userContext);
        const id = Number(formData.get("id") as string);
        // console.log(`${id} : ${usuario?.id}`);
        if (id === usuario?.id) {
          return redirect("/");
        }
        break;
      case "DELETE":
        response = await deleteUsuarioAction(formData);
        break;
    }
    return { ok: true, response: response.response };
  } catch (e: any) {
    console.error(e);
    return {
      ok: false,
      response: e.message.response,
      errors: e?.errors,
    };
  }
}

export function Component() {
  const [addModal, setAddModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<UsuarioListing | null>(null);

  const [search, setSearch] = useState("");

  const { usuarios, usuarioLogado, isOfflineMode } =
    useLoaderData<UsuarioPageLoaderData>();

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(
      (user) =>
        user.nome.toLowerCase().includes(search.toLowerCase()) ||
        user.funcao.toLowerCase().includes(search.toLowerCase()) ||
        user.id.toString().includes(search),
    );
  }, [usuarios, search]);

  const loja02 = usuariosFiltrados.filter((user) => user.local === "02");
  const loja03 = usuariosFiltrados.filter((user) => user.local === "03");
  const loja04 = usuariosFiltrados.filter((user) => user.local === "04");

  return (
    <>
      <AnimatePresence>
        {addModal && (
          <AddUsuarioModal
            local={addModal}
            isNew
            onClose={() => setAddModal(null)}
          />
        )}
        {editModal && (
          <AddUsuarioModal
            local={editModal.local}
            onClose={() => setEditModal(null)}
            usuario={editModal}
          />
        )}
      </AnimatePresence>

      <div className="h-full w-full overflow-hidden bg-slate-50 p-3 md:p-5">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                  <Users size={24} />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-slate-800">
                    Usuários
                  </h1>

                  <p className="text-sm text-slate-500">
                    Gerencie os usuários e permissões das lojas
                  </p>
                </div>
              </div>

              {/* Busca */}
              <div className="relative w-full lg:w-85">
                <Search
                  size={18}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 transition-all outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-5 overflow-y-auto p-5 xl:grid-cols-3">
            <UsersCard
              usuario={usuarioLogado}
              users={loja02}
              title="Loja 02"
              local="02"
              onAdd={() => setAddModal("02")}
              isDisabled={
                isOfflineMode ||
                (usuarioLogado.funcao !== "admin" &&
                  usuarioLogado.local !== "02")
              }
              onDoubleClick={setEditModal}
            />

            <UsersCard
              usuario={usuarioLogado}
              users={loja03}
              title="Loja 03"
              local="03"
              onAdd={() => setAddModal("03")}
              isDisabled={
                isOfflineMode ||
                (usuarioLogado.funcao !== "admin" &&
                  usuarioLogado.local !== "03")
              }
              onDoubleClick={setEditModal}
            />

            <UsersCard
              usuario={usuarioLogado}
              users={loja04}
              title="Loja 04"
              local="04"
              onAdd={() => setAddModal("04")}
              isDisabled={
                isOfflineMode ||
                (usuarioLogado.funcao !== "admin" &&
                  usuarioLogado.local !== "03")
              }
              onDoubleClick={setEditModal}
            />
          </div>
        </div>
      </div>
    </>
  );
}
