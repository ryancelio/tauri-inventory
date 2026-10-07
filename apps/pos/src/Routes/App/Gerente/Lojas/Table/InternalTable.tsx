import { useLoaderData } from "react-router";
import { loader } from "../LojasPage";
import { ILoja } from "@tauri-inventory/types";
import { Dispatch, SetStateAction } from "react";

export default function InternalTable({
  selectedLoja,
  setSelectedLoja,
}: {
  selectedLoja: ILoja | null;
setSelectedLoja: Dispatch<SetStateAction<ILoja | null>>;
}) {
  const { lojas } = useLoaderData<typeof loader>();

  return (
    <table className="w-full">
      <thead className="gap-2 border-b border-slate-100 ">
        <tr className="">
            <th className="border-r border-r-slate-100 last:border-none p-2 px-4">ID</th>
            <th className="border-r border-r-slate-100 last:border-none p-2 px-4 text-start">Nome</th>
            <th className="border-r border-r-slate-100 last:border-none p-2 px-4">CNPJ</th>
        </tr>
      </thead>
      <tbody>
        {lojas.map((loja) => (
          <tr
            key={loja.id}
            className={`${selectedLoja?.id === loja.id ? "bg-blue-500" : "bg-white"} transition-colors duration-75 ease-out select-none`}
            onClick={() =>
              setSelectedLoja((prev) => {
                if (!prev) return loja;
                if (loja.id === prev.id) {
                  return null;
                } else {
                  return loja;
                }
              })
            }
          >
            <td className="text-center">{loja.id}</td>
            <td className="text-start px-4">{loja.nome}</td>
            <td className="text-center px-2">{loja.CNPJ}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
