import { Menu } from "@base-ui/react/menu";
import { ReactNode } from "react";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  action: () => void;
}

export default function MenuComponent({
  menuHandle,
  items,
}: {
  menuHandle: Menu.Handle<unknown>;
  items: MenuItem[];
}) {
  return (
    <Menu.Root handle={menuHandle}>
      <Menu.Portal>
        <Menu.Positioner>
          <Menu.Popup
            onClick={(e) => e.stopPropagation()}
            className={
              "relative origin-(--transform-origin) rounded-lg border border-neutral-100 bg-white py-1 text-neutral-700 shadow-md outline-hidden transition-[scale,opacity] duration-100 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
            }
          >
            {items.map((item) => (
              <Menu.Item
                onClick={(_) => item.action()}
                className={
                  "flex cursor-default py-2 pr-8 pl-4 text-sm leading-4 outline-hidden select-none data-disabled:text-neutral-500 data-highlighted:relative data-highlighted:z-0 data-highlighted:text-white data-highlighted:before:absolute data-highlighted:before:inset-x-1 data-highlighted:before:inset-y-0 data-highlighted:before:z-[-1] data-highlighted:before:bg-blue-400 data-highlighted:before:content-['']"
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
