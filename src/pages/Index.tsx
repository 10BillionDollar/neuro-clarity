import { Activity, AlertTriangle, Clock, Zap } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReportTable } from "@/components/dashboard/ReportTable";
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
  const [todaysScreenCount, setTodaysScreenCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);

  // Function to check if date is today
  const isToday = (dateString: string | undefined): boolean => {
    if (!dateString) return false;
    const today = new Date();
    const checkDate = new Date(dateString);

    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  };

  // Function to check high risk
  const isHighRisk = (riskLevel: string | undefined): boolean => {
    if (!riskLevel) return false;
    const risk = riskLevel.toLowerCase();
    return risk.includes("high");
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatientsDb();
        const patientList = Array.isArray(data) ? data : data?.patients ?? [];

        let totalTodaysScreens = 0;
        const highRiskPatients = new Set<string>();

        const patientsWithScreenings = await Promise.all(
          patientList.map(async (patient: any) => {
            try {
              const history = await getPatientHistory(patient.patient_code);
              const screenings = Array.isArray(history) ? history : [];

              // Count today's screenings for this patient
              const todaysInThisPatient = screenings.filter((screen: any) => {
                const date = screen?.date || screen?.created_at || screen?.report_date;
                return isToday(date);
              }).length;

              totalTodaysScreens += todaysInThisPatient;

              // Latest screening for display
              const latestScreening = screenings.length > 0 ? screenings[0] : null;

              const latestRisk = latestScreening?.risk_level || 
                               latestScreening?.risk_band;

              if (isHighRisk(latestRisk) || latestRisk === "High Cognitive Risk") {
                highRiskPatients.add(patient.patient_code);
              }

              return {
                ...patient,
                latestEEGDate: latestScreening?.date || 
                              latestScreening?.created_at || 
                              latestScreening?.report_date,
                latestEEGQuality: latestScreening?.quality || 
                                 latestScreening?.eeg_quality,
                latestRiskLevel: latestRisk,
                latestProbability: latestScreening?.probability,
                latestScore: latestScreening?.internal_brain_health_score,
              };
            } catch (error) {
              console.error(`Error fetching history for ${patient.patient_code}:`, error);
              return patient;
            }
          })
        );

        setPatients(patientsWithScreenings);
        setTodaysScreenCount(totalTodaysScreens);
        setHighRiskCount(highRiskPatients.size);

        console.log("✅ Today's Total Screenings:", totalTodaysScreens);
        console.log("✅ High Risk Patients:", highRiskPatients.size);

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
            value={todaysScreenCount}
            subtitle={todaysScreenCount === 0 ? "No screenings today" : `${todaysScreenCount} screenings completed`}
            icon={Activity}
          />
          <StatsCard
            title="High-Risk Detected"
            value={highRiskCount}
            subtitle={highRiskCount === 0 ? "No high-risk cases" : `${highRiskCount} high-risk cases found`}
            icon={AlertTriangle}
            variant="danger"
          />
          <StatsCard
            title={<span>Pending Reviews<br/><span className="text-xs text-muted-foreground font-normal">(To be launched)</span></span>}
            value={5}
            subtitle="Awaiting assessment"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title={<span>Avg EEG Quality<br/><span className="text-xs text-muted-foreground font-normal">(To be launched)</span></span>}
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
      </div>
    </MainLayout>
  );
};

export default Index;