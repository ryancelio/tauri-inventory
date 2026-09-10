import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

export function bodyParser<T extends ZodType>(
    schema: T
){
    return (req: Request,res: Response,next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if(!result.success){
            return res.status(400).json({response: `Dados inválidos: ${JSON.stringify(result.error.issues[0])}`})
        }

        req.body = result.data;

        next();
    }   
}