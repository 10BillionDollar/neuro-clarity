import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PatientTable } from "@/components/dashboard/PatientTable";
import { FollowUpsSidebar } from "@/components/dashboard/FollowUpsSidebar";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of today's screenings and patient risk assessments</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Today's Screens"
            value={14}
            subtitle="3 more than yesterday"
            icon={Activity}
            trend={{ value: 12, positive: true }}
          />
          <StatsCard
            title="High-Risk Detected"
            value={3}
            subtitle="Requires attention"
            icon={AlertTriangle}
            variant="danger"
          />
          <StatsCard
            title="Pending Reviews"
            value={5}
            subtitle="Awaiting assessment"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Avg EEG Quality"
            value="82%"
            subtitle="Signal quality score"
            icon={Zap}
            trend={{ value: 4, positive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Patient Table - Takes 2 columns */}
          <div className="lg:col-span-2">
            <PatientTable />
          </div>

          {/* Follow-ups Sidebar */}
          <div className="lg:col-span-1">
            <FollowUpsSidebar />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
