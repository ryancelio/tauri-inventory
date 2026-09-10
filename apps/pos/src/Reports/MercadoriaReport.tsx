import {
  ApiListResponse,
  ICategoria,
  MercadoriaFilter,
  MercadoriaReportResponse,
  UsuarioLogado,
} from "@tauri-inventory/types";
import {
  DetailedHTMLProps,
  HTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getCategorias, getMercadoriaReport } from "../api/apiHelper";
import { useToast } from "../context/Toast/ToastContext";
import { motion } from "motion/react";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import autoTable, { RowInput } from "jspdf-autotable";
import { writeFile } from "@tauri-apps/plugin-fs";
import { message, save } from "@tauri-apps/plugin-dialog";
import { parseFiltrosParaTexto } from "./FilterTranslator";
import { useLoaderData } from "react-router";
import { MercPageLoaderData } from "../Routes/App/Mercadorias/MercadoriasTable/MercadoriaPage";
import { getPrinters, printPdf } from "../backend/backendHelper";
import { ChevronDown, Download, Loader2, Printer } from "lucide-react";
import SimpleSelect from "../Routes/App/Components/SimpleSelect";
import { Item } from "../Routes/App/Mercadorias/MercadoriaEdit/FormComponents/BASE-UI/AutoCompleteDropdown/AutoCompleteDropdown";
import FullscreenModalWrapper from "../Routes/App/SharedComponents/FullscreenModal";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  formatCurrency,
  getMargem,
  MercadoriaReportRow,
} from "./MercadoriaReportRow";

