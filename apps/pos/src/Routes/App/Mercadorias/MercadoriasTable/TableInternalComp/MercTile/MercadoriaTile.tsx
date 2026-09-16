import {
  getDescricaoCompleta,
  getEstoqueTotal,
  IMercadoria,
  UsuarioLogado,
} from "@tauri-inventory/types";
import { useState } from "react";
import MercExtraInfo from "./MercExtraInfo";
import { Link, useSearchParams } from "react-router";
import { Pencil, ChevronDown, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // <-- Import adicionado

export default function MercadoriaTile({
  mercadoria,
  usuario,
}: {
  mercadoria: IMercadoria;
  usuario: UsuarioLogado;
}) {
  const [expanded, setExpanded] = useState(false);
  const estoqueTotal = getEstoqueTotal(mercadoria);
  // const { atributos } = useLoaderData<typeof loader>();

  const [_, setSearchParams] = useSearchParams();

  return (
    <div className="group flex shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md">
      {/* Header Row */}
      <div
        className="relative z-10 flex cursor-pointer flex-col gap-2 bg-white p-4 select-none lg:grid lg:grid-cols-12 lg:items-center lg:gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Mobile ID/Key & Toggle */}
        <div className="mb-2 flex w-full items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-100 p-2 text-gray-500">
              <Package size={18} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800">
                ID: {mercadoria.id}
              </span>
              <span
                className="cursor-pointer text-xs font-medium text-gray-50"
              >
                Key: #{mercadoria.key}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              onClick={(e) => e.stopPropagation()}
              to={`./${mercadoria.id}`}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            >
              <Pencil size={18} />
            </Link>
            <div className={`p-1 transition-transform duration-300`}>
              <ChevronDown
                size={20}
                className={`text-gray-400 ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>

        {/* Desktop ID/Key */}
        <div className="hidden flex-col items-center justify-center lg:col-span-1 lg:flex">
          <span className="w-full rounded-md bg-gray-100 px-2 py-0.5 text-center text-sm font-bold text-gray-700">
            {mercadoria.id}
          </span>
          <span className="mt-1 text-[11px] font-semibold tracking-wider text-gray-400 uppercase hover:text-blue-500 cursor-pointer"
          onClick={(e) =>
                  setSearchParams((searchParams) =>{
                    e.stopPropagation();
                    searchParams.set("key", mercadoria.key.toString())
                    return searchParams
                  }
                  )
                }
          >
            #{mercadoria.key}
          </span>
        </div>

        {/* Descrição */}
        <div className="flex flex-col justify-center lg:col-span-5">
          <span className="text-sm leading-snug font-semibold text-gray-800 capitalize lg:text-base">
            {getDescricaoCompleta(mercadoria)}
          </span>
        </div>

        {/* Fabricante */}
        <div className="flex items-center justify-between lg:col-span-2 lg:justify-start">
          <span className="text-xs font-semibold text-gray-400 uppercase lg:hidden">
            Fabricante
          </span>
          <span className="truncate text-sm font-medium text-gray-600 capitalize">
            {mercadoria.fabricante?.nome || "-"}
          </span>
        </div>

        {/* Estoque */}
        <div className="flex items-center justify-between lg:col-span-1 lg:justify-center">
          <span className="text-xs font-semibold text-gray-400 uppercase lg:hidden">
            Estoque
          </span>
          <span
            className={`flex min-w-12 items-center justify-center rounded-md px-2.5 py-1 text-sm font-bold ${
              estoqueTotal > 0
                ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {estoqueTotal}
          </span>
        </div>

        {/* Preço */}
        <div className="flex items-center justify-between lg:col-span-2 lg:justify-end">
          <span className="text-xs font-semibold text-gray-400 uppercase lg:hidden">
            Preço
          </span>
          <span className="text-sm font-bold text-gray-800 lg:text-base">
            R${" "}
            {Number(mercadoria.precoVenda).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center justify-center gap-1 lg:col-span-1 lg:flex">
          {usuario.funcao !== "vendedor" && (
            <Link
              onClick={(e) => e.stopPropagation()}
              to={`./${mercadoria.id}`}
              className="rounded-lg p-2 text-gray-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600 focus:opacity-100"
              title="Editar"
            >
              <Pencil />
            </Link>
          )}
          <div
            className={`rounded-lg p-1.5 text-gray-400 transition-all duration-300 group-hover:bg-gray-100 ${expanded ? "rotate-180 bg-gray-100" : ""}`}
          >
            <ChevronDown size={20} />
          </div>
        </div>
      </div>

      {/* Expandable Content com Framer Motion */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-gray-50/50 p-2 sm:p-4">
              <MercExtraInfo mercadoria={mercadoria} isExpanded={expanded} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
