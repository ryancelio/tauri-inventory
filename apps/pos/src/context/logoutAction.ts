import { ActionFunction, redirect } from "react-router";
import { apiLogOut } from "../api/apiHelper";

export const action: ActionFunction = async () => {
  await apiLogOut();

  return redirect("/");
};
