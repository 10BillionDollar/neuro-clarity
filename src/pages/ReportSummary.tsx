import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/ui/loader";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Brain,
  Calendar,
  Download,
  User,
  Activity,
  Heart,
  Leaf,
  AlertCircle,
  FileText,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// ---------- Types matching the new API ----------
type BiomarkerKey =
  | "frontal_theta_beta_ratio"
  | "memory_theta_alpha_ratio"
  | "cognitive_decline_index"
  | "gamma_activity_ratio"
  | "posterior_dominance_index"
  | "occipital_entropy";

interface Biomarker {
  value: number | string;
  status: string;
  clinical_significance: string;
}

interface ReportData {
  patient_information?: {
    patient_id?: string;
    age?: number | string;
    gender?: string;
    assessment_date?: string;
  };
  overall_assessment?: {
    risk_level?: string;
    cognitive_risk_score_percent?: number;
    summary?: string;
  };
  eeg_biomarkers?: Partial<Record<BiomarkerKey, Biomarker>>;
  clinical_interpretation?: {
    summary?: string[];
    affected_domains?: string[];
    possible_neural_regions?: string[];
  };
  key_neurophysiological_observations?: Array<{
    observation: string;
    interpretation: string;
    potential_implications?: string[];
  }>;
  recommended_followup?: {
    clinical_recommendations?: string[];
    purpose?: string;
  };
  lifestyle_and_preventive_recommendations?: {
    recommendations?: string[];
    mental_health_consideration?: string;
  };
  clinical_note?: {
    important_notice?: string;
    recommended_integration?: string[];
  };
  report_metadata?: {
    generated_at?: string;
    generated_by?: string;
    schema_version?: string;
  };
}

interface ApiResponse {
  status: "success" | "processing" | string;
  report_data?: ReportData;
}

// ---------- Fixed biomarker render order ----------
const BIOMARKER_ORDER: { key: BiomarkerKey; label: string }[] = [
  { key: "frontal_theta_beta_ratio", label: "Frontal Theta / Beta Ratio" },
  { key: "memory_theta_alpha_ratio", label: "Memory Theta / Alpha Ratio" },
  { key: "cognitive_decline_index", label: "Cognitive Decline Index" },
  { key: "gamma_activity_ratio", label: "Gamma Activity Ratio" },
  { key: "posterior_dominance_index", label: "Posterior Dominance Index" },
  { key: "occipital_entropy", label: "Occipital Entropy" },
];

const statusStyles = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("elevat") || s.includes("high") || s.includes("abnormal")) {
    return {
      badge: "bg-red-100 text-red-700 border-red-200",
      ring: "border-red-200 bg-red-50",
    };
  }
  if (s.includes("low") || s.includes("reduced")) {
    return {
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      ring: "border-amber-200 bg-amber-50",
    };
  }
  if (s.includes("normal") || s.includes("preserved")) {
    return {
      badge: "bg-green-100 text-green-700 border-green-200",
      ring: "border-green-200 bg-green-50",
    };
  }
  return {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    ring: "border-slate-200 bg-slate-50",
  };
};

const riskColor = (risk?: string) => {
  const r = (risk || "").toLowerCase();
  if (r.includes("high")) return "text-red-600";
  if (r.includes("moderate")) return "text-amber-600";
  if (r.includes("low")) return "text-green-600";
  return "text-foreground";
};

