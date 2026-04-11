import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPatientHistory } from "@/app/patients";
import { ArrowLeft, Clock } from "lucide-react";

interface HistoryEntry {
  id?: number | string;
  patient_code?: string;
  report_date?: string;
  created_at?: string;
  risk_level?: string;
  probability?: number;
  eeg_quality?: number;
  diagnosis?: string;
  notes?: string;
  [key: string]: any;
}

export default function PatientHistory() {
  const { patient_code } = useParams<{ patient_code: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patient_code) return;
    setLoading(true);
    setError("");
    getPatientHistory(patient_code)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.history ?? data.records ?? [];
        setHistory(list);
      })
      .catch((err: any) => setError(err.message || "Failed to load patient history"))
      .finally(() => setLoading(false));
  }, [patient_code]);

  const getRiskVariant = (level?: string): "default" | "destructive" | "secondary" | "outline" => {
    if (!level) return "secondary";
    const l = level.toLowerCase();
    if (l === "high") return "destructive";
    if (l === "moderate") return "outline";
    return "secondary";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/patients")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patient History</h1>
            <p className="text-muted-foreground">
              Patient Code: <span className="font-mono font-semibold">{patient_code}</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-500">{error}</p>}

        {/* Table */}
        <div className="clinical-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">#</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Risk Level</TableHead>
                <TableHead className="font-semibold">Probability</TableHead>
                <TableHead className="font-semibold">EEG Quality</TableHead>
                <TableHead className="font-semibold">Diagnosis</TableHead>
                <TableHead className="font-semibold">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Loading history...
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No history records found for this patient.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry, idx) => (
                  <TableRow key={entry.id ?? idx} className="data-row">
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>{formatDate(entry.report_date ?? entry.created_at)}</TableCell>
                    <TableCell>
                      {entry.risk_level ? (
                        <Badge variant={getRiskVariant(entry.risk_level)}>
                          {entry.risk_level.charAt(0).toUpperCase() + entry.risk_level.slice(1)}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.probability != null ? `${entry.probability}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {entry.eeg_quality != null ? `${entry.eeg_quality}%` : "—"}
                    </TableCell>
                    <TableCell>{entry.diagnosis ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{entry.notes ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
