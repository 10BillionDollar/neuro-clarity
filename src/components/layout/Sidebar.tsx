import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  FileText,
  TrendingUp,
  Shield,
  Settings,
  Users,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "New Screening", href: "/upload", icon: Upload },
  { name: "Patient Reports", href: "/reports", icon: FileText },
  { name: "Longitudinal", href: "/longitudinal", icon: TrendingUp },
  { name: "Model Evidence", href: "/evidence", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-border bg-sidebar">
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Regulatory Footer */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This tool provides risk assessment and is not a clinical diagnosis. Always consult qualified medical professionals.
        </p>
      </div>
    </aside>
  );
}
