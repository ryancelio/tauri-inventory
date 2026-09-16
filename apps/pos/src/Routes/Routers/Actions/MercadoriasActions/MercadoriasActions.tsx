import { redirect } from "react-router";
import { deleteMercadoria } from "../../../../api/apiHelper";

export async function deleteMercadoriaAction(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    return {
      ok: false,
      response: "ID de mercadoria Inválido.",
    };
  }

  await deleteMercadoria(id);
  const msg = encodeURIComponent(`Mercadoria ${id} deletada com sucesso!`);
  return redirect(`/mercadorias?msg=${msg}`);
}
