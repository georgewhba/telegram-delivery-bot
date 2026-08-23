export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US");
}

export function formatPercent(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}
