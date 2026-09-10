import { TriangleAlert } from "lucide-react";
import { Link } from "react-router";

export const Component = () => {
  return (
    <div className="w-full h-full grid place-items-center  p-4">
      <div className="h-full w-full rounded-xl flex flex-col bg-red-50 border-red-500 border-2 border-dotted text-xl items-center justify-center gap-3">
        <TriangleAlert className="text-black" size={50} />
        <h1 className="underline underline-offset-8 text-gray-800 text-2xl">
          Não autorizado
        </h1>
        <button className="bg-white px-4 py-2 rounded-lg mt-4 text-md hover:bg-gray-50 cursor-pointer">
          <Link to={"/mercadorias"}>Voltar ao inicio</Link>
        </button>
      </div>
    </div>
  );
};
