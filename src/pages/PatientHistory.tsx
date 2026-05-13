import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate,useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/app/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getPatientById, getPatientHistory } from "@/app/patients";
import { getRiskBadgeVariantFromPercentage, getRiskLevelFromPercentage, getRiskLevelText } from "@/lib/riskUtils";
import { API_BASE_URL } from "@/app/config";
import { downloadPrescription, getPrescriptionData, getFileExtension } from "@/app/reports";
import { ArrowLeft, Clock, ChevronDown, ChevronRight, TrendingUp, Activity, Brain, Eye, TrendingDown, Minus, Download, FileText, Loader2 } from "lucide-react";

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
  prescription_path?: string;
  prescription_url?: string;
  [key: string]: any;
}

export default function PatientHistory() {
  const { patient_code } = useParams<{ patient_code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const location = useLocation();
  const patienData = location.state?.patient;
  
  // Modal state for prescription view
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState<{ url: string; blob: Blob; fileName: string; textContent?: string } | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [downloadingPrescriptionId, setDownloadingPrescriptionId] = useState<string | number | null>(null);
  const parseDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;
    try {
      // Handle different date formats
      let date: Date;
      
      // Try parsing as ISO date first
      if (dateStr.includes('T') || dateStr.includes('-')) {
        date = new Date(dateStr);
      } else {
        // Try parsing as DD/MM/YYYY or other formats
        const parts = dateStr.split(/[/\-.]/);
        if (parts.length === 3) {
          // Try DD/MM/YYYY
          if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            date = new Date(dateStr);
          }
        } else {
          date = new Date(dateStr);
        }
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) return null;
      
      return date;
    } catch {
      return null;
    }
  };

  const isDateInRange = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false; // Return false for undefined dates to exclude them
    const date = parseDate(dateStr);
    if (!date) return false;

    // Normalize dates to compare only date parts (not time)
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
      if (compareDate < fromDate) return false;
    }
    
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
      if (compareDate > toDate) return false;
    }
    
    return true;
  };

  const getTrendIcon = (current: number, previous: number | undefined, lowerIsBetter: boolean = false) => {
  if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const increased = current > previous;
  const isGood = lowerIsBetter ? !increased : increased;
  
  if (current === previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  return increased ? (
    <TrendingUp className={`h-4 w-4 ${isGood ? "text-risk-low" : "text-risk-high"}`} />
  ) : (
    <TrendingDown className={`h-4 w-4 ${isGood ? "text-risk-low" : "text-risk-high"}`} />
  );
};

const toggleRowExpansion = (rowId: string | number) => {
  //  console.log(rowId,"rowId")
  navigate(`/report/${rowId}`, { state: { patientCode: patient_code, reportId: rowId, fromPatientHistory: true } });
  };

const handleDownload = async (entry: HistoryEntry) => {
  // Use the result ID for the API call
  const resultId = entry.result_id;
  
  if (!resultId) {
    alert('No result ID available for download');
    return;
  }

  // Set loading state for this specific prescription
  setDownloadingPrescriptionId(resultId);

  try {
    // Use the new API endpoint for prescription download
    const { url, blob } = await downloadPrescription(resultId);
    
    // Detect file type from MIME type
    const getFileExtension = (mimeType: string): string => {
      const mimeTypes: { [key: string]: string } = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'text/plain': 'txt',
        'text/html': 'html',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'image/tiff': 'tiff',
        'image/bmp': 'bmp',
        'image/gif': 'gif'
      };
      return mimeTypes[mimeType] || 'pdf'; // default to pdf if unknown
    };
    
    const fileExtension = getFileExtension(blob.type);
    const fileName = `prescription_${resultId}.${fileExtension}`;
    
    // Create download link
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log(`Prescription downloaded successfully: ${fileName} (${blob.type})`);
  } catch (error) {
    console.error('Error downloading prescription:', error);
    alert('Failed to download prescription: ' + (error as Error).message);
  } finally {
    // Clear loading state
    setDownloadingPrescriptionId(null);
  }
};

  const handlePrescriptionView = async (entry: HistoryEntry) => {
    // Check if prescription has direct URL available
    if (entry.prescription_url) {
      // Open directly in new tab without API call
      window.open(entry.prescription_url, '_blank');
      return;
    }
    
    // If no direct URL, check if prescription path exists
    if (entry.prescription_path) {
      // Construct full URL from prescription path
      const fullUrl = `${API_BASE_URL}/${entry.prescription_path}`;
      window.open(fullUrl, '_blank');
      return;
    }
    
    // Fallback to API call if no direct URL available
    const resultId = entry.result_id;
    
    if (!resultId) {
      alert('No result ID available for viewing');
      return;
    }

    setPrescriptionLoading(true);
    setPrescriptionModalOpen(true);

    try {
      // Use the new API endpoint for prescription download
      const { url, blob } = await downloadPrescription(resultId);
      
      // Detect file type from MIME type
      const getFileExtension = (mimeType: string): string => {
        const mimeTypes: { [key: string]: string } = {
          'application/pdf': 'pdf',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'text/plain': 'txt',
          'text/html': 'html',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
          'image/tiff': 'tiff',
          'image/bmp': 'bmp',
          'image/gif': 'gif'
        };
        return mimeTypes[mimeType] || 'pdf';
      };
      
      const fileExtension = getFileExtension(blob.type);
      const fileName = `prescription_${resultId}.${fileExtension}`;
      
      // Get text content for text files
      let textContent;
      if (blob.type.startsWith('text/')) {
        textContent = await blob.text();
      }
      
      setCurrentPrescription({ url, blob, fileName, textContent });
    } catch (error) {
      console.error('Error viewing prescription:', error);
      alert('Failed to view prescription: ' + (error as Error).message);
      setPrescriptionModalOpen(false);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleDownloadFromModal = () => {
    if (!currentPrescription) return;
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = currentPrescription.url;
    a.download = currentPrescription.fileName;
    
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(currentPrescription.url);
    document.body.removeChild(a);
    
    console.log(`Prescription downloaded: ${currentPrescription.fileName}`);
  };

  // console.log(,"navigate")

  useEffect(() => {
    if (!patient_code) return;
    setLoading(true);
    setError("");

    const loadHistory = getPatientHistory(patient_code)
      .then((data) => {
        const list = Array.isArray(data) ? data : data.history ?? data.records ?? [];

// console.log(list,"list")
        setHistory(list);
      });

    const loadPatient = getPatientById(patient_code)
      .then((patient) => {
        const name = patient?.name || patient?.patient?.name || patient?.full_name || "";
        setPatientName(name);
      })
      .catch(() => {
        // ignore patient name errors
      });

    Promise.all([loadHistory, loadPatient])
      .catch((err) => setError(err.message || "Failed to load patient history"))
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
      const date = new Date(dateStr);
      const hasTime = /[T ]\d{2}:\d{2}/.test(dateStr);
      const baseOptions: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
      };

      if (hasTime) {
        return date.toLocaleString("en-IN", {
          ...baseOptions,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }

      return date.toLocaleDateString("en-IN", baseOptions);
    } catch {
      return dateStr;
    }

  };

  const getQualityBadgeVariant = (quality: any) => {
  if (quality == null) return "secondary";
  const score = Number(quality);
  if (score >= 70) return "qualityGood";
  if (score >= 40) return "qualityFair";
  return "qualityPoor";
};
const getRiskBadgeVariant = (level: any) => {
  if (!level) return "secondary";
  const l = String(level).toLowerCase();
  if (l.includes("high")) return "riskHigh";
  if (l.includes("moderate")) return "riskModerate";
  if (l.includes("low")) return "riskLow";
  return "secondary";
};

  const normalizedSearch = searchTerm.toLowerCase().trim();
  const filteredHistory = history.filter((entry) => {
    // Date range filter - only apply if date range is set
    if (dateRange?.from || dateRange?.to) {
      const dateField = entry.report_date || entry.created_at;
      if (!isDateInRange(dateField)) return false;
    }

    // Search filter
    if (!normalizedSearch) return true;
    return [
      entry.file_name,
      entry.risk_band,
      entry.risk_level,
      entry.notes,
      entry.patient_code,
      entry.created_at,
      entry.report_date,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

  const pageCount = Math.max(1, Math.ceil(filteredHistory.length / pageSize));

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, dateRange]);

  const currentHistory = filteredHistory.slice((page - 1) * pageSize, page * pageSize);

  const pageItems = () => {
    const items: ReactNode[] = [];
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

  return (

    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/patients")} className="flex items-center gap-2 self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Patient History</h1>
            <p className="text-muted-foreground">
              {patienData ? (
                <span>Patient: <span className="font-medium text-foreground">{patienData.name}</span> · </span>
              ) : null}
              Code: <span className="font-mono font-semibold text-foreground">{patient_code}</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="clinical-card overflow-hidden border border-border/70 shadow-sm relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center z-50 rounded-lg backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
                </div>
                <p className="text-sm text-muted-foreground font-medium">Loading patient history...</p>
              </div>
            </div>
          )}
          <div className="border-b border-border/70 bg-muted/80 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Screening Records</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  Complete history of patient screenings and results. Review patient screening summaries, risk metrics, and report access in one clean view.
                  {!loading && filteredHistory.length > 0 && (
                    <span className="ml-2 font-medium text-foreground">({filteredHistory.length} records)</span>
                  )}
                </p>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground">
                Expand any row for full report details
              </div>
            </div>
          </div>
          <div className="border-b border-border/70 bg-background/80 px-6 py-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search records, filename, risk band..."
                className="max-w-sm"
              />
              <p className="text-sm text-muted-foreground">Showing {currentHistory.length} of {filteredHistory.length} records</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DateRangePicker
                label="Record date range"
                range={dateRange}
                onRangeChange={setDateRange}
                onClear={() => setDateRange(undefined)}
                placeholder="Choose date range"
                className="sm:col-span-2 lg:col-span-3"
              />
            </div>
          </div>

          <div className="mt-4">
            {!loading && history.length === 0 ? (
              <div className="clinical-card p-12">
                <div className="flex flex-col items-center gap-4">
                  <Clock className="h-16 w-16 text-muted-foreground/50" />
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No Screening History Found</h3>
                    <p className="text-sm text-muted-foreground">This patient doesn't have any screening records yet.</p>
                  </div>
                </div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="clinical-card p-12">
                <div className="flex flex-col items-center gap-4">
                  <Clock className="h-16 w-16 text-muted-foreground/50" />
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No Matching Records</h3>
                    <p className="text-sm text-muted-foreground">Try adjusting the search term to find history records.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden  border border-border/70 shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/80">
                    <TableRow>
                      <TableHead className="font-semibold">S.No.</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Risk Score</TableHead>
                      <TableHead className="font-semibold">Risk Level</TableHead>
                      {/* <TableHead className="font-semibold">Brain Age</TableHead> */}
                      <TableHead className="font-semibold">PDR (Hz)</TableHead>
                      <TableHead className="font-semibold">CDI</TableHead>
                      <TableHead className="font-semibold">Quality</TableHead>
                      <TableHead className="font-semibold">Prescription</TableHead>
                      <TableHead className="font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.flatMap((entry, idx) => {
                      const rowId = String(entry.id ?? `row-${idx}`);
                      const isExpanded = expandedRows.has(rowId);

                      const mainRow = (
                        <TableRow key={rowId} className="border-b transition-colors hover:bg-muted/50">
                          <TableCell>
                            {idx + 1 + (page - 1) * pageSize}
                          </TableCell>
                          <TableCell>{formatDate(entry.report_date ?? entry.created_at)}</TableCell>
                          <TableCell>
                            {entry.risk_percent != null ? (
                              <Badge variant={getRiskBadgeVariantFromPercentage(entry.risk_percent)} className="font-medium">
                                {getRiskLevelText(entry.risk_percent)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.risk_percent != null ? (
                              <div className="flex items-center gap-2">
                                <Badge variant={getRiskBadgeVariantFromPercentage(entry.risk_percent)} className="font-semibold">
                                  {entry.risk_percent.toFixed(1)}%
                                </Badge>
                                {/* {getTrendIcon(entry.risk_percent, currentHistory[idx + 1]?.risk_percent)} */}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          {/* <TableCell>
                            {entry.brain_age != null ? (
                              <div className="flex items-center gap-2">
                                <span>{entry.brain_age}</span>
                                {getTrendIcon(entry.brain_age, currentHistory[idx + 1]?.brain_age, true)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell> */}
                          <TableCell>
                            {entry.pcr != null ? (
                              <div className="flex items-center gap-2">
                                <span>{entry.pcr} Hz</span>
                                {/* {getTrendIcon(entry.pcr, currentHistory[idx + 1]?.pcr, true)} */}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.cli != null ? (
                              <div className="flex items-center gap-2">
                                <span>{parseInt(entry.cli)}</span>
                                {/* {getTrendIcon(entry.cli, currentHistory[idx + 1]?.cli, false)} */}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.quality_score != null ? (
                              <div className="flex items-center gap-2">
                                <Badge variant={entry.quality_score >= 70 ? "qualityGood" : entry.quality_score >= 40 ? "qualityFair" : "qualityPoor"} className="font-semibold">
                                  {entry.quality_score}%
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                          {/* {JSON.stringfy(v)} */}
                            {/* {entry.prescription_path} */}
                            
                            {(entry.prescription_path || entry.prescription_url || entry.prescription || entry.prescription_file) ? (
                              <div className="flex items-center gap-2">
                                 <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePrescriptionView(entry)}
                                    className="h-9 w-9 p-0"
                                    title="ViewPrescription"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(entry)}
                                    className="h-9 w-9 p-0"
                                    title="Download Prescription"
                                    disabled={downloadingPrescriptionId === entry.result_id}
                                  >
                                    {downloadingPrescriptionId === entry.result_id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                           
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRowExpansion(entry.result_id)}
                                className="h-9 w-9 p-0"
                                title="View Details"
                              >
                                {<ChevronRight className="h-4 w-4" />}
                              </Button>
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/longitudinal/${patient_code}`)}
                                title="View Longitudinal Trends"
                              >
                                <TrendingUp className="mr-1 h-4 w-4" />
                                Trends
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/patient-report/${patient_code}`, { state: { patient: patienData } })}
                                title="View Patient Report"
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                Report
                              </Button> */}
                            </div>
                          </TableCell>
                        </TableRow>
                      );

                      // const detailRow = isExpanded ? (
                      //   <TableRow key={`${rowId}-detail`} className="bg-muted/20">
                      //     <TableCell colSpan={6} className="p-0">
                      //       <div className="border-t border-border px-6 py-6">
                      //         <div className="flex items-center gap-2 pb-4">
                      //           <Brain className="h-4 w-4" />
                      //           <span className="font-medium">Detailed Analysis & Metrics</span>
                      //         </div>
                      //         <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                      //           <div className="space-y-4">
                      //             <h4 className="font-medium text-foreground flex items-center gap-2">
                      //               <Activity className="h-4 w-4" />
                      //               Technical Metrics
                      //             </h4>
                      //             <div className="space-y-3">
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Alpha Peak Gradient</span>
                      //                 {entry.alpha_peak_gradient != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {entry.alpha_peak_gradient.toFixed(2)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">CLI</span>
                      //                 {entry.cli != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {parseInt(entry.cli)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Entropy Gradient</span>
                      //                 {entry.entropy_gradient != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {entry.entropy_gradient.toFixed(2)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Occipital Entropy</span>
                      //                 {entry.occipital_entropy != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {entry.occipital_entropy.toFixed(2)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Posterior Dominance Index</span>
                      //                 {entry.posterior_dominance_index != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {entry.posterior_dominance_index.toFixed(2)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //             </div>
                      //           </div>

                      //           <div className="space-y-4">
                      //             <h4 className="font-medium text-foreground flex items-center gap-2">
                      //               <TrendingUp className="h-4 w-4" />
                      //               AI Probabilities
                      //             </h4>
                      //             <div className="space-y-3">
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">DL Probability</span>
                      //                 {entry.dl_probability != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {(entry.dl_probability * 100).toFixed(1)}%
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Fusion Probability</span>
                      //                 {entry.fusion_probability != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {(entry.fusion_probability * 100).toFixed(1)}%
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">ML Probability</span>
                      //                 {entry.ml_probability != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {(entry.ml_probability * 100).toFixed(1)}%
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //             </div>
                      //           </div>

                      //           <div className="space-y-4">
                      //             <h4 className="font-medium text-foreground">Additional Information</h4>
                      //             <div className="space-y-3">
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Brain Health Score</span>
                      //                 {entry.internal_brain_health_score != null ? (
                      //                   <Badge variant={entry.internal_brain_health_score >= 7 ? "default" : entry.internal_brain_health_score >= 4 ? "secondary" : "destructive"} className="px-3 py-1.5 text-sm">
                      //                     {entry.internal_brain_health_score}/10
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">NIS</span>
                      //                 {entry.nis != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {parseInt(entry.nis)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">PCR</span>
                      //                 {entry.pcr != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {parseInt(entry.pcr)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //               <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                      //                 <span className="text-sm font-medium">Theta Alpha Ratio</span>
                      //                 {entry.theta_alpha_ratio_frontal != null ? (
                      //                   <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                      //                     {entry.theta_alpha_ratio_frontal.toFixed(3)}
                      //                   </Badge>
                      //                 ) : (
                      //                   <span className="text-muted-foreground">—</span>
                      //                 )}
                      //               </div>
                      //             </div>
                      //           </div>
                      //         </div>
                      //       </div>
                      //     </TableCell>
                      //   </TableRow>
                      // ) : null;

                      return [mainRow];
                    })}
                  </TableBody>
                </Table>
                {pageCount > 1 && !loading && (
                  <div className="border-t border-border/70 bg-background/80 px-6 py-3">
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
            )}
          </div>
        </div>
      </div>

      {/* Prescription View Modal */}
      <Dialog open={prescriptionModalOpen} onOpenChange={setPrescriptionModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Prescription View</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            {prescriptionLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading prescription...</div>
              </div>
            ) : currentPrescription ? (
              <>
             
                <div className="border rounded-lg overflow-hidden max-w-full max-h-[70vh]">
                  {currentPrescription.blob.type.startsWith('image/') ? (
                    <img 
                      src={currentPrescription.url} 
                      alt="Prescription" 
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  ) : currentPrescription.blob.type === 'application/pdf' ? (
                    <iframe 
                      src={currentPrescription.url} 
                      className="w-full h-[70vh]"
                      title="Prescription PDF"
                    />
                  ) : currentPrescription.blob.type.startsWith('text/') ? (
                    <div className="p-4 bg-gray-50 max-h-[70vh] overflow-auto">
                      <pre className="whitespace-pre-wrap text-sm">{currentPrescription.textContent || 'No text content available'}</pre>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-4">
                        This file type ({currentPrescription.blob.type}) cannot be previewed.
                      </p>
                      <Button onClick={handleDownloadFromModal}>
                        Download to view
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
