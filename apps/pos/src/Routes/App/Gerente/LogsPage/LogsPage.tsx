import {
  Box,
  Loader2,
  LucideProps,
  ScanEye,
  ScrollText,
  Store,
  Truck,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { AppError } from "../../Errors/AppError";
import { LogHydrateFallback } from "./shared/LogFallback";

interface FilteringTabType {
  label: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
  to: string;
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
    label: "Usuário",
    icon: User,
    to: "usuarios",
  },
  {
    label: "Lojas",
    icon: Store,
    to: "lojas",
  },
];

export const HydrateFallback = LogHydrateFallback;
export const ErrorBoundary = AppError;

export function Component() {
  const location = useLocation();
  const activeTab = location.pathname.split("/")[3] ?? "all";

  return (
    <div className="h-full w-full overflow-hidden bg-slate-50 p-3 md:p-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <header className="shrink-0 border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                <ScrollText size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-800">Logs</h1>
                <p className="text-sm text-slate-500">
                  Rastreabilidade das ações realizadas no sistema
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-1">
              {filteringTabs.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={({ isActive }) =>
                    `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isPending, isTransitioning }) => (
                    <>
                      {isPending || isTransitioning ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" />
                      ) : (
                        <tab.icon className="h-4 w-4 shrink-0" />
                      )}

                      <span className="whitespace-nowrap">{tab.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