const ReportSummary = () => {
  const { resultId: resultIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const resultId =
    (resultIdParam ? decodeURIComponent(resultIdParam) : undefined) ||
    location.state?.resultId;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!resultId) {
        setError("Missing result ID in the URL.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetchWithAuth(
          `${API_BASE_URL}/report-summary/data/${encodeURIComponent(resultId)}`
        );
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data: ApiResponse = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        if (data.status === "success" && data.report_data) {
          setReport(data.report_data);
        } else {
          setReport(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [resultId]);

  // Auto-trigger native print dialog when ?print=1 and report is ready
  useEffect(() => {
    if (autoPrint && report && !loading) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoPrint, report, loading]);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    const reportElement = reportRef.current;
    const originalWidth = reportElement.style.width;
    const originalMaxWidth = reportElement.style.maxWidth;
    const originalMargin = reportElement.style.margin;
    const originalBorderRadius = reportElement.style.borderRadius;
    const originalTransform = reportElement.style.transform;
    try {
      reportElement.style.width = "1120px";
      reportElement.style.maxWidth = "1120px";
      reportElement.style.margin = "0 auto";
      reportElement.style.borderRadius = "0";
      reportElement.style.transform = "translateZ(0)";
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: reportElement.scrollWidth,
        height: reportElement.scrollHeight,
        windowWidth: 1280,
        windowHeight: reportElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const pageMargin = 6;
      const imgWidth = pdfWidth - pageMargin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageContentHeight = pdfHeight - pageMargin * 2;
      let heightLeft = imgHeight;
      let position = pageMargin;
      pdf.addImage(imgData, "PNG", pageMargin, position, imgWidth, imgHeight);
      heightLeft -= pageContentHeight;
      while (heightLeft > 0) {
        position = pageMargin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", pageMargin, position, imgWidth, imgHeight);
        heightLeft -= pageContentHeight;
      }
      const patientId = report?.patient_information?.patient_id || "report";
      pdf.save(
        `cognitive_report_${patientId}_${new Date()
          .toISOString()
          .split("T")[0]}.pdf`
      );
    } catch (e) {
      console.error("PDF generation failed", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      reportElement.style.width = originalWidth;
      reportElement.style.maxWidth = originalMaxWidth;
      reportElement.style.margin = originalMargin;
      reportElement.style.borderRadius = originalBorderRadius;
      reportElement.style.transform = originalTransform;
      setPdfLoading(false);
    }
  };

  // -------- Loading --------
  if (loading) {
    return (
      <MainLayout>
        <PageLoader text="Loading report summary..." />
      </MainLayout>
    );
  }

  // -------- Error --------
  if (error) {
    return (
      <MainLayout>
        <div className="grid justify-items-center content-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-3" />
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </MainLayout>
    );
  }

  // -------- Processing state (do not render partial report) --------
  if (status === "processing" || !report) {
    return (
      <MainLayout>
        <div className="grid justify-items-center content-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center mb-4">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Clinical interpretation is still being prepared.
          </h2>
          <p className="text-sm text-muted-foreground">
            Please check back in a moment.
          </p>
        </div>
      </MainLayout>
    );
  }

  const pi = report.patient_information || {};
  const overall = report.overall_assessment || {};
  const biomarkers = report.eeg_biomarkers || {};
  const clinical = report.clinical_interpretation || {};
  const observations = report.key_neurophysiological_observations || [];
  const followup = report.recommended_followup || {};
  const lifestyle = report.lifestyle_and_preventive_recommendations || {};
  const note = report.clinical_note || {};

  // Helpers for new infographic visual
  const riskScore =
    typeof overall.cognitive_risk_score_percent === "number"
      ? overall.cognitive_risk_score_percent
      : 0;
  const riskRingColor = (() => {
    const r = (overall.risk_level || "").toLowerCase();
    if (r.includes("high")) return "#dc2626"; // red-600
    if (r.includes("moderate")) return "#d97706"; // amber-600
    if (r.includes("low")) return "#16a34a"; // green-600
    return "#1e3a8a";
  })();

  const biomarkerIconColors = [
    "from-violet-100 to-violet-200 text-violet-600",
    "from-emerald-100 to-emerald-200 text-emerald-600",
    "from-rose-100 to-rose-200 text-rose-600",
    "from-sky-100 to-sky-200 text-sky-600",
    "from-blue-100 to-blue-200 text-blue-600",
    "from-orange-100 to-orange-200 text-orange-600",
  ];

  const SectionNumber = ({ n }: { n: number }) => (
    <span className="inline-block h-7 w-7 rounded-full bg-blue-900 text-center align-top text-white text-[16px] font-bold leading-7">
      {n}
    </span>
  );

  const SectionHeader = ({
    n,
    title,
    className = "text-blue-900",
  }: {
    n: number;
    title: string;
    className?: string;
  }) => (
    <div className="mb-3 grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2">
      <span className="w-7 shrink-0">
        <SectionNumber n={n} />
      </span>
      <h2
        className={cn(
          "min-w-0 text-sm font-bold uppercase tracking-wide leading-tight pt-1",
          className
        )}
      >
        {title}
      </h2>
    </div>
  );

  return (
    <MainLayout>
      {/* Print styles: hide app chrome, only show captured report */}
      <style>{`
        @media print {
        *{padding:0;margin:0;box-sizing:border-box}
          @page { size: A4; margin: 10mm; }
          body { background: white !important; font-size: 14px !important; }
          /* Hide everything by default */
          body * { visibility: hidden !important; }
          /* Show only the captured report */
          #print-report, #print-report * { visibility: visible !important; }
          #print-report {
            position: absolute !important;
            left: 0; top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 12px !important;
            box-shadow: none !important;
            font-size: 16px !important;
          }
            // #print-report .grid{}
          #print-report h1 { font-size: 28px !important; }
          #print-report h2 { font-size: 20px !important; }
          #print-report h3 { font-size: 17px !important; }
          #print-report p, #print-report li, #print-report span { font-size: 16px !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-4">
        {/* Top action bar - excluded from screenshot & print */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_auto] sm:justify-between sm:items-center gap-2 no-print">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            className="gap-2"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            <Download className="h-4 w-4" />
            {pdfLoading ? "Generating PDF..." : "Download as PDF"}
          </Button>
        </div>

        {/* Captured report */}
        <div
          ref={reportRef}
          id="print-report"
          className="bg-white text-slate-900 p-4 sm:p-6 md:p-8 rounded-xl shadow-sm space-y-5 text-[15px] md:text-base leading-relaxed overflow-hidden"
        >
          {/* 1. Header */}
          <header className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)] gap-4 items-center pb-4 border-b">
            <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center justify-items-center lg:justify-items-start gap-2 min-w-0">
              <div className="h-12 w-12 rounded-full bg-blue-900/10 grid place-items-center">
                <Brain className="h-7 w-7 text-blue-900" />
              </div>
              <div className="text-[16px] min-w-0">
                <p className="font-bold text-blue-900">freeiym</p>
                <p className="text-slate-500 leading-tight">Cognitive Health Intelligence</p>
              </div>
            </div>

            <div className="text-center min-w-0">
              <h1 className="text-xl md:text-[20px] font-extrabold tracking-tight text-blue-900 uppercase leading-tight">
                Cognitive &amp; Neural Function
                <br />
                Assessment Summary
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                EEG-Based Biomarker Insights for Early Detection &amp;
                Cognitive Wellness
              </p>
            </div>

            <div className="w-full text-sm rounded-lg border bg-slate-50 px-3 py-2 space-y-1 justify-self-center lg:justify-self-end lg:max-w-[260px]">
              <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500 whitespace-nowrap">Patient ID :</span>
                <span className="font-semibold truncate text-right">{pi.patient_id ?? "—"}</span>
              </div>
              <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500 whitespace-nowrap">Age / Gender :</span>
                <span className="font-semibold truncate text-right">
                  {pi.age ?? "—"} / {pi.gender ?? "—"}
                </span>
              </div>
              <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500 whitespace-nowrap">Date :</span>
                <span className="font-semibold truncate text-right">
                  {pi.assessment_date ?? "—"}
                </span>
              </div>
            </div>
          </header>

          {/* 2 & 3 — Overall Risk + Biomarker Highlights side-by-side */}
          <section className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
            {/* Overall Risk donut */}
            <div className="lg:col-span-2 rounded-xl bg-blue-900 text-white p-5 h-full">
              <h2 className="text-sm font-bold uppercase tracking-wider text-center mb-3">
                Overall Cognitive Risk
              </h2>
              <div className="grid mt-10 grid-cols-[128px_minmax(0,1fr)] items-center justify-center gap-4">
                {/* SVG Donut */}
                <div className="relative h-32 w-32 shrink-0">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={riskRingColor}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${(Math.min(Math.max(riskScore, 0), 100) * 314) / 100} 314`}
                    />
                  </svg>
                  <div className="absolute inset-0 grid justify-items-center content-center">
                    <span className="text-2xl font-extrabold leading-none">
                      {(overall.risk_level || "—")
                        .split(" ")[0]
                        ?.toUpperCase()}
                    </span>
                    <span className="text-[16px] tracking-wider opacity-80">
                      RISK
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm opacity-80">Cognitive Risk Score</p>
                  <p
                    className="text-4xl font-extrabold"
                    style={{ color: riskRingColor }}
                  >
                    {typeof overall.cognitive_risk_score_percent === "number"
                      ? `${Math.round(overall.cognitive_risk_score_percent)}%`
                      : "—"}
                  </p>
                  <p className="text-[16px] opacity-75 mt-1  leading-tight">
                    ({overall.summary ?? "compared to age-matched norms"})
                  </p>
                </div>
              </div>
            </div>

            {/* Biomarker highlights (first 4 in fixed order) */}
            <div className="lg:col-span-3 rounded-xl bg-blue-900 text-white p-4 h-full">
              <h2 className="text-sm font-bold uppercase tracking-wider text-center mb-3">
                Key EEG Biomarker Highlights
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 bg-white rounded-lg p-3 text-slate-800">
                {BIOMARKER_ORDER.slice(0, 4).map(({ key, label }, idx) => {
                  const b = biomarkers[key];
                  if (!b) return null;
                  const styles = statusStyles(b.status);
                  return (
                    <div
                      key={key}
                      className="grid justify-items-center text-center min-w-0"
                    >
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full bg-gradient-to-br grid place-items-center mb-1",
                          biomarkerIconColors[idx]
                        )}
                      >
                        <Brain className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold leading-tight break-words">
                        {label}
                      </p>
                      <p className="text-xl font-extrabold mt-0.5">
                        {typeof b.value === "number"
                          ? b.value.toFixed(2)
                          : b.value}
                      </p>
                      <span
                        className={cn(
                          "mt-0.5 text-[11px] uppercase font-bold tracking-wide px-2 py-0.5 rounded border",
                          styles.badge
                        )}
                      >
                        {b.status}
                      </span>
                      <p className="text-[11px] text-slate-600 mt-1 leading-tight break-words">
                        {b.clinical_significance}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Remaining biomarkers (5 & 6) — separate row so all 6 shown */}
          {BIOMARKER_ORDER.slice(4).some(({ key }) => biomarkers[key]) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BIOMARKER_ORDER.slice(4).map(({ key, label }, idx) => {
                const b = biomarkers[key];
                if (!b) return null;
                const styles = statusStyles(b.status);
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border p-3 grid grid-cols-[40px_minmax(0,1fr)] items-start gap-3 min-w-0",
                      styles.ring
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full bg-gradient-to-br grid place-items-center",
                        biomarkerIconColors[idx + 4]
                      )}
                    >
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                        <h3 className="text-sm font-bold text-slate-800 break-words">
                          {label}
                        </h3>
                        <span
                          className={cn(
                            "text-[11px] uppercase font-bold tracking-wide px-2 py-0.5 rounded border",
                            styles.badge
                          )}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xl font-extrabold">
                        {typeof b.value === "number"
                          ? b.value.toFixed(2)
                          : b.value}
                      </p>
                      <p className="text-sm text-slate-600 leading-tight break-words">
                        {b.clinical_significance}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* 4 & 5 — Clinical Interpretation + Observations (two columns) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* 4. Clinical Interpretation */}
            <div className="rounded-xl border p-4 h-full">
              <SectionHeader n={1} title="Clinical Interpretation" />
              {Array.isArray(clinical.summary) &&
              clinical.summary.length > 0 ? (
                <ul className="space-y-1.5">
                  {clinical.summary.map((line, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[6px_minmax(0,1fr)] items-start gap-2 text-[16px] text-slate-700 leading-relaxed"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-900 shrink-0" />
                      <span className="min-w-0 break-words">{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] text-muted-foreground">
                  No interpretation available.
                </p>
              )}
              {(clinical.affected_domains?.length ||
                clinical.possible_neural_regions?.length) && (
                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(120px,max-content))] gap-1.5 pt-3 border-t">
                  {clinical.affected_domains?.map((d, i) => (
                    <Badge
                      key={`d-${i}`}
                      variant="outline"
                      className="bg-rose-50 border-rose-200 text-rose-700 text-[16px]"
                    >
                      {d}
                    </Badge>
                  ))}
                  {clinical.possible_neural_regions?.map((d, i) => (
                    <Badge
                      key={`r-${i}`}
                      variant="outline"
                      className="bg-violet-50 border-violet-200 text-violet-700 text-[16px]"
                    >
                      {d}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Neurophysiological Observations */}
            <div className="rounded-xl border p-4 h-full">
              <SectionHeader n={2} title="Neurophysiological Observations" />
              {observations.length > 0 ? (
                <div className="space-y-2">
                  {observations.map((obs, i) => (
                    <div
                      key={i}
                      className="rounded-lg border bg-white p-3"
                    >
                      <h3 className="text-sm font-bold text-slate-800">
                        {obs.observation}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {obs.interpretation}
                      </p>
                      {obs.potential_implications &&
                        obs.potential_implications.length > 0 && (
                          <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(120px,max-content))] gap-1">
                            {obs.potential_implications.map((imp, j) => (
                              <Badge
                                key={j}
                                variant="outline"
                                className="bg-blue-50 border-blue-200 text-blue-700 text-[16px]"
                              >
                                {imp}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[16px] text-muted-foreground">
                  No observations available.
                </p>
              )}
            </div>
          </section>

          {/* 6 & 7 — Follow-up + Lifestyle (two columns) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* 6. Follow-up Recommendations */}
            <div className="rounded-xl border p-4 h-full">
              <SectionHeader n={3} title="Recommended Clinical Follow-up" />
              {followup.purpose && (
                <p className="text-[16px] text-muted-foreground mb-2 italic">
                  {followup.purpose}
                </p>
              )}
              {Array.isArray(followup.clinical_recommendations) &&
              followup.clinical_recommendations.length > 0 ? (
                <ul className="space-y-1.5">
                  {followup.clinical_recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-2 text-[16px] text-slate-700"
                    >
                      <ClipboardList className="h-3.5 w-3.5 text-blue-900 mt-0.5 shrink-0" />
                      <span className="min-w-0 break-words">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] text-muted-foreground">
                  No follow-up recommendations.
                </p>
              )}
            </div>

            {/* 7. Lifestyle Recommendations */}
            <div className="rounded-xl border bg-emerald-50/40 p-4 h-full">
              <SectionHeader
                n={4}
                title="Lifestyle & Preventive"
                className="text-emerald-700"
              />
              {Array.isArray(lifestyle.recommendations) &&
              lifestyle.recommendations.length > 0 ? (
                <div className="grid grid-cols-1 gap-1.5">
                  {lifestyle.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[14px_minmax(0,1fr)] items-start gap-2 text-[16px] rounded-md bg-white border px-2.5 py-1.5"
                    >
                      <Leaf className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-slate-700 min-w-0 break-words">{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[16px] text-muted-foreground">
                  No lifestyle recommendations.
                </p>
              )}
              {lifestyle.mental_health_consideration && (
                <div className="mt-3 rounded-md bg-purple-50 border border-purple-200 p-2">
                  <p className="text-[16px] text-purple-800 italic leading-tight">
                    <span className="font-semibold not-italic">Mental Health:</span>{" "}
                    {lifestyle.mental_health_consideration}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 8. Clinical Disclaimer */}
          <section className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="grid grid-cols-[16px_minmax(0,1fr)] items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-900" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">
                Clinical Note
              </h2>
            </div>
            {note.important_notice && (
              <p className="text-[16px] text-slate-700 leading-relaxed">
                {note.important_notice}
              </p>
            )}
            {Array.isArray(note.recommended_integration) &&
              note.recommended_integration.length > 0 && (
                <div className="mt-2">
                  <p className="text-[16px] font-semibold text-slate-600 mb-1">
                    Recommended Integration:
                  </p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,max-content))] gap-1">
                    {note.recommended_integration.map((item, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-white border-slate-300 text-slate-700 text-[16px]"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </section>

          {/* Footer (metadata) */}
          <footer className="text-center border-t bg-blue-900 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-[5px] rounded-b-xl">
            <p className="text-sm text-white font-semibold tracking-wide">
              Early Insight. Better Decisions. Healthier Tomorrow.
            </p>
            {report.report_metadata && (
              <p className="text-[11px] text-white/60 mt-0.5">
                {report.report_metadata.generated_by} •{" "}
                {report.report_metadata.generated_at} •{" "}
                {report.report_metadata.schema_version}
              </p>
            )}
          </footer>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReportSummary;

