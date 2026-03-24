import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "warning" | "danger";
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <div className="stats-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <span className={cn(
            "text-3xl font-bold",
            variant === "warning" && "text-risk-moderate",
            variant === "danger" && "text-risk-high",
            variant === "default" && "text-foreground"
          )}>
            {value}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          variant === "warning" && "bg-risk-moderate-bg",
          variant === "danger" && "bg-risk-high-bg",
          variant === "default" && "bg-accent"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            variant === "warning" && "text-risk-moderate",
            variant === "danger" && "text-risk-high",
            variant === "default" && "text-primary"
          )} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn(
            "text-xs font-medium",
            trend.positive ? "text-risk-low" : "text-risk-high"
          )}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
