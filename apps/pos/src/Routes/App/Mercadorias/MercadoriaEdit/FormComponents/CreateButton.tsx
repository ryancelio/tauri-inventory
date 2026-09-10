import { NativeButtonProps } from "@base-ui/react/internals/types";
import { Plus } from "lucide-react";

export default function CreateButton({
  onClick,
  disabled,
  className,
  label,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  // onClick: () => void;
  // disabled?: boolean;
  // className?: string;
  label?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      {...props}
      type="button"
      onClick={onClick}
      title={disabled ? "Impossivel criar em modo offline" : label}
      className={`flex items-center justify-center gap-2 rounded-lg bg-blue-500 p-1.5 text-center text-white transition-all ease-out not-disabled:hover:brightness-95 not-disabled:active:scale-95 disabled:bg-blue-300 ${label && "px-3 py-2"} ${className}`}
      disabled={disabled}
    >
      <Plus className="" />
      {children ? children : label}
    </button>
  );
}
