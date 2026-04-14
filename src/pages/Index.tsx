import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReportTable } from "@/components/dashboard/ReportTable";
import { PatientTable } from "@/components/dashboard/PatientTable";
import { FollowUpsSidebar } from "@/components/dashboard/FollowUpsSidebar";
import { useEffect, useState } from "react";
import { getPatientsDb, getPatientHistory } from "@/app/patients";

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  latestEEGDate?: string;
  latestEEGQuality?: string;
  latestRiskLevel?: string;
  latestProbability?: number;
  latestScore?: number;
}

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatientsDb();
        const patientList = Array.isArray(data) ? data : data?.patients ?? [];

        // Fetch latest screening data for each patient
        const patientsWithScreenings = await Promise.all(
          patientList.map(async (patient: Patient) => {
            try {
              const history = await getPatientHistory(patient.patient_code);
              const latestScreening = history && history.length > 0 ? history[0] : null;
              return {
                ...patient,
                latestEEGDate: latestScreening?.date || latestScreening?.created_at || latestScreening?.report_date,
                latestEEGQuality: latestScreening?.quality || latestScreening?.eeg_quality,
                latestRiskLevel: latestScreening?.risk_level,
                latestProbability: latestScreening?.probability,
                latestScore: latestScreening?.internal_brain_health_score,
              };
            } catch (error) {
              // If history fetch fails, return patient without screening data
              return patient;
            }
          })
        );

        setPatients(patientsWithScreenings);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);
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
             <ReportTable
              patients={patients}
              loading={loading}
          />
          </div>

          {/* Follow-ups Sidebar */}
          <div className="lg:col-span-1">
            <FollowUpsSidebar />
          </div>
        </div>

        {/* Report Table */}
        <div>
       
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;