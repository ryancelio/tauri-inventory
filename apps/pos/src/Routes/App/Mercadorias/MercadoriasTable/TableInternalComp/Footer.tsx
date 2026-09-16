import { useSearchParams } from "react-router";
import PageSelector from "../../MercadoriaEdit/FormComponents/PageSelector";
import { ApiListResponse, IMercadoria } from "@tauri-inventory/types";
import { RefObject } from "react";
import UISelect from "../../../Components/BASE-UI/Select";

export default function TableFooter({
  resolvedMercadorias,
  scrollRef,
}: {
  resolvedMercadorias: ApiListResponse<IMercadoria>;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const limit = Number(searchParams.get("limit")) || 50;
  const page = Number(searchParams.get("page")) || 1;

  const totalCount = resolvedMercadorias.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const handleLimitChange = (value: string | number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("limit", value.toString());
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  return (
    <div className="flex w-full shrink-0 flex-col items-center justify-between gap-4 rounded-b-xl border-x border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 xl:flex-row">
      <div className="text-center text-sm font-medium text-slate-500 xl:w-1/3 xl:text-left">
        Mostrando{" "}
        <span className="font-bold text-slate-700">
          {resolvedMercadorias.data.length > 0 ? (page - 1) * limit + 1 : 0}
        </span>{" "}
        a{" "}
        <span className="font-bold text-slate-700">
          {Math.min(page * limit, totalCount)}
        </span>{" "}
        de <span className="font-bold text-slate-700">{totalCount}</span>{" "}
        mercadorias
      </div>

      <div className="flex items-center justify-center gap-1.5 xl:w-1/3">
        <PageSelector
          totalPages={totalPages}
          page={page}
          handlePageChange={handlePageChange}
        />
      </div>

      <div className="flex items-center justify-center gap-2 xl:w-1/3 xl:justify-end">
        {/* <select
          id="limit"
          value={limit}
          onChange={handleLimitChange}
          className="block rounded-lg border border-none border-slate-200 bg-slate-50 p-1.5 text-sm font-semibold text-slate-700 transition-colors outline-none focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select> */}
        <div className="w-fit">
        <UISelect style="underlined"
        size="sm"
         items={[
          {value: 10, label: "10"},
          {value: 25, label: "25"},
          {value: 50, label: "50"},
          {value: 100, label: "100"},
        ]}
        labelLeft
        label="Por página:"
        onValueChange={(item) => handleLimitChange(item?.value || "")}
        value={{label: limit.toString(), value: limit}}
        />
        </div>

      </div>
    </div>
  );
}
