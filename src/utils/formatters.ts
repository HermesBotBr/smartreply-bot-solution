
export function formatDateTime(dt: string | undefined) {
  if (!dt) return "(não informado)";
  const parts = dt.split("T");
  if (parts.length < 2) return dt;
  const date = parts[0];
  const timeZoneSplit = parts[1].split(".");
  const time = timeZoneSplit[0];
  const zone = dt.substring(dt.indexOf('-'), dt.length);
  return `${date} ${time} (${zone})`;
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return "(não informado)";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
