// Botão reutilizado para atualizar uma consulta; a página informa qual função executar.

export default function RefreshButton({
  label,
  onClick,
  loading = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="btn workspace-refresh refresh-icon-button"
      aria-label={label}
      aria-busy={loading}
      title={loading ? "Atualizando…" : label}
      onClick={onClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      ) : (
        <i className="bi bi-arrow-clockwise" aria-hidden="true" />
      )}
    </button>
  );
}
