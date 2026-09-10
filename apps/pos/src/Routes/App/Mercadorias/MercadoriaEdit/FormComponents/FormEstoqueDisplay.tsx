const EstoqueDisplay = ({
  label,
  id,
  defaultValue,
  disabled,
}: {
  label: string;
  id: string;
  defaultValue: string | number;
  disabled?: boolean;
}) => {
  return (
    <div className="group relative flex w-full items-center">
      <label
        className="pointer-events-none absolute left-3 text-sm font-medium text-slate-400 transition-colors select-none group-focus-within:text-blue-500 group-hover:text-slate-600"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        className={
          "w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-20 text-right text-sm font-semibold text-slate-600 transition-all group-hover:text-slate-700 disabled:bg-gray-200 disabled:text-slate-500" +
          " focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none " +
          " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        }
        id={id}
        name={id}
        type="number"
        defaultValue={defaultValue}
        disabled={disabled}
      />
    </div>
  );
};

export default EstoqueDisplay;
