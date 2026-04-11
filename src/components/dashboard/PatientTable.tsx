import { Eye, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
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

interface PatientTableProps {
  patients?: Patient[];
}

const getQualityBadgeVariant = (quality?: string) => {
  if (!quality) return "secondary";
  const score = quality.toLowerCase();
  if (score.includes("good") || score.includes("excellent")) return "qualityGood";
  if (score.includes("fair") || score.includes("moderate")) return "qualityFair";
  return "qualityPoor";
};

const getRiskBadgeVariant = (level?: string) => {
  if (!level) return "secondary";
  switch (level.toLowerCase()) {
    case "high": return "riskHigh";
    case "moderate": return "riskModerate";
    case "low": return "riskLow";
    default: return "secondary";
  }
};

export function PatientTable({ patients: propPatients }: PatientTableProps = {}) {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      if (propPatients) {
        setPatients(propPatients);
        setLoading(false);
        return;
      }

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
  }, [propPatients]);

  return (
    <div className="clinical-card overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-lg font-semibold text-foreground">Recent Patient Screenings</h3>
        <p className="text-sm text-muted-foreground">Latest EEG screenings and patient information</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Patient Name</TableHead>
            <TableHead className="font-semibold">Age / Gender</TableHead>
            <TableHead className="font-semibold">Latest Score</TableHead>
            <TableHead className="font-semibold">Last Screening</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Loading patients...
              </TableCell>
            </TableRow>
          ) : patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No patients found
              </TableCell>
            </TableRow>
          ) : (
            patients.slice(0, 8).map((patient, index) => (
              <TableRow 
                key={patient.patient_code} 
                className="data-row"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{patient.name}</span>
                    <span className="text-xs text-muted-foreground">ID: {patient.patient_code}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {patient.age} / {patient.gender}
                </TableCell>
                <TableCell>
                  {patient.latestScore !== undefined ? (
                    <span className="font-semibold text-foreground">{patient.latestScore}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {patient.latestEEGDate ? new Date(patient.latestEEGDate).toLocaleDateString() : "No screening"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/patient-history/${patient.patient_code}`)}
                      title="View History"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/longitudinal/${patient.patient_code}`)}
                      title="View Trends"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
 
