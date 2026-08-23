import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon ?? <Inbox size={24} strokeWidth={1.5} />}</div>
      <div className="empty-state-title">{title}</div>
      {subtitle && <div>{subtitle}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
