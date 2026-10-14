import { Request, Response } from "express";
import LojasModel from "../models/Lojas";
import MercadoriaModel from "../models/Mercadoria";
import EstoqueModel from "../models/Estoque";

export async function getLojas(req: Request, res: Response) {
  try {
    const lojas = await LojasModel.findAll();
    res.status(200).json(lojas);
  } catch (e) {
    console.error(e);
    res.status(500).json({response: "Erro interno."})
  }
}

export async function getLojaEstoqueTotal(req: Request, res: Response) {
  try {
    const { lojaId } = req.params;
    const count = await EstoqueModel.sum("estoque",{
      where: {
        lojaId: lojaId,
      }
    })
    return res.status(200).json({ count });
  }catch (e) {
    console.error(e);
    res.status(500).json({response: "Erro Interno."})
  }
}
