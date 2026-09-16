import {
  NavLink,
  Outlet,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  LoaderFunctionArgs,
  useNavigate,
} from "react-router";
import {
  Bolt,
  BriefcaseBusiness,
  ChevronLeft,
  ClipboardList,
  Loader2,
  LogOut,
  LucideProps,
  Package,
  PlusCircle,
  ScrollText,
  Timeline,
  Truck,
  Users,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { UsuarioLogado } from "@tauri-inventory/types";
import ConfigModal from "../ConfigOptions/ConfigModal";
import { userContext } from "../../context/contexts";
import { AnimatePresence, motion } from "motion/react";
import {
  checkLocalDbExists,
  getIsOfflineModeActive,
  getLastBackupDate,
  getLastestBackup,
} from "../../backend/backendHelper";
import { apiLogOut } from "../../api/apiHelper";
import { useToast } from "../../context/Toast/ToastContext";

interface INavLink {
  to: string;
  label: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  children?: INavLink[];
  disabled?: boolean;
}

export async function loader({ context }: LoaderFunctionArgs) {
  const usuario = context.get(userContext);
  const isOfflineMode = await getIsOfflineModeActive();

  return { usuario, isOfflineMode };
}

export interface AppLayoutLoaderData {
  usuario: UsuarioLogado | null;
  isOfflineMode: boolean;
}
export const HydrateFallback = () => {
  return (
    <div className="grid size-full place-items-center">
      <Loader2 />
    </div>
  );
};

export function Component() {
  const { usuario, isOfflineMode } = useLoaderData<AppLayoutLoaderData>();
  const location = useLocation();
  const navigate = useNavigate();
  const toaster = useToast();

  const [cfgOverlayOpen, setcfgOverlayOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const links = useMemo(() => {
    const isGerenteOrAdmin =
      usuario?.funcao === "gerente" || usuario?.funcao === "admin";

    const adminLinks =
      usuario?.funcao === "admin"
        ? [
            {
              to: "/gerente/logs",
              label: "Logs",
              icon: ScrollText,
              disabled: isOfflineMode,
            },
          ]
        : [];

    const gerenteLinks = isGerenteOrAdmin
      ? [
          {
            to: "gerente",
            label: "Gerente",
            icon: BriefcaseBusiness,
            children: [
              { to: "/gerente/usuarios", label: "Usuários", icon: Users },
              ...adminLinks,
            ],
          },
        ]
      : [];

    const navLinks: INavLink[] = [
      {
        to: "/mercadorias",
        label: "Mercadorias",
        icon: Package,
        children:
          isGerenteOrAdmin && !isOfflineMode
            ? [
                {
                  to: "/mercadorias/new",
                  label: "Nova Mercadoria",
                  icon: PlusCircle,
                },
              ]
            : [],
      },
      // {
      //   to: "/assistencias",
      //   label: "Assistência",
      //   icon: Wrench,
      //   children: [],
      // },
      {
        to: "/fabricantes",
        label: "Fabricantes",
        icon: Truck,
        children: [],
      },
      {
        to: "/categorias",
        label: "Categorias/Grupos",
        icon: ClipboardList,
      },
      {
        to: "/atributos",
        label: "Características",
        icon: Timeline,
      },
      ...gerenteLinks,
    ];

    return navLinks;
  }, [isOfflineMode, usuario?.funcao]);

  function getUserBorderColor() {
    if (!usuario) return "border-gray-200";
    switch (usuario.funcao) {
      case "vendedor":
        return "border-gray-200";
      case "gerente":
        return "border-blue-300";
      case "admin":
        return "border-red-400";
      default:
        return "border-gray-200";
    }
  }

  // Variantes de animação para os textos (aparecer/desaparecer suavemente)
  const textVariants = {
    hidden: {
      opacity: 0,
      width: 0,
      display: "none",
      transition: { duration: 0.2 },
    },
    visible: {
      opacity: 1,
      width: "auto",
      display: "block",
      transition: { delay: 0.1, duration: 0.2 },
    },
  };

  useEffect(() => {
    const syncBackup = async () => {
      try {
        const lastBackupDate = await getLastBackupDate();
        const timeDiffDays = Math.ceil(
          Date.now() - (Date.parse(lastBackupDate) / 1000) * 3600 * 24,
        );
        if (timeDiffDays >= 1 || !(await checkLocalDbExists())) {
          await getLastestBackup();
        }
      } catch (e: any) {
        console.error(e);
        if (e.code && e.message.response) {
          toaster.toast({
            title: "Backup Local",
            message: e.message.response,
          });
        }
      }
    };
    syncBackup();
  }, []);

  return (
    <>
      <AnimatePresence>
        {cfgOverlayOpen && (
          <ConfigModal onClose={() => setcfgOverlayOpen(false)} />
        )}
      </AnimatePresence>

      <div className="flex h-full w-full grow overflow-hidden bg-slate-50">
        <motion.div
          initial={false}
          animate={{ width: isExpanded ? 260 : 80 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="z-10 flex h-full shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm"
        >
          {/* Header / Logo */}
          <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-4">
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="ml-2 text-lg font-bold tracking-tight whitespace-nowrap text-gray-800"
                >
                  Célio Móveis
                </motion.span>
              )}
            </AnimatePresence>

            <motion.button
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-200 hover:text-gray-800 ${!isExpanded && "mx-auto"}`}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Recolher menu" : "Expandir menu"}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="custom-scrollbar flex-1 overflow-x-hidden overflow-y-auto p-3">
            <ul className="flex flex-col gap-2">
              {links.map((link) => {
                const isParentActive =
                  location.pathname.startsWith(link.to) ||
                  link.children?.some((c) =>
                    location.pathname.startsWith(c.to),
                  );

                return (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      title={!isExpanded ? link.label : undefined}
                      onClick={(e) => {
                        if (link.disabled) {
                          e.preventDefault();
                          toaster.warning({
                            title: `${link.label} indisponivel em modo offline`,
                          });
                        }
                      }}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                          isActive
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        } ${!isExpanded ? "justify-center" : "justify-start"} ${link.disabled && "bg-gray-100! text-slate-400! hover:bg-gray-100!"} `
                      }
                    >
                      {({ isTransitioning, isPending }) => (
                        <>
                          <link.icon
                            className={`h-5 w-5 shrink-0 ${isTransitioning || (isPending && "animate-pulse")}`}
                          />

                          <motion.span
                            variants={textVariants}
                            initial="hidden"
                            animate={isExpanded ? "visible" : "hidden"}
                            className="flex-1 text-sm whitespace-nowrap"
                          >
                            {link.label}
                          </motion.span>

                          <Loader2
                            className={`absolute right-3 h-4 w-4 shrink-0 text-blue-500 transition-opacity duration-300 ${
                              (isTransitioning || isPending) && isExpanded
                                ? "animate-spin opacity-100"
                                : "opacity-0"
                            }`}
                          />
                        </>
                      )}
                    </NavLink>

                    {/* Submenu Animado */}
                    <AnimatePresence>
                      {link.children &&
                        link.children.length > 0 &&
                        isExpanded &&
                        isParentActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1 flex flex-col gap-1 pr-2 pl-10">
                              {link.children.map((child) => (
                                <NavLink
                                  key={child.to}
                                  to={child.to}
                                  className={({ isActive }) =>
                                    `relative flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                                      isActive
                                        ? "bg-blue-50/50 font-semibold text-blue-700"
                                        : "font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`
                                  }
                                >
                                  {({
                                    isActive,
                                    isTransitioning,
                                    isPending,
                                  }) => (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className={`size-1.5 rounded-full transition-colors ${
                                            isActive
                                              ? "bg-blue-600"
                                              : "bg-slate-300"
                                          }`}
                                        />
                                        <span>
                                          {
                                            <child.icon
                                              className={`size-4 shrink-0 ${isTransitioning || (isPending && "animate-pulse")}`}
                                            />
                                          }
                                        </span>
                                        <span className="whitespace-nowrap">
                                          {child.label}
                                        </span>
                                      </div>
                                      <Loader2
                                        className={`h-3.5 w-3.5 shrink-0 text-blue-500 transition-opacity duration-300 ${
                                          isTransitioning
                                            ? "animate-spin opacity-100"
                                            : "opacity-0"
                                        }`}
                                      />
                                    </>
                                  )}
                                </NavLink>
                              ))}
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Actions & User Profile */}
          <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-gray-100 p-3">
            {usuario?.funcao !== "vendedor" && (
              <button
                className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                  !isExpanded ? "justify-center" : "justify-start"
                }`}
                onClick={() => setcfgOverlayOpen(true)}
                title={!isExpanded ? "Configurações" : undefined}
              >
                <Bolt className="h-5 w-5 shrink-0" />
                <motion.span
                  variants={textVariants}
                  initial="hidden"
                  animate={isExpanded ? "visible" : "hidden"}
                  className="whitespace-nowrap"
                >
                  Configurações
                </motion.span>
              </button>
            )}

            {/* Card de Usuário */}
            <div
              className={`flex items-center overflow-hidden rounded-xl border bg-gray-50 ${
                isExpanded
                  ? "flex-row justify-between p-2"
                  : "flex-col justify-center gap-3 px-1 py-3"
              } ${getUserBorderColor()}`}
            >
              <div
                className={`flex items-center gap-3 overflow-hidden ${!isExpanded && "flex-col"}`}
              >
                <div
                  className="flex h-9 w-9 shrink-0 cursor-default items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 shadow-sm select-none"
                  title={!isExpanded ? usuario?.nome : undefined}
                >
                  {usuario?.nome?.charAt(0).toUpperCase() || "U"}
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col truncate"
                  >
                    <span className="truncate text-sm font-semibold text-gray-800">
                      {usuario?.nome || "Usuário"}
                    </span>
                    <span className="truncate text-xs font-medium text-gray-500">
                      Loja {usuario?.local || "Matriz"}
                    </span>
                  </motion.div>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  await apiLogOut();
                  navigate("/");
                }}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600 focus:ring-2 focus:ring-red-200 focus:outline-none"
                title="Sair do sistema"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname.split("/")[1]}
            initial={{ y: 15, opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative flex-1 overflow-y-auto bg-slate-50"
          >
            <Outlet />
            <ScrollRestoration />
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
