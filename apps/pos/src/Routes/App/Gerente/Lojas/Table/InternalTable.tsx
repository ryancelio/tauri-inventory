import { useLoaderData } from "react-router";
import { loader } from "../LojasPage";
import { ILoja } from "@tauri-inventory/types";

export default function InternalTable({
  selectedLoja,
  setSelectedLoja,
}: {
  selectedLoja: ILoja | null;
  setSelectedLoja: (loja: ILoja | null) => void;
}) {
  const { lojas } = useLoaderData<typeof loader>();

  return (
    <table>
      <thead className="gap-2 border-b border-slate-100 ">
        <tr className="">
            <th className="border-r border-r-slate-100 last:border-none p-2 px-4">ID</th>
            <th className="border-r border-r-slate-100 last:border-none p-2 px-4 text-start">Nome</th>
        </tr>
      </thead>
      <tbody>
        {lojas.map((loja) => (
          <tr
            key={loja.id}
            className={`${selectedLoja?.id === loja.id ? "bg-blue-500" : "bg-white"} transition-colors duration-75 ease-out select-none`}
            onClick={() =>
              setSelectedLoja((prev: ILoja | null) => {
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
