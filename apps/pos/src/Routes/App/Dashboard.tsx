import { useEffect, useState } from "react";
import { criarMercadoria, listarMercadorias } from "../../api/apiHelper";

export default function Dashboard() {
  const [formData, setFormData] = useState({
    descricao: "",
    key: "",
    precoCusto: "",
    precoVenda: "",
    estoque02: "",
    estoque03: "",
    estoque04: "",
    obs: "",
    caracteristicas: "",
  });

  const [mercs, setMerc] = useState([]);

  useEffect(() => {
    const getMerc = async () => {
      const res = await listarMercadorias();
      console.log(res);
      setMerc(res.data.data);
    };
    getMerc();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const result = await criarMercadoria(formData);
    if (result) {
      console.log("Mercadoria criada com sucesso!", result);
      alert("Mercadoria criada com sucesso!");
    } else {
      console.error("Erro ao criar mercadoria.");
      alert("Erro ao criar mercadoria.");
    }
  };

  return (
    <div className="h-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="descricao">descricao</label>
        <input
          type="text"
          name="descricao"
          id="descricao"
          value={formData.descricao}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="key">key</label>
        <input
          type="text"
          name="key"
          id="key"
          value={formData.key}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="precoCusto">precoCusto</label>
        <input
          type="text"
          name="precoCusto"
          id="precoCusto"
          value={formData.precoCusto}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="precoVenda">precoVenda</label>
        <input
          type="text"
          name="precoVenda"
          id="precoVenda"
          value={formData.precoVenda}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="estoque02">estoque02</label>
        <input
          type="text"
          name="estoque02"
          id="estoque02"
          value={formData.estoque02}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="estoque03">estoque03</label>
        <input
          type="text"
          name="estoque03"
          id="estoque03"
          value={formData.estoque03}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="estoque04">estoque04</label>
        <input
          type="text"
          name="estoque04"
          id="estoque04"
          value={formData.estoque04}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="obs">obs</label>
        <input
          type="text"
          name="obs"
          id="obs"
          value={formData.obs}
          onChange={handleChange}
          className="mb-4 border p-1"
        />
        <label htmlFor="caracteristicas">caracteristicas</label>
        <input
          type="text"
          name="caracteristicas"
          id="caracteristicas"
          value={formData.caracteristicas}
          onChange={handleChange}
          className="mb-4 border p-1"
        />

        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Criar Mercadoria
        </button>
      </form>
      <div>
        {mercs.map((merc) => (
          <div>{merc.descricao}</div>
        ))}
      </div>
    </div>
  );
}
