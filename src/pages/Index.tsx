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

  // Function to check if risk level is high (includes all "high" risk types)
  const isHighRisk = (riskLevel: string | undefined): boolean => {
    if (!riskLevel) return false;
    const risk = riskLevel.toLowerCase();
    console.log("Checking risk level:", riskLevel, "-> includes high:", risk.includes("high"));
    return risk.includes("high");
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatientsDb();
        const patientList = Array.isArray(data) ? data : data?.patients ?? [];
        console.log("Fetched patients:", patientList);

        // Fetch latest screening data for each patient
        const patientsWithScreenings = await Promise.all(
          patientList.map(async (patient: Patient) => {
            try {
              const history = await getPatientHistory(patient.patient_code);
              const latestScreening = history && history.length > 0 ? history[0] : null;
              console.log(`Patient ${patient.patient_code} - Latest screening:`, latestScreening);
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

        console.log("Patients with screenings:", patientsWithScreenings);
        setPatients(patientsWithScreenings);

        // Calculate today's screens and high-risk counts
        const todaysCount = patientsWithScreenings.filter(p => {
          return isToday(p.latestEEGDate);
        }).length;

        const highRiskChecks = patientsWithScreenings.filter(p => p.risk_band === "High Cognitive Risk").length;

        console.log("Today's count:", todaysCount, "High-risk count:", highRiskChecks);
        setTodaysScreenCount(todaysCount);
        setHighRiskCount(highRiskChecks);
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
            subtitle="Aw  aiting assessment"
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

        {/* Report Table */}
        <div>
       
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;