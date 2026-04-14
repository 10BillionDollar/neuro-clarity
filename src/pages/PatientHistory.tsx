import { useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getPatientHistory } from "@/app/patients";
import { ArrowLeft, Clock, ChevronDown, ChevronRight, TrendingUp, Activity, Brain, Eye } from "lucide-react";

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
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const toggleRowExpansion = (rowId: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

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
  }, [searchTerm]);

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
              Patient Code: <span className="font-mono font-semibold text-foreground">{patient_code}</span>
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
          <div className="border-b border-border/70 bg-background/80 px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search records, filename, risk band..."
              className="max-w-sm"
            />
            <p className="text-sm text-muted-foreground">Showing {currentHistory.length} of {filteredHistory.length} records</p>
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
                      <TableHead className="font-semibold">Filename</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Risk Band</TableHead>
                      <TableHead className="font-semibold">Risk %</TableHead>
                      <TableHead className="font-semibold">Brain Health</TableHead>
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
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground truncate block max-w-[200px] overflow-hidden text-ellipsis cursor-help">
                                    {entry.file_name ?? "No report file"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-md break-all">
                                  {entry.file_name ?? "No report file"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{formatDate(entry.report_date ?? entry.created_at)}</TableCell>
                          <TableCell>
                            {entry.risk_band ? (
                              <Badge variant={getRiskBadgeVariant(entry.risk_band)} className="font-medium">
                                {entry.risk_band}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.risk_percent != null ? (
                              <Badge variant={getQualityBadgeVariant(entry.risk_percent)} className={`font-semibold }`}>
                                {entry.risk_percent.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {entry.internal_brain_health_score != null ? (
                              <Badge variant={entry.internal_brain_health_score >= 7 ? "default" : entry.internal_brain_health_score >= 4 ? "secondary" : "destructive"} className="font-medium">
                                {entry.internal_brain_health_score}/10
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRowExpansion(rowId)}
                              className="h-9 w-9 p-0"
                            >
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );

                      const detailRow = isExpanded ? (
                        <TableRow key={`${rowId}-detail`} className="bg-muted/20">
                          <TableCell colSpan={6} className="p-0">
                            <div className="border-t border-border px-6 py-6">
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="detailed-analysis" className="border-none">
                                  <AccordionTrigger className="px-0 py-0 hover:no-underline">
                                    <div className="flex items-center gap-2 pb-4">
                                      <Brain className="h-4 w-4" />
                                      <span className="font-medium">Detailed Analysis & Metrics</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="px-0 pb-0">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                      <div className="space-y-4">
                                        <h4 className="font-medium text-foreground flex items-center gap-2">
                                          <Activity className="h-4 w-4" />
                                          Technical Metrics
                                        </h4>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Alpha Peak Gradient</span>
                                            {entry.alpha_peak_gradient != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {entry.alpha_peak_gradient.toFixed(2)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">CLI</span>
                                            {entry.cli != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {parseInt(entry.cli)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Entropy Gradient</span>
                                            {entry.entropy_gradient != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {entry.entropy_gradient.toFixed(2)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Occipital Entropy</span>
                                            {entry.occipital_entropy != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {entry.occipital_entropy.toFixed(2)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Posterior Dominance Index</span>
                                            {entry.posterior_dominance_index != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {entry.posterior_dominance_index.toFixed(2)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <h4 className="font-medium text-foreground flex items-center gap-2">
                                          <TrendingUp className="h-4 w-4" />
                                          AI Probabilities
                                        </h4>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">DL Probability</span>
                                            {entry.dl_probability != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {(entry.dl_probability * 100).toFixed(1)}%
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Fusion Probability</span>
                                            {entry.fusion_probability != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {(entry.fusion_probability * 100).toFixed(1)}%
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">ML Probability</span>
                                            {entry.ml_probability != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {(entry.ml_probability * 100).toFixed(1)}%
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <h4 className="font-medium text-foreground">Additional Information</h4>
                                        <div className="space-y-3">
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Brain Health Score</span>
                                            {entry.internal_brain_health_score != null ? (
                                              <Badge variant={entry.internal_brain_health_score >= 7 ? "default" : entry.internal_brain_health_score >= 4 ? "secondary" : "destructive"} className="px-3 py-1.5 text-sm">
                                                {entry.internal_brain_health_score}/10
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">NIS</span>
                                            {entry.nis != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {parseInt(entry.nis)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">PCR</span>
                                            {entry.pcr != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {parseInt(entry.pcr)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                          <div className="flex justify-between items-center gap-4 p-3 bg-background rounded-lg border">
                                            <span className="text-sm font-medium">Theta Alpha Ratio</span>
                                            {entry.theta_alpha_ratio_frontal != null ? (
                                              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                                                {entry.theta_alpha_ratio_frontal.toFixed(3)}
                                              </Badge>
                                            ) : (
                                              <span className="text-muted-foreground">—</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null;

                      return [mainRow, detailRow];
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
    </MainLayout>
  );
}
