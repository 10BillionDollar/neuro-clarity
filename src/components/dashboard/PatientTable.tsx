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

interface Patient {
  id: string;
  name: string;
  age: number;
  sex: string;
  eegQuality: number;
  riskLevel: "low" | "moderate" | "high";
  probability: number;
  lastScreening: string;
}

const mockPatients: Patient[] = [
  { id: "P001", name: "Rajesh Kumar", age: 68, sex: "M", eegQuality: 92, riskLevel: "high", probability: 78, lastScreening: "2024-01-15" },
  { id: "P002", name: "Priya Patel", age: 72, sex: "F", eegQuality: 88, riskLevel: "high", probability: 72, lastScreening: "2024-01-14" },
  { id: "P003", name: "Suresh Reddy", age: 65, sex: "M", eegQuality: 85, riskLevel: "moderate", probability: 45, lastScreening: "2024-01-14" },
  { id: "P004", name: "Anita Sharma", age: 58, sex: "F", eegQuality: 91, riskLevel: "moderate", probability: 38, lastScreening: "2024-01-13" },
  { id: "P005", name: "Vikram Singh", age: 75, sex: "M", eegQuality: 78, riskLevel: "high", probability: 82, lastScreening: "2024-01-13" },
  { id: "P006", name: "Meera Gupta", age: 62, sex: "F", eegQuality: 94, riskLevel: "low", probability: 15, lastScreening: "2024-01-12" },
  { id: "P007", name: "Arun Joshi", age: 70, sex: "M", eegQuality: 86, riskLevel: "low", probability: 22, lastScreening: "2024-01-12" },
  { id: "P008", name: "Lakshmi Nair", age: 67, sex: "F", eegQuality: 89, riskLevel: "moderate", probability: 48, lastScreening: "2024-01-11" },
];

const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case "high": return "riskHigh";
    case "moderate": return "riskModerate";
    case "low": return "riskLow";
    default: return "secondary";
  }
};

const getQualityBadgeVariant = (score: number) => {
  if (score >= 85) return "qualityGood";
  if (score >= 60) return "qualityFair";
  return "qualityPoor";
};

export function PatientTable() {
  const navigate = useNavigate();

  // Sort patients by risk level (high first)
  const sortedPatients = [...mockPatients].sort((a, b) => {
    const riskOrder = { high: 0, moderate: 1, low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });

  return (
    <div className="clinical-card overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-lg font-semibold text-foreground">Patient Screenings</h3>
        <p className="text-sm text-muted-foreground">Sorted by risk level - high risk patients first</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Patient Name</TableHead>
            <TableHead className="font-semibold">Age / Sex</TableHead>
            <TableHead className="font-semibold">EEG Quality</TableHead>
            <TableHead className="font-semibold">Risk Level</TableHead>
            <TableHead className="font-semibold">Probability</TableHead>
            <TableHead className="font-semibold">Last Screening</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPatients.map((patient, index) => (
            <TableRow 
              key={patient.id} 
              className="data-row"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{patient.name}</span>
                  <span className="text-xs text-muted-foreground">ID: {patient.id}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {patient.age} / {patient.sex}
              </TableCell>
              <TableCell>
                <Badge variant={getQualityBadgeVariant(patient.eegQuality)}>
                  {patient.eegQuality}%
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getRiskBadgeVariant(patient.riskLevel)}>
                  {patient.riskLevel.charAt(0).toUpperCase() + patient.riskLevel.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`font-semibold ${
                  patient.probability >= 70 ? "text-risk-high" :
                  patient.probability >= 40 ? "text-risk-moderate" :
                  "text-risk-low"
                }`}>
                  {patient.probability}%
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(patient.lastScreening).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/report/${patient.id}`)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate(`/longitudinal/${patient.id}`)}
                  >
                    <TrendingUp className="mr-1 h-4 w-4" />
                    Trends
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
