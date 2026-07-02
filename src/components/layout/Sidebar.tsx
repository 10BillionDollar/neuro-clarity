import { useEffect, useState } from "react";
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
  Menu,
  X,
  ChevronDown,
  Brain,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Patients Reports", href: "/patients", icon: Users },
  {
    name: "Screening",
    href: "#",
    icon: Upload,
    subTabs: [
      { name: "Cognitive Screening", href: "/upload", icon: Upload },
      { name: "EEG Signal Analysis", href: "/eeg-analysis", icon: FileText },
      { name: "Technician Report", href: "/eeg-technician-report", icon: FileText },
    ],
  },
  { name: "Neuro Intake", href: "/neuro-intake", icon: Brain },
  { name: "Longitudinal", href: "/longitudinal", icon: TrendingUp },
  { name: "Model Evidence", href: "/evidence", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Cognitive Assessment", href: "/cognitive-assessment", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    navigation.forEach((item) => {
      if (item.subTabs?.some((sub) => sub.href === location.pathname)) {
        setExpandedItems((prev) => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-border bg-sidebar transition-all duration-300",
        open ? "w-64" : "w-16"
      )}
    >
      <div className={cn("flex h-8 items-center px-3 pt-1", open ? "justify-end" : "justify-center")}> 
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          className="grid h-8 w-8 place-items-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-4 pb-4 pt-1">
        {navigation.map((item) => {
          const hasSubTabs = Array.isArray(item.subTabs) && item.subTabs.length > 0;
          const isSubActive = item.subTabs?.some((sub) => location.pathname === sub.href);
          const isActive = !hasSubTabs && location.pathname === item.href;
          const expanded = expandedItems[item.name] ?? false;

          if (hasSubTabs) {
            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setExpandedItems((prev) => ({ ...prev, [item.name]: !expanded }))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    !open && "justify-center px-2",
                    isSubActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  title={!open ? item.name : undefined}
                >
                  <item.icon className={cn("h-5 w-5", isSubActive ? "text-primary" : "")} />
                  {open && item.name}
                  {open && <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", expanded && "rotate-180")} />}
                </button>

                {open && expanded && (
                  <div className="space-y-1 pl-8">
                    {item.subTabs!.map((sub) => {
                      const isSubItemActive = location.pathname === sub.href;
                      return (
                        <NavLink
                          key={sub.name}
                          to={sub.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                            isSubItemActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <sub.icon className={cn("h-4 w-4", isSubItemActive ? "text-primary" : "")} />
                          {sub.name}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                !open && "justify-center px-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              title={!open ? item.name : undefined}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
              {open && item.name}
            </NavLink>
          );
        })}
      </nav>

      {open && (
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This tool provides risk assessment and is not a clinical diagnosis. Always consult qualified medical professionals.
        </p>
      </div>
      )}
    </aside>
  );
}
