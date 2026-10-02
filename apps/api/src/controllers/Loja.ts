import { Request, Response } from "express";
import LojasModel from "../models/Lojas";

export async function getLojas(req: Request, res: Response) {
  try {
    const lojas = await LojasModel.findAll();
    res.status(200).json(lojas);
  } catch (e) {
    console.error(e);
    res.status(500).json({response: "Erro interno."})
  }
}
