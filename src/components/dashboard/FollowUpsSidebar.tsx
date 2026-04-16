import { Calendar, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
interface FollowUp {
  id: string;
  patientName: string;
  interval: string;
  notes: string;
  priority: "high" | "medium" | "low";
}

const mockFollowUps: FollowUp[] = [
  { id: "F001", patientName: "Vikram Singh", interval: "3 months", notes: "Rapid decline observed", priority: "high" },
  { id: "F002", patientName: "Rajesh Kumar", interval: "6 months", notes: "Monitor PDR changes", priority: "high" },
  { id: "F003", patientName: "Priya Patel", interval: "6 months", notes: "Stable but elevated risk", priority: "medium" },
  { id: "F004", patientName: "Suresh Reddy", interval: "12 months", notes: "Routine follow-up", priority: "low" },
  { id: "F005", patientName: "Lakshmi Nair", interval: "6 months", notes: "Borderline markers", priority: "medium" },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-risk-high";
    case "medium": return "bg-risk-moderate";
    case "low": return "bg-risk-low";
    default: return "bg-muted";
  }
};

export function FollowUpsSidebar() {
  return (
    <div className="clinical-card h-fit">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Upcoming Follow-Ups <span className="text-xs text-muted-foreground">(To be launched)</span></h3>
      </div>

      <div className="flex flex-col gap-3">
        {mockFollowUps.map((followUp, index) => (
          <div 
            key={followUp.id} 
            className="group relative rounded-lg border border-border bg-muted/20 p-3 transition-all hover:bg-muted/40 hover:shadow-sm animate-slide-in-right"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            {/* Priority indicator */}
            <div className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${getPriorityColor(followUp.priority)}`} />
            
            <div className="ml-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{followUp.patientName}</span>
                {followUp.priority === "high" && (
                  <AlertCircle className="h-4 w-4 text-risk-high animate-pulse-subtle" />
                )}
              </div>
            
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Re-test in {followUp.interval}</span>
              </div>
              
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {followUp.notes}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <button className="text-sm font-medium text-primary hover:underline">
          View All Follow-Ups →
        </button>
      </div>
    </div>
  );
}
