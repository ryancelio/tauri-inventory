import { Menu } from "@base-ui/react/menu";
import { PropsWithChildren, ReactNode } from "react";

export interface MenuItem {
  row: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export interface MenuItemGroup {
  label?: string;
  items: MenuItem[];
  separator?: boolean;
}

export interface SimpleMenuProps {
  menuItems: MenuItemGroup[];
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  alignOffset?: number;
}

export default function SimpleMenu({
  children,
  menuItems,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  alignOffset = -4,
}: PropsWithChildren<SimpleMenuProps>) {
  return (
    <Menu.Root>
      <Menu.Trigger>{children}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="z-220 outline-hidden"
        >
          <Menu.Popup
            className="relative origin-(--transform-origin) min-w-44 overflow-hidden rounded-xl border border-slate-200/70 bg-white/95 p-1 text-slate-700 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] outline-hidden backdrop-blur-[1px] transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
          >
            {menuItems.map((group, groupIndex) => (
              <div key={groupIndex}>
                <Menu.Group>
                  {group.label !== undefined && (
                    <Menu.GroupLabel className="px-2 py-1 text-xs font-medium text-slate-400 select-none">
                      {group.label}
                    </Menu.GroupLabel>
                  )}
                  {group.items.map((item, itemIndex) => (
                    <Menu.Item
                      key={itemIndex}
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm leading-4 text-slate-700 outline-hidden select-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-slate-100 data-highlighted:text-slate-900"
                    >
                      {item.row}
                    </Menu.Item>
                  ))}
                </Menu.Group>
                {(group.separator || groupIndex < menuItems.length - 1) && (
                  <Menu.Separator className="my-1 h-px bg-slate-200/70" />
                )}
              </div>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
