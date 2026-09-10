import { UsuarioListing, UsuarioLogado } from "@tauri-inventory/types";
import { Store, UserRound, ShieldCheck, Users } from "lucide-react";
import CreateButton from "../Mercadorias/MercadoriaEdit/FormComponents/CreateButton";

export default function UsersCard({
  usuario,
  users,
  title,
  local,
  onAdd,
  isDisabled,
  onDoubleClick,
}: {
  usuario: UsuarioLogado;
  users: UsuarioListing[];
  title: string;
  local: string;
  onAdd: () => void;
  isDisabled?: boolean;
  onDoubleClick?: (user: UsuarioListing) => void;
}) {
  const handleDoubleClick = (user: UsuarioListing) => {
    if (!onDoubleClick || isDisabled) return;
    if (usuario.local === local || usuario.funcao === "admin") {
      onDoubleClick(user);
    }
  };
  return (
    <div className="flex min-h-105 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 bg-slate-50/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
              <Store size={20} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-800">
                {title}
              </h1>

              <p className="text-sm text-slate-500">
                {users.length} usuário{users.length !== 1 && "s"}
              </p>
            </div>
          </div>

          {/* <button
            disabled={isDisabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm transition-all not-disabled:hover:brightness-95 disabled:bg-blue-300"
            onClick={onAdd}
          >
            <Plus size={20} />
          </button> */}
          <CreateButton
            disabled={isDisabled || false}
            onClick={onAdd}
            className="size-9"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        {users.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div
                className="group p-4 transition-all hover:bg-slate-50"
                key={user.id}
                onDoubleClick={() => {
                  handleDoubleClick(user);
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <UserRound size={20} className="text-slate-600" />
                  </div>

                  {/* Dados */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-medium text-slate-800">
                        {user.nome}
                      </h2>

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                        #{user.id}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-slate-400" />

                      <p className="text-sm text-slate-500 capitalize">
                        {user.funcao}
                      </p>
                    </div>
                  </div>

                  {/* Loja */}
                  <div className="hidden h-9 items-center justify-center rounded-xl bg-slate-100 px-3 text-sm font-medium text-slate-700 sm:flex">
                    {local}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Users size={30} className="text-slate-400" />
              </div>

              <h2 className="text-lg font-semibold text-slate-700">
                Nenhum usuário encontrado
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Adicione usuários para esta loja.
              </p>

              <CreateButton
                disabled={isDisabled || false}
                onClick={onAdd}
                // className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-500 px-4 font-medium text-white transition-all not-disabled:hover:brightness-90 disabled:bg-blue-300"
                className="mt-5 inline-flex h-11"
                label="Adicionar Usuário"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
