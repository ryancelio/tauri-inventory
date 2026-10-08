import { Form, useFetcher, useLoaderData, useSubmit } from "react-router";
import { loader } from "../LojasPage";
import { ILoja } from "@tauri-inventory/types";
import { Dispatch, SetStateAction, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function InternalTable({
  selectedLoja,
  setSelectedLoja,
}: {
  selectedLoja: ILoja | null;
  setSelectedLoja: (loja: ILoja | null) => void;
}) {
  const { lojas } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const debounce = useDebouncedCallback((value) => {
    submit(value)
  },150)


  return (
    <div className="flex flex-col gap-3">
      <search>
        <Form method="GET" onChange={(e) => debounce(e.currentTarget)}>
          <label htmlFor="nome">Nome</label>
          <input type="search" name="nome" />
          <button type="submit">Pesquisar</button>
        </Form>
      </search>

      <table className="w-full">
        <thead className="gap-2 border-b border-slate-100">
          <tr className="">
            <th className="border-r border-r-slate-100 p-2 px-4 last:border-none">
              ID
            </th>
            <th className="border-r border-r-slate-100 p-2 px-4 text-start last:border-none">
              Nome
            </th>
            <th className="border-r border-r-slate-100 p-2 px-4 last:border-none">
              CNPJ
            </th>
          </tr>
        </thead>
        <tbody>
          {lojas.map((loja) => (
            <tr
              key={loja.id}
              className={`${selectedLoja?.id === loja.id ? "bg-blue-500 text-white" : "bg-white"} transition-colors duration-75 ease-out select-none`}
              onClick={() => {
                let tempLoja;
                if (!selectedLoja) tempLoja = loja;
                if (selectedLoja?.id === loja.id) {
                  tempLoja = null;
                } else {
                  tempLoja = loja;
                }
                setSelectedLoja(tempLoja);
              }}
            >
              <td className="text-center">{loja.id}</td>
              <td className="px-4 text-start">{loja.nome}</td>
              <td className="px-2 text-center">{loja.CNPJ}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
