import { MiddlewareFunction } from "react-router";
import { apiStatusContext } from "../context/contexts";
import { getApiStatusCheck } from "../backend/backendHelper";

export const apiStatusMiddleware: MiddlewareFunction = async (
  { context },
  next,
) => {
  try {
    const { isOnline, isChecking } = await getApiStatusCheck();
    context.set(apiStatusContext, { isChecking, isOnline });
  } catch (error) {
    context.set(apiStatusContext, { isChecking: false, isOnline: false });
  }

  await next();
};
