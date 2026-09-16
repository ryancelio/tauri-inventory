import {
  MercadoriaReport,
  UsuarioLogado,
} from "@tauri-inventory/types";
import { HTMLAttributes, Ref } from "react";
export const getMargem = (custo: number, venda: number) => {
  return `${(((venda - custo) / venda) * 100).toFixed(2)}%`;
};
// Função utilitária para formatar os valores como Moeda Brasileira
export const formatCurrency = (value: string) => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

type MercadoriaReportRowProps = HTMLAttributes<HTMLDivElement> & {
  mercadoria: MercadoriaReport;
  usuario: UsuarioLogado;
  ref: Ref<HTMLDivElement> | undefined;
  colLayout: any;
  index: number; // ← Recebendo o index exato do item na array original
};

export const MercadoriaReportRow = ({
  mercadoria,
  usuario,
  index,
  style,
  colLayout,
  ref,
  ...props
}: HTMLAttributes<HTMLDivElement> & MercadoriaReportRowProps) => {
  // Matemática fixa para definir a cor do fundo baseada no index, não no DOM
  const isEven = index % 2 === 0;

  return (
    <div
      {...props}
      ref={ref}
      style={style} // É aqui que o transform do react-virtualizer entra
      className={`flex min-h-11 w-full items-center border-b hover:bg-gray-100 ${
        isEven ? "bg-white" : "bg-blue-50"
      }`}
    >
      <div className={colLayout.descricao}>{mercadoria.descricao}</div>
      <div className={`${colLayout.fabricante} capitalize`}>
        {mercadoria.fabricante?.nome || "-"}
      </div>
      <div className={colLayout.est}>{mercadoria.estoque02}</div>
      <div className={colLayout.est}>{mercadoria.estoque03}</div>
      <div className={colLayout.est}>{mercadoria.estoque04}</div>

      {usuario.funcao !== "vendedor" && (
        <div className={colLayout.preco}>
          {formatCurrency(mercadoria.precoCusto)}
        </div>
      )}
      <div className={colLayout.preco}>
        {formatCurrency(mercadoria.precoVenda)}
      </div>

      {usuario.funcao !== "vendedor" && (
        <div className={colLayout.margem}>
          {getMargem(
            Number(mercadoria.precoCusto),
            Number(mercadoria.precoVenda),
          )}
        </div>
      )}
    </div>
  );
};

MercadoriaReportRow.displayName = "MercadoriaReportRow";
