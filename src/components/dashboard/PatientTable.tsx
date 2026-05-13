import { Eye, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { getPatientHistory } from "@/app/patients";
import { usePatients } from "@/app/PatientContext";

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
  const { patients: contextPatients, loading: patientsLoading } = usePatients();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const isDateInRange = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true;
    try {
      const date = new Date(dateStr);
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const filteredPatients = patients.filter((patient) => {
    // Date range filter
    if (!isDateInRange(patient.latestEEGDate)) return false;

    // Search filter
    if (!normalizedSearch) return true;
    return [
      patient.name,
      patient.patient_code,
      patient.gender,
      patient.latestEEGDate,
      patient.latestRiskLevel,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const pageCount = Math.max(1, Math.ceil(filteredPatients.length / pageSize));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  useEffect(() => {
    if (page > Math.ceil(filteredPatients.length / pageSize)) {
      setPage(1);
    }
  }, [searchTerm, fromDate, toDate, filteredPatients.length, pageSize])

  const currentPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const processPatients = async () => {
      if (propPatients) {
        setPatients(propPatients);
        setLoading(false);
        return;
      }

      const patientList = contextPatients;

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
      setLoading(false);
    };

    if (!patientsLoading) {
      processPatients();
    }
  }, [propPatients, contextPatients, patientsLoading]);

  return (
    <div className="clinical-card overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-lg font-semibold text-foreground">Recent Patient Screenings</h3>
        <p className="text-sm text-muted-foreground">Latest EEG screenings and patient information</p>
      </div>
      <div className="border-b border-border/70 bg-background/80 px-4 py-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patients, ID, screening..."
            className="max-w-sm"
          />
          <p className="text-sm text-muted-foreground">Showing {currentPatients.length} of {filteredPatients.length} patients</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DateRangePicker
            label="Screening date range"
            range={dateRange}
            onRangeChange={setDateRange}
            onClear={() => setDateRange({})}
            placeholder="Choose a date range"
            className="sm:col-span-2 lg:col-span-3"
          />
        </div>
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
          ) : filteredPatients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No matching patients found
              </TableCell>
            </TableRow>
          ) : (
            currentPatients.map((patient, index) => (
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
      {pageCount > 1 && !loading && (
        <div className="border-t border-border/70 bg-background/80 px-4 py-3">
          <Pagination>
            <PaginationPrevious
              onClick={(event) => {
                event.preventDefault();
                setPage((prev) => Math.max(1, prev - 1));
              }}
            />
            <PaginationContent>
              {Array.from({ length: pageCount }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            </PaginationContent>
            <PaginationNext
              onClick={(event) => {
                event.preventDefault();
                setPage((prev) => Math.min(pageCount, prev + 1));
              }}
            />
          </Pagination>
        </div>
      )}
    </div>
  );
}
 
