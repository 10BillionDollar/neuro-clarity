import { Eye, TrendingUp, Pencil, Trash2, Plus, History, Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useState, useEffect, type ReactNode } from "react";
import { getPatientHistory } from "@/app/patients";
import { getRiskBadgeVariant, getRiskTextColorClass, getRiskBadgeVariantFromPercentage, getRiskLevelFromPercentage } from "@/lib/riskUtils";
import { API_BASE_URL } from "@/app/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  latestEEGDate?: string;
  latestEEGQuality?: string;
  latestRiskLevel?: string;
  latestProbability?: number;
  risk_band?: string;
  risk_percent?: number;
  prescription_path?: string;
  prescription_url?: string;
}

interface ReportTableProps {
  patients: Patient[];
  selectedPatientId?: string;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patientCode: string) => void;
  onAddPatient?: () => void;
  loading?: boolean;
}


const getQualityBadgeVariant = (quality: any) => {
  if (quality == null) return "secondary";
  const score = Number(quality);
  if (score >= 70) return "qualityGood";
  if (score >= 40) return "qualityFair";
  return "qualityPoor";
};

const PATIENTS_SESSION_KEY = "patientTableData";

export function ReportTable({ patients, selectedPatientId, onEditPatient, onDeletePatient, onAddPatient, loading = false }: ReportTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [page, setPage] = useState(1);
  const [cachedPatients, setCachedPatients] = useState<Patient[]>(patients ?? []);
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

  useEffect(() => {
    if (patients.length > 0) {
      setCachedPatients(patients);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PATIENTS_SESSION_KEY, JSON.stringify(patients));
      }
      return;
    }

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(PATIENTS_SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Patient[];
          if (Array.isArray(parsed)) {
            setCachedPatients(parsed);
          }
        } catch {
          sessionStorage.removeItem(PATIENTS_SESSION_KEY);
        }
      }
    }
  }, [patients, loading]);

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const allPatients = cachedPatients ?? [];
  const filteredPatients = allPatients.filter((patient) => {
    // Date range filter
    if (!isDateInRange(patient.latestEEGDate)) return false;

    // Search filter
    if (!normalizedSearch) return true;
    return [
      patient.name,
      patient.patient_code,
      patient.risk_band,
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
    setPage(1);
  }, [searchTerm, dateRange]);

  const currentPatients = filteredPatients.slice((page - 1) * pageSize, page * pageSize);

  const pageItems = () => {
    const items = [] as ReactNode[];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i += 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === page}
              onClick={(event) => {
                event.preventDefault();
                setPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
    } else {
      const left = Math.max(2, page - 1);
      const right = Math.min(pageCount - 1, page + 1);
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={page === 1}
            onClick={(event) => {
              event.preventDefault();
              setPage(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>,
      );
      if (left > 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
      for (let i = left; i <= right; i += 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === page}
              onClick={(event) => {
                event.preventDefault();
                setPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>,
        );
      }
      if (right < pageCount - 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }
      items.push(
        <PaginationItem key={pageCount}>
          <PaginationLink
            isActive={page === pageCount}
            onClick={(event) => {
              event.preventDefault();
              setPage(pageCount);
            }}
          >
            {pageCount}
          </PaginationLink>
        </PaginationItem>,
      );
    }
    return items;
  };

  // merge paitent and patient history data to show in the table, with patient data taking precedence

  const handlePrescriptionDownload = async (patient: Patient) => {
    const prescriptionUrl = patient.prescription_url || patient.prescription_path;
    if (!prescriptionUrl) {
      console.error('No prescription URL available');
      return;
    }

    try {
      let fullUrl: string;
      let response: Response;

      if (prescriptionUrl.startsWith('http') && prescriptionUrl.includes('storage.googleapis.com')) {
        // For Google Cloud Storage, use backend proxy to avoid CORS
        console.log('Using backend proxy for Google Cloud Storage URL');
        fullUrl = `${API_BASE_URL}/proxy-download?url=${encodeURIComponent(prescriptionUrl)}`;
        response = await fetchWithAuth(fullUrl);
      } else if (prescriptionUrl.startsWith('http')) {
        // For other external URLs, try direct fetch first
        console.log('Attempting direct download from external URL');
        fullUrl = prescriptionUrl;
        response = await fetch(fullUrl);
      } else {
        // For relative paths, use authenticated fetch
        fullUrl = `${API_BASE_URL}/${prescriptionUrl.replace(/^\//, '')}`;
        response = await fetchWithAuth(fullUrl);
      }
      
      console.log('Prescription download from:', fullUrl);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Prescription download failed:', errorText);
        throw new Error(`Failed to download prescription: ${response.status} ${errorText}`);
      }
      
      const blob = await response.blob();
      console.log('Prescription blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('Downloaded prescription file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${patient.patient_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('Prescription download completed successfully');
    } catch (error) {
      console.error('Error downloading prescription:', error);
      
      // Fallback: open in new tab
      try {
        if (prescriptionUrl && prescriptionUrl.startsWith('http')) {
          console.log('Fallback: opening prescription in new tab');
          window.open(prescriptionUrl, '_blank');
          alert('Prescription opened in new tab. Please save it manually.');
        } else {
          throw error;
        }
      } catch (fallbackError) {
        alert(`Prescription download failed: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handlePrescriptionView = (patient: Patient) => {
    const prescriptionUrl = patient.prescription_url || patient.prescription_path;
    if (!prescriptionUrl) {
      console.error('No prescription URL available');
      return;
    }

    // If it's a relative path, construct full URL
    const fullUrl = prescriptionUrl.startsWith('http') 
      ? prescriptionUrl 
      : `${API_BASE_URL}/${prescriptionUrl.replace(/^\//, '')}`;
    
    // Open in new tab
    window.open(fullUrl, '_blank');
  };

  return (
    <div className="clinical-card overflow-hidden p-0 relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center z-50 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Loading patients...</p>
          </div>
        </div>
      )}
      <div className="border-b border-border/70 bg-muted/80 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Patient Screening Summary</h3>
          <p className="text-sm text-muted-foreground">Overview of patient risk and screening status with quick access to history and trends.</p>
        </div>
        {onAddPatient && (
          <Button onClick={onAddPatient} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        )}
      </div>
      <div className="border-b border-border/70 bg-background/80 px-4 py-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search patients, ID, risk band..."
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
                  <TableHead className="font-semibold">Age / Sex</TableHead>
                  <TableHead className="font-semibold">Risk Percentage</TableHead>
                  <TableHead className="font-semibold">Risk Level</TableHead>
                  {/* <TableHead className="font-semibold">Probability</TableHead> */}
                  <TableHead className="font-semibold">Last Screening</TableHead>
                  {/* <TableHead className="font-semibold">Prescription</TableHead> */}
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No matching patients found.
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium text-foreground inline-block w-full truncate cursor-help">
                                {patient.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs break-words">
                              {patient.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="text-xs text-muted-foreground">ID: {patient.patient_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.age} / {patient.gender}
                    </TableCell>
                    <TableCell>
                      {patient.risk_percent != null ? (
                        <Badge variant={getRiskBadgeVariantFromPercentage(patient.risk_percent)} className="font-semibold">
                          {patient.risk_percent.toFixed(2)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.risk_percent != null ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={getRiskBadgeVariantFromPercentage(patient.risk_percent)} className="max-w-[120px] truncate inline-block">
                                {getRiskLevelFromPercentage(patient.risk_percent).charAt(0).toUpperCase() + getRiskLevelFromPercentage(patient.risk_percent).slice(1)} Risk
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs break-words">
                              {getRiskLevelFromPercentage(patient.risk_percent).charAt(0).toUpperCase() + getRiskLevelFromPercentage(patient.risk_percent).slice(1)} Risk ({patient.risk_percent.toFixed(2)}%)
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.latestEEGDate ? new Date(patient.latestEEGDate).toLocaleDateString() : "No screening"}
                    </TableCell>
                                       <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(patient.prescription_path || patient.prescription_url) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrescriptionView(patient)}
                              className="h-9 w-9 p-0"
                              title="View Prescription"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrescriptionDownload(patient)}
                              className="h-9 w-9 p-0"
                              title="Download Prescription"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
                          onClick={() => navigate(`/patient-history/${btoa(encodeURIComponent(patient.patient_code))}`, { state: { patient } })}
                          title="View Screening History"
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/longitudinal/${encodeURIComponent(patient.patient_code)}`)}
                          title="View Longitudinal Trends"
                        >
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Trends
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
                    {pageItems()}
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