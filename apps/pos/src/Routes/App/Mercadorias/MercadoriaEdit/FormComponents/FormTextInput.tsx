import { RefObject } from "react";

const FormTextInput = ({
  id,
  label,
  placeholder,
  defaultValue,
  classNames,
  readOnly,
  required = false,
  ref,
}: {
  id: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  classNames?: { input?: string; label?: string };
  readOnly?: boolean;
  required?: boolean;
  ref?: RefObject<HTMLInputElement | null>;
}) => {
  return (
    <div className="flex flex-1 flex-col">
      <label
        htmlFor={id}
        className={`text-sm text-gray-800 ${classNames?.label}`}
      >
        {label}
      </label>
      <input
        type="text"
        required={required}
        name={id}
        id={id}
        defaultValue={defaultValue}
        placeholder={placeholder}
        ref={ref}
        className={`rounded-lg border border-gray-300 bg-gray-50 p-1 pl-3 text-lg text-gray-800 placeholder-gray-400 transition-all outline-none hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-gray-200 disabled:opacity-70 data-readonly:bg-gray-50 ${classNames?.input}`}
        readOnly={readOnly}
      />
    </div>
  );
};

export default FormTextInput;
