export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso.replace(" ", "T") + (iso.endsWith("Z") ? "" : "Z"));
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `منذ ${diffHr} ساعة`;
  const diffDay = Math.round(diffHr / 24);
  return `منذ ${diffDay} يوم`;
}
