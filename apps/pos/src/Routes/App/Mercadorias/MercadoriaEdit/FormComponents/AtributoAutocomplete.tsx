import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

function AtributoAutoComplete({
  options,
  label,
  id,
  defaultValue,
  classNames,
  inputTextSize,
  colSpan = 2,
  onValueChange,
  placeholder,
  readOnly,
}: {
  options: { id: number | string; nome: string }[] | any[];
  label: string;
  id: string;
  defaultValue: string;
  classNames?: { input?: string; label?: string };
  inputTextSize?: "xs" | "sm" | "md" | "lg";
  colSpan?: number;
  onValueChange?: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [filtered, setFiltered] = useState<any[]>(options);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<any>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const changeFiltered = (filter: string | undefined) => {
    if (!filter || !filter.trim()) {
      setFiltered(options);
      return;
    }

    const normalizeString = (str: string) =>
      str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const normalizedFilter = normalizeString(filter);
    const newFilter = options.filter((opt) =>
      normalizeString(opt.nome).includes(normalizedFilter),
    );

    setFiltered(newFilter);
  };

  useEffect(() => {
    changeFiltered(value);
  }, [value, options]);

  useEffect(() => {
    // Fecha o dropdown caso a tela ou qualquer container com scroll (como o card) seja rolado
    const handleScroll = (e: Event) => {
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        dropdownRef.current.contains(e.target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      // "true" para capturar o evento de scroll originado em qualquer filho da página
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        e.target instanceof Node &&
        !wrapperRef.current.contains(e.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target))
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const openDropdown = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
    }
    setIsOpen(true);
  };

  return (
    <div
      className={`relative col-span-${colSpan} flex flex-col justify-start`}
      ref={wrapperRef}
    >
      <label htmlFor="" className={"text-sm " + classNames?.label}>
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        name={id}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (onValueChange) onValueChange(e.target.value);
        }}
        onFocus={(e) => {
          if (readOnly) {
            return;
          }
          const target = e.target;
          setTimeout(() => target.select(), 0);
          openDropdown();
        }}
        className={`w-full rounded-lg border border-transparent bg-gray-50 p-1 text-lg text-gray-900 focus:border-gray-200 focus:shadow-sm focus:outline-none ${isOpen && "rounded-b-none"} ${classNames?.input} text-${inputTextSize}`}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {isOpen &&
        filtered.length > 0 &&
        createPortal(
          <ul
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            className="z-99 max-h-32 overflow-y-auto rounded-b-lg border border-gray-200 bg-white shadow-xl"
          >
            {filtered.map((opt) => (
              <li
                key={opt.id}
                onClick={() => {
                  setValue(opt.nome);
                  setIsOpen(false);
                  if (onValueChange) onValueChange(opt.nome);
                }}
                className={
                  "w-full cursor-pointer bg-white p-2 capitalize shadow-sm not-last:border-b not-last:border-gray-300/50 last:rounded-b-lg hover:bg-gray-200 " +
                  `text-${inputTextSize}`
                }
              >
                {opt.nome}
              </li>
            ))}
          </ul>,
          document.body,
        )}
      {isOpen &&
        filtered.length === 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
            }}
            className={
              "z-50 rounded-b-lg border border-gray-200 bg-white p-3 shadow-xl " +
              `text-${inputTextSize}`
            }
          >
            <h1>Nenhuma</h1>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default AtributoAutoComplete;
