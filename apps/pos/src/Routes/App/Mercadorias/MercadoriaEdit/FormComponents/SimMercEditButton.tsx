export default function SimMercEditButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="cursor-pointer rounded-lg bg-blue-500 px-2.5 py-2 text-xs font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
    >
      Alterar para variações
    </button>
  );
}
