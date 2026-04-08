import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant: "green" | "red" | "orange" | "blue";
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, variant, subtitle }: StatCardProps) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className={`text-2xl font-bold mt-1 neon-text-${variant === "orange" ? "orange" : variant}`}>{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-neon-${variant}/10`}>
          <Icon className={`w-5 h-5 text-neon-${variant}`} />
        </div>
      </div>
    </div>
  );
}
