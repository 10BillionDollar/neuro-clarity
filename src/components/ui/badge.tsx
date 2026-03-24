import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Risk level variants
        riskLow: "border-risk-low/30 bg-risk-low-bg text-risk-low",
        riskModerate: "border-risk-moderate/30 bg-risk-moderate-bg text-risk-moderate",
        riskHigh: "border-risk-high/30 bg-risk-high-bg text-risk-high",
        // Quality variants
        qualityGood: "border-quality-good/30 bg-risk-low-bg text-quality-good",
        qualityFair: "border-quality-fair/30 bg-risk-moderate-bg text-quality-fair",
        qualityPoor: "border-quality-poor/30 bg-risk-high-bg text-quality-poor",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
