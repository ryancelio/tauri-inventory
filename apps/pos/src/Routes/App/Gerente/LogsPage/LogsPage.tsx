import { Box, Loader2, LucideProps, ScanEye, Truck, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import {
  Link,
  LoaderFunctionArgs,
  NavLink,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
  useNavigation,
  useRouteError,
} from "react-router";

interface FilteringTabType {
  label: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  to: string;
}

function HydrateFallback() {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
}

function ErrorBoundary() {
  let error = useRouteError() as any;
  console.log(error);
  if (error instanceof Error) {
    return (
      <div className="grid place-items-center size-full border-4 border-dotted border-red-600  bg-linear-to-br from-red-400 to-red-600">
        <div className="text-center text-white font-semibold text-shadow-sm">

        <div>Erro ao acessar logs.</div>
        <p>{error.message}</p>
        <p>
          Tente novamente e, caso o erro persista, entre em contato com um
          administrador.
        </p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid place-items-center border border-dotted border-red-500 bg-red-400">
      <div>Erro ao acessar logs.</div>
      <p>
        {error?.message && error?.message?.response
          ? error.message.response
          : ""}
      </p>
      <p>
        Tente novamente e, caso o erro persista, entre em contato com um
        administrador.
      </p>
    </div>
  );
}

const filteringTabs: FilteringTabType[] = [
  {
    label: "Todas",
    icon: ScanEye,
    to: "all",
  },
  {
    label: "Mercadoria",
    icon: Box,
    to: "mercadorias",
  },
  {
    label: "Fabricantes",
    icon: Truck,
    to: "fabricantes",
  },
  {
    label: "Usuario",
    icon: User,
    to: "usuarios",
  },
];

function Component() {
  const location = useLocation();
  return (
    <div className="size-full bg-white p-0">
      <motion.div
        className="flex size-full bg-linear-to-b from-gray-50 to-white p-2"
        initial={{ y: 5 }}
        animate={{ y: 0 }}
      >
        <nav className="h-full w-1/6 min-w-fit shrink-0">
          <ul className="flex size-full flex-col gap-1 rounded-lg bg-white">
            {filteringTabs.map((tab) => {
              return (
                <NavLink
                  to={tab.to}
                  className={({ isActive }) =>
                    `group relative flex h-12 items-center gap-3 rounded-lg rounded-r-none p-2.5 transition-colors ${
                      isActive
                        ? "bg-linear-to-r from-blue-50 to-gray-100 font-semibold text-blue-700"
                        : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    } `
                  }
                >
                  {({ isTransitioning, isPending }) => (
                    <>
                      <tab.icon
                        className={`size-6 shrink-0 ${isTransitioning || (isPending && "animate-pulse")}`}
                      />

                      <span className="flex-1 whitespace-nowrap">
                        {tab.label}
                      </span>

                      <Loader2
                        className={`absolute right-3 size-6 shrink-0 text-blue-500 transition-opacity duration-300 ${
                          isTransitioning || isPending
                            ? "animate-spin opacity-100"
                            : "opacity-0"
                        }`}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}
          </ul>
        </nav>

        {/* Table */}
        <div className="h-full w-5/6 overflow-hidden bg-linear-to-b from-gray-100 to-white p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname.split("/")[3]}
              initial={{ y: 15, opacity: 0.4 }}
              animate={{ y: 0, opacity: 1 }}
              className="size-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default { Component, HydrateFallback, ErrorBoundary };
