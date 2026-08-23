import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: "accent" | "info" | "warning" | "muted";
}

export function StatsCard({ icon, label, value, subtitle, variant = "accent" }: StatsCardProps) {
  const iconClass = variant === "accent" ? "stat-card-icon" : `stat-card-icon stat-card-icon--${variant}`;
  return (
    <div className="card stat-card">
      <div className="stat-card-top">
        <span className={iconClass}>{icon}</span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {subtitle && (
        <div className="stat-card-subtitle">
          <TrendingUp size={13} strokeWidth={2} />
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
}
