import { Eye, TrendingUp, Pencil, Trash2, Plus, History } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPatientHistory } from "@/app/patients";

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  latestEEGDate?: string;
  latestEEGQuality?: string;
  latestRiskLevel?: string;
  latestProbability?: number;
}

interface ReportTableProps {
  patients: Patient[];
  selectedPatientId?: string;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patientCode: string) => void;
  onAddPatient?: () => void;
}


const getRiskBadgeVariant = (level: any) => {
  if (!level) return "secondary";
  const l = String(level).toLowerCase();
  if (l.includes("high")) return "riskHigh";
  if (l.includes("moderate")) return "riskModerate";
  if (l.includes("low")) return "riskLow";
  return "secondary";
};


const getQualityBadgeVariant = (quality: any) => {
  if (!quality) return "secondary";
  const score = String(quality).toLowerCase();
  if (score.includes("good") || score.includes("excellent")) return "qualityGood";
  if (score.includes("fair") || score.includes("moderate")) return "qualityFair";
  return "qualityPoor";
};

export function ReportTable({ patients, selectedPatientId, onEditPatient, onDeletePatient, onAddPatient }: ReportTableProps) {
  const navigate = useNavigate();
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleViewHistory = async (patient: Patient) => {
    setSelectedPatientForHistory(patient);
    setLoadingHistory(true);
    setHistoryDialogOpen(true);

    try {
      const history = await getPatientHistory(patient.patient_code);
      setPatientHistory(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      setPatientHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // merge paitent and patient history data to show in the table, with patient data taking precedence


  return (
    <div className="clinical-card overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Patient Management & Screenings</h3>
          <p className="text-sm text-muted-foreground">Manage patients and view their screening reports</p>
        </div>
        {onAddPatient && (
          <Button onClick={onAddPatient} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        )}
      </div>
      

        <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Patient Name</TableHead>
                  <TableHead className="font-semibold">Age / Sex</TableHead>
                  <TableHead className="font-semibold">Risk Percentage</TableHead>
                  <TableHead className="font-semibold">Risk Level</TableHead>
                  <TableHead className="font-semibold">Probability</TableHead>
                  <TableHead className="font-semibold">Last Screening</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                { patients?.map((patient, index) => (
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
                      {patient?.risk_percent ? (
                        <Badge variant={getQualityBadgeVariant(patient?.risk_percent)}>
                          {parseInt(patient?.risk_percent)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.risk_band ? (
                        <Badge variant={getRiskBadgeVariant(patient.risk_band)}>
                          {patient.risk_band.charAt(0).toUpperCase() + patient.risk_band.slice(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.latestProbability !== undefined ? (
                        <span className={`font-semibold ${
                          patient.latestProbability >= 70 ? "text-risk-high" :
                          patient.latestProbability >= 40 ? "text-risk-moderate" :
                          "text-risk-low"
                        }`}>
                          {patient.latestProbability}%
                        </span>
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
                          onClick={() => handleViewHistory(patient)}
                          title="View Screening History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        {onEditPatient && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEditPatient(patient)}
                            title="Edit Patient"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeletePatient && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => onDeletePatient(patient.patient_code)}
                            title="Delete Patient"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/report/${patient.patient_code}`)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/longitudinal/${patient.patient_code}`)}
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
      
      {/* Patient History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Screening History - {selectedPatientForHistory?.name} ({selectedPatientForHistory?.patient_code})
            </DialogTitle>
            <DialogDescription>
              Complete screening history and results for this patient
            </DialogDescription>
          </DialogHeader>
          
          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading history...</div>
            </div>
          ) : patientHistory.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">No screening history found</div>
            </div>
          ) : (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">File Name</TableHead>
                    <TableHead className="font-semibold">Patient Code</TableHead>
                    <TableHead className="font-semibold">EEG Quality</TableHead>
                    <TableHead className="font-semibold">Risk Level</TableHead>
                    <TableHead className="font-semibold">Risk Band</TableHead>
                    <TableHead className="font-semibold">Probability</TableHead>
                    <TableHead className="font-semibold">Risk Percent</TableHead>
                    <TableHead className="font-semibold">Score</TableHead>
                    <TableHead className="font-semibold">Alpha Peak Gradient</TableHead>
                    <TableHead className="font-semibold">CLI</TableHead>
                    <TableHead className="font-semibold">DL Probability</TableHead>
                    <TableHead className="font-semibold">Entropy Gradient</TableHead>
                    <TableHead className="font-semibold">Fusion Probability</TableHead>
                    <TableHead className="font-semibold">Hospital ID</TableHead>
                    <TableHead className="font-semibold">ML Probability</TableHead>
                    <TableHead className="font-semibold">NIS</TableHead>
                    <TableHead className="font-semibold">Occipital Entropy</TableHead>
                    <TableHead className="font-semibold">PCR</TableHead>
                    <TableHead className="font-semibold">Posterior Dominance Index</TableHead>
                    <TableHead className="font-semibold">Theta Alpha Ratio Frontal</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patientHistory.map((record: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {record.date ? new Date(record.date).toLocaleDateString() : 
                         record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getQualityBadgeVariant(record.quality || record.eeg_quality)}>
                          {record.quality || record.eeg_quality || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRiskBadgeVariant(record.risk_level || 'low')}>
                          {record.risk_level ? record.risk_level.charAt(0).toUpperCase() + record.risk_level.slice(1) : 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${
                          record.probability >= 70 ? "text-risk-high" :
                          record.probability >= 40 ? "text-risk-moderate" :
                          "text-risk-low"
                        }`}>
                          {record.probability ? `${record.probability}%` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                          {record.status || 'completed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/report/${record.job_id || record.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}