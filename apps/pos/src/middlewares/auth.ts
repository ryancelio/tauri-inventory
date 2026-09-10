import { MiddlewareFunction, redirect } from "react-router";
import { getUserData } from "../api/apiHelper";
import { userContext } from "../context/contexts";

export const requireAuthMiddleware: MiddlewareFunction = async (
  { context },
  next,
) => {
  const usuario = await getUserData();

  if (!usuario) {
    throw redirect("/");
  }

  context.set(userContext, usuario);

  await next();
};

export const requireGerenteMiddleware: MiddlewareFunction = async (
  { context },
  next,
) => {
  const usuario = context.get(userContext);

  if (!usuario || usuario.funcao === "vendedor") {
    throw redirect("/unauthorized");
  }

  await next();
};