export function MercadoriaReport({
  filter,
  onClose,
}: {
  filter: MercadoriaFilter;
  onClose: () => void;
}) {
  const [mercadoriaList, setMercadoriaList] =
    useState<ApiListResponse<MercadoriaReportResponse> | null>(null);
  const [categorias, setCategorias] = useState<ICategoria[]>([]);
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(true);
  const { fabricantes, grupos, atributos, usuario } =
    useLoaderData<MercPageLoaderData>();

  const reportRef = useRef<HTMLDivElement>(null);
  const printerSelectorRef = useRef<HTMLSelectElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");

  const toaster = useToast();
  const focusRef = useRef(null);

  // console.log(filter);
  useEffect(() => {
    const getMercs = async () => {
      try {
        setLoading(true);
        const mercs = await getMercadoriaReport(filter);
        const categorias = await getCategorias();
        setMercadoriaList(mercs);
        setCategorias(categorias);
        setPrinters(await getPrinters());
      } catch (e: any) {
        console.error(e);
        toaster.toast({
          title: "Falha ao listar mercadorias",
          message: e.message || "Erro desconhecido",
        });
      } finally {
        setLoading(false);
      }
    };
    getMercs();
  }, [filter]);

  const mapFabricantes = useMemo(
    () =>
      fabricantes.reduce(
        (acc, fab) => {
          acc[fab.id] = fab.nome;
          return acc;
        },
        {} as Record<number, string>,
      ),
    [fabricantes],
  );
  const mapGrupos = useMemo(
    () =>
      grupos.reduce(
        (acc, grupo) => {
          acc[grupo.id] = grupo.nome;
          return acc;
        },
        {} as Record<number, string>,
      ),
    [grupos],
  );
  const mapAtributos = useMemo(
    () =>
      atributos.reduce(
        (acc, atributo) => {
          acc[atributo.id] = atributo.nome;
          return acc;
        },
        {} as Record<number, string>,
      ),
    [atributos],
  );

  const mapCategorias = useMemo(
    () =>
      categorias.reduce(
        (acc, categoria) => {
          acc[categoria.id] = categoria.nome;
          return acc;
        },
        {} as Record<number, string>,
      ),
    [categorias],
  );

  const handleDownload = async () => {
    try {
      const pdf = await generateReportPdf();
      if (!pdf) return;

      const path = await save({
        filters: [{ name: "Documento PDF", extensions: ["pdf"] }],
        title: "Salvar Relatório",
        canCreateDirectories: true,
        defaultPath: "Relatorio.pdf",
      });
      if (!path) return;

      await writeFile(path, pdf);
      toaster.toast({
        title: "Documento Salvo",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      toaster.toast({
        title: "Falha ao salvar",
        type: "error",
      });
    }
  };

  const handlePrint = async () => {
    if (!printerSelectorRef.current) {
      return;
    }
    try {
      const pdf = await generateReportPdf();
      if (!pdf) {
        throw new Error("Nenhuma mercadoria selecionada");
      }

      const printerName = printerSelectorRef.current.value;
      await printPdf(printerName, Array.from(pdf));

      toaster.toast({
        title: "Imprimir",
        message: "Relatorio Enviado à impressora!",
        type: "success",
      });
    } catch (e: any) {
      console.error(e);
      toaster.toast({
        title: "Falha Imrpimir",
        message: "Relatorio não foi impresso.",
        type: "error",
      });
      await message(e.toString(), { title: "Documento", kind: "error" });
    }
  };

  const generateReportPdf = async () => {
    if (!mercadoriaList) {
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.text("Relatório Mercadorias", 14, 15);
    // doc.setFont("times");
    doc.setFontSize(7);
    doc.setTextColor("#364153");
    doc.text(`Gerado em: ${hoje}`, pageWidth - 10, 10, { align: "right" });
    // console.log(doc.getFontList());

    // 2. Chamar a função passando os lookups
    const filtrosAplicados = parseFiltrosParaTexto(filter.filter, {
      fabricantes: mapFabricantes,
      categorias: mapCategorias,
      grupos: mapGrupos,
      atributos: mapAtributos,
    });
    let startY = 30;

    if (filtrosAplicados.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(50);
      doc.text("Filtros:", 14, startY);
      startY += 5; // Desce a posição Y para começar a desenhar as tags

      // --- NOVA LÓGICA DE TAGS INLINE ---
      let currentX = 14;
      let currentY = startY;

      // Configurações visuais das tags
      const tagHeight = 6;
      const tagPaddingX = 3;
      const marginX = 2; // Espaço horizontal entre as tags
      const marginY = 8; // Espaço vertical caso quebre a linha
      const rightMargin = 14; // Margem direita da página

      doc.setFontSize(8); // Fonte levemente menor para as tags

      filtrosAplicados.forEach((f) => {
        const textWidth = doc.getTextWidth(f);
        const tagWidth = textWidth + tagPaddingX * 2;

        // Verifica se a próxima tag vai ultrapassar a margem direita da página
        if (currentX + tagWidth > pageWidth - rightMargin) {
          currentX = 14; // Reseta o X para o começo da linha
          currentY += marginY; // Pula para a linha de baixo
        }

        // Desenha o fundo da tag com borda arredondada (estilo Tailwind cinza claro)
        doc.setFillColor(243, 244, 246); // Fundo cinza claro
        doc.setDrawColor(209, 213, 219); // Cor da borda
        // Parâmetros: X, Y, Largura, Altura, RaioX, RaioY, Estilo (F=Fill, D=Draw)
        doc.roundedRect(currentX, currentY, tagWidth, tagHeight, 1, 1, "FD");

        // Desenha o texto dentro da tag
        doc.setTextColor(55, 65, 81); // Cor do texto
        // O 'Y' do texto no jsPDF baseia-se na linha de base da fonte.
        // Somar 4.2 centraliza bem para um retângulo de altura 6.
        doc.text(f, currentX + tagPaddingX, currentY + 4.2);

        // Avança a posição X para a próxima tag
        currentX += tagWidth + marginX;
      });

      // Atualiza o startY final para a tabela não sobrepor as tags
      startY = currentY + tagHeight + 5;
    }

    interface tableTypes {
      header: RowInput[];
      data: RowInput[];
    }
    const table: tableTypes = {
      header:
        usuario.funcao !== "vendedor"
          ? [
              [
                "Descrição",
                "Fabricante",
                { content: "Est 02", styles: { halign: "center" } },
                { content: "Est 03", styles: { halign: "center" } },
                { content: "Est 04", styles: { halign: "center" } },
                { content: "Custo", styles: { halign: "center" } },
                { content: "Venda", styles: { halign: "center" } },
                { content: "Margem", styles: { halign: "center" } },
              ],
            ]
          : [
              [
                "Descrição",
                "Fabricante",
                { content: "Est 02", styles: { halign: "center" } },
                { content: "Est 03", styles: { halign: "center" } },
                { content: "Est 04", styles: { halign: "center" } },
                { content: "Venda", styles: { halign: "center" } },
              ],
            ],
      data:
        usuario.funcao !== "vendedor"
          ? mercadoriaList.data.map((merc) => [
              merc.descricao,
              merc.fabricante.nome[0]
                .toUpperCase()
                .concat(merc.fabricante.nome.slice(1)) || "-",
              {
                content: merc.estoque02 || "-",
                styles: { halign: merc.estoque02 === 0 ? "center" : "right" },
              },
              {
                content: merc.estoque03 || "-",
                styles: { halign: merc.estoque03 === 0 ? "center" : "right" },
              },
              {
                content: merc.estoque04 || "-",
                styles: { halign: merc.estoque04 === 0 ? "center" : "right" },
              },
              {
                content: formatCurrency(merc.precoCusto),
                styles: { halign: "right" },
              },
              {
                content: formatCurrency(merc.precoVenda),
                styles: { halign: "right" },
              },
              {
                content: getMargem(
                  Number(merc.precoCusto),
                  Number(merc.precoVenda),
                ),
                styles: { halign: "right" },
              },
            ])
          : mercadoriaList.data.map((merc) => [
              merc.descricao,
              merc.fabricante.nome[0]
                .toUpperCase()
                .concat(merc.fabricante.nome.slice(1)) || "-",
              { content: merc.estoque02, styles: { halign: "center" } },
              { content: merc.estoque03, styles: { halign: "center" } },
              { content: merc.estoque04, styles: { halign: "center" } },
              {
                content: formatCurrency(merc.precoVenda),
                styles: { halign: "right" },
              },
            ]),
    };

    doc.setTextColor("#000000");

    autoTable(doc, {
      startY: startY,
      head: table.header,
      body: table.data,
      theme: "striped",
      styles: { fontSize: 9, font: "helvetica" },
      headStyles: { fillColor: "#0000e0", valign: "middle" },
    });

    const pdfBytesBuffer = doc.output("arraybuffer");
    const pdfBufferArray = new Uint8Array(pdfBytesBuffer);

    return pdfBufferArray;
  };
  const printersItems: Item[] = printers.map((printer) => ({
    value: printer,
    label: printer,
  }));

  const virtualizer = useVirtualizer({
    count: mercadoriaList?.data.length ?? 0,
    estimateSize: () => 44,
    getScrollElement: () => parentRef.current,
    overscan: 5,
  });

  const colLayout = {
    descricao: "flex-1 min-w-[250px] p-3",
    fabricante: "w-36 p-3",
    est: "w-20 p-3 text-right",
    preco: "w-32 p-3 text-right",
    margem: "w-24 p-3 text-right",
  };

  return (
    <FullscreenModalWrapper
      handleClose={() => onClose()}
      focusRef={focusRef}
      cardWrapperClass="max-w-6xl!"
    >
      <div className="flex h-full max-h-[90vh] w-full flex-col rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex shrink-0 flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            Relatório de Mercadorias
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <SimpleSelect
              items={printersItems}
              selectRef={printerSelectorRef}
              disabled={isLoading}
              isLoading={isLoading}
              name="printer"
            />

            {/* Grupo de Ações (Imprimir / Baixar) */}
            <div className="flex h-10 shadow-sm">
              <button
                onClick={handlePrint}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-l-lg bg-cmblue px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer size={18} />
                <span>Imprimir</span>
              </button>

              {/* Separador translúcido para as cores não colidirem diretamente */}
              <div className="w-px bg-white/20"></div>

              <button
                onClick={handleDownload}
                ref={focusRef}
                className="flex items-center gap-2 rounded-r-lg bg-cmred px-4 py-2 text-sm font-medium text-white transition-all hover:brightness-110 active:brightness-90"
              >
                <Download size={18} />
                <span>Baixar</span>
              </button>
            </div>

            {/* Botão Fechar (Estilo Neutro/Outline) */}
            <button
              onClick={onClose}
              className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100"
            >
              Fechar
            </button>
          </div>
        </div>
        {/* Columns selector
        <div>

        </div> */}
        <div
          ref={parentRef}
          className="flex-1 scrollbar-thumb-blue-500 scrollbar-track-black/10 overflow-auto"
        >
          <div ref={reportRef} className="w-full bg-white font-serif">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-full animate-pulse rounded bg-gray-200"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-2 text-xs print:mb-6">
                  {parseFiltrosParaTexto(filter.filter, {
                    atributos: mapAtributos,
                    categorias: mapCategorias,
                    fabricantes: mapFabricantes,
                    grupos: mapGrupos,
                  }).map((filtro, index) => (
                    <p
                      key={index}
                      className="rounded bg-gray-100 px-2 py-1 capitalize print:bg-transparent print:p-0"
                    >
                      • {filtro}
                    </p>
                  ))}
                </div>

                <div className="w-full min-w-237.5 text-left text-sm text-gray-700">
                  {/* CABEÇALHO */}
                  <div className="sticky top-0 z-20 flex w-full bg-blue-600 font-semibold text-white shadow-[0_1px_0_0_#9ca3af]">
                    <div className={colLayout.descricao}>Descrição</div>
                    <div className={colLayout.fabricante}>Fabricante</div>
                    <div className={colLayout.est}>Est 02</div>
                    <div className={colLayout.est}>Est 03</div>
                    <div className={colLayout.est}>Est 04</div>
                    {usuario.funcao !== "vendedor" && (
                      <div className={colLayout.preco}>Preço Custo</div>
                    )}
                    <div className={colLayout.preco}>Preço Venda</div>
                    {usuario.funcao !== "vendedor" && (
                      <div className={colLayout.margem}>Margem</div>
                    )}
                  </div>

                  {/* CORPO DA LISTA VIRTUALIZADA */}
                  {mercadoriaList && mercadoriaList.data.length !== 0 ? (
                    <div
                      className="relative w-full"
                      style={{ height: `${virtualizer.getTotalSize()}px` }}
                    >
                      {virtualizer.getVirtualItems().map((virtualItem) => {
                        const merc = mercadoriaList.data[virtualItem.index];
                        return (
                          <MercadoriaReportRow
                            colLayout={colLayout}
                            data-index={virtualItem.index}
                            key={virtualItem.key}
                            index={virtualItem.index} // Passamos o index real para ancorar a cor!
                            ref={virtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                            mercadoria={merc}
                            usuario={usuario}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      Nenhuma mercadoria encontrada para o filtro selecionado.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </FullscreenModalWrapper>
  );
}
