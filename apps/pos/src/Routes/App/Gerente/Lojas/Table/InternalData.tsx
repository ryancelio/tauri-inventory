import { ILoja } from "@tauri-inventory/types";
import { useEffect, useState } from "react";
import { timeout } from "../../../../../Helpers/delay";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function InternalData({
  selectedLoja,
}: {
  selectedLoja: ILoja | null;
  }) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        await timeout(1000)
      } catch (e) {

      } finally {
        setIsLoading(false)
      }
    })();
  }, [selectedLoja])
  if (isLoading) {
    return (
      <div className="grid place-items-center size-full">
        <Loader2 className="animate-spin" size={32}/>
      </div>
    )
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}

    >
      {selectedLoja ? (
        <div>{selectedLoja?.nome}</div>
      ) : (
        <div>Selecione uma loja</div>
      )}
    </motion.div>
  );
}
