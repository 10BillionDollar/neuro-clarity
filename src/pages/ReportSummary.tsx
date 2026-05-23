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
  ShieldCheck,
  CheckCircle2,
  Moon,
  Dumbbell,
  BarChart3,
  Network,
  UserRoundCheck,
  Sparkles,
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

type SpriteIconName =
  | "patient"
  | "ageGender"
  | "assessmentDate"
  | "brain"
  | "network"
  | "memory"
  | "gamma"
  | "shield"
  | "meditation"
  | "running"
  | "desk"
  | "sleep"
  | "checklist"
  | "heart"
  | "clinicalNote";

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
  cognitive_decline_assessment?: {
    dementia_likelihood?: string;
    possible_conditions?: string[];
    risk_interpretation?: string;
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
  { key: "posterior_dominance_index", label: "Posterior Dominance Index" },
  { key: "occipital_entropy", label: "Occipital Entropy" },
  { key: "cognitive_decline_index", label: "Cognitive Decline Index" },
  { key: "gamma_activity_ratio", label: "Gamma Activity Ratio" },
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

const SPRITE_ICON_POSITIONS: Record<SpriteIconName, string> = {
  patient: "10% 8%",
  ageGender: "29% 8%",
  assessmentDate: "71% 8%",
  brain: "12% 39%",
  network: "28% 39%",
  memory: "58% 39%",
  gamma: "77% 39%",
  shield: "23% 72%",
  meditation: "35% 72%",
  running: "47% 72%",
  desk: "69% 72%",
  sleep: "35% 92%",
  checklist: "26% 92%",
  heart: "91% 72%",
  clinicalNote: "88% 92%",
};

const SpriteIcon = ({
  name,
  className,
}: {
  name: SpriteIconName;
  className?: string;
}) => (
  <span
    className={cn("inline-block shrink-0 bg-no-repeat", className)}
    style={{
      backgroundImage: "url('/report-icons-sprite.png')",
      backgroundPosition: SPRITE_ICON_POSITIONS[name],
      backgroundSize: "620% auto",
    }}
  />
);

interface ReportSummaryProps {
  embedded?: boolean;
  embeddedResultId?: string;
}

const ReportSummary = ({ embedded = false, embeddedResultId }: ReportSummaryProps = {}) => {
  const { resultId: resultIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const resultId =
    embeddedResultId ||
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
  const POLL_INTERVAL_MS = 5000;
  const MAX_POLL_ATTEMPTS = 24;
  const wrapContent = (content: React.ReactNode) =>
    embedded ? <>{content}</> : <MainLayout>{content}</MainLayout>;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const load = async () => {
      if (!resultId) {
        setError("Missing result ID in the URL.");
        setLoading(false);
        return;
      }
      try {
        attempts += 1;
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
          setLoading(false);
        } else {
          setReport(null);
          // For embedded mode, don't poll as much - assume data should be available
          const maxAttempts = embedded ? 3 : MAX_POLL_ATTEMPTS;
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(load, POLL_INTERVAL_MS);
          } else {
            setLoading(false);
          }
        }
      } catch (e: any) {
        // For embedded mode, fail faster
        const maxAttempts = embedded ? 3 : MAX_POLL_ATTEMPTS;
        if (!cancelled && attempts < maxAttempts) {
          timeoutId = setTimeout(load, POLL_INTERVAL_MS);
        } else if (!cancelled) {
          setError(e?.message || "Failed to load report.");
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [resultId]);

  // Auto-trigger native print dialog when ?print=1 and report is ready
  useEffect(() => {
    if (autoPrint && report && !loading) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [autoPrint, report, loading]);
// ==================== SIRF REPORT CONTAINER KA SCREENSHOT ====================
const handleReportScreenshot = async () => {
  // if (!reportRef.current) {
  //   alert("Report abhi load nahi hua hai!");
  //   return;
  // }

  // const element = reportRef.current;

  // // Original styles backup
  // const originalStyles = {
  //   width: element.style.width,
  //   maxWidth: element.style.maxWidth,
  //   margin: element.style.margin,
  //   padding: element.style.padding,
  //   borderRadius: element.style.borderRadius,
  //   boxShadow: element.style.boxShadow,
  // };

  // try {
  //   // Clean aur perfect size ke liye force kiya
  //   element.style.width = "1180px";
  //   element.style.maxWidth = "1180px";
  //   element.style.margin = "0";
  //   element.style.padding = "40px 35px";
  //   element.style.borderRadius = "0";
  //   element.style.boxShadow = "none";

  //   await new Promise(resolve => setTimeout(resolve, 150));

  //   const canvas = await html2canvas(element, {
  //     scale: 2.6,                    // Achhi quality
  //     useCORS: true,
  //     backgroundColor: "#ffffff",
  //     logging: false,
  //     letterRendering: true,
  //     allowTaint: true,
  //   });

  //   const link = document.createElement("a");
  //   link.download = `NEMA_Cognitive_Report_${new Date().toISOString().split("T")[0]}.png`;
  //   link.href = canvas.toDataURL("image/png", 0.95);
  //   link.click();

  // } catch (err) {
  //   console.error(err);
  //   alert("Screenshot lene mein problem aayi");
  // } finally {
  //   // Wapas original style laga do
  //   Object.assign(element.style, originalStyles);
  // }
   if (!reportRef.current) return;

  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Report</title>
          <style>
            body {
              padding: 20px;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          ${reportRef.current.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }
};
  // -------- Loading --------
  if (loading) {
    return wrapContent(<PageLoader text="Loading report summary..." />);
  }

  // -------- Error --------
  if (error) {
    return wrapContent(
        <div className="grid justify-items-center content-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-3" />
          <p className="text-destructive font-medium">{error}</p>
        </div>
    );
  }

  // -------- Processing state (do not render partial report) --------
  if (status === "processing" || !report) {
    return wrapContent(
        <div className="grid justify-items-center content-center py-20 text-center" style={{display:"flex",alignItems:"center"}}>
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
    );
  }

  const pi = report.patient_information || {};
  const overall = report.overall_assessment || {};
  const biomarkers = report.eeg_biomarkers || {};
  const clinical = report.clinical_interpretation || {};
  const cognitiveDecline = report.cognitive_decline_assessment || {};
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
    if (r.includes("high")) return "#ef4444"; // red-500
    if (r.includes("moderate")) return "#d97706"; // amber-600
    if (r.includes("low")) return "#16a34a"; // green-600
    return "#1e3a8a";
  })();

  const SectionNumber = ({ n }: { n: number }) => (
    <span className=" h-6 w-6 shrink-0 block text-center rounded-full bg-[#003e59] text-white text-[13px] font-medium ">
     <span className="block mb-[10px]"> {n}</span>
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
    <div className="mb-3 grid grid-cols-[28px_1fr] items-center gap-2" >
      <SectionNumber n={n} />
      <h2
        className={cn(
          "min-w-0 whitespace-nowrap text-[13px] text-[#003e59] font-bold uppercase tracking-tight ",
          className
        )}
      >
        {title}
      </h2>
    </div>
  );

  const biomarkerCards = [
    {
      key: "frontal_theta_beta_ratio" as BiomarkerKey,
      short: "Frontal",
      name: "Theta / Beta Ratio",
      Icon: <img src="/icon_marker1.png" alt=""/>,
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
    {
      key: "memory_theta_alpha_ratio" as BiomarkerKey,
      short: "Memory",
      name: "Theta – Alpha Ratio",
      Icon: <img src="/icon_marker2.png" alt=""/>,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
    {
      key: "posterior_dominance_index" as BiomarkerKey,
      short: "Posterior",
      name: "Dominance Index",
      Icon: <img src="/icon_marker3.png" alt=""/>,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      key: "occipital_entropy" as BiomarkerKey,
      short: "Occipital",
      name: "Entropy",
      Icon: <img src="/icon_marker4.png" alt=""/>,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
    {
      key: "cognitive_decline_index" as BiomarkerKey,
      short: "Cognitive",
      name: "Decline Index",
      Icon: BarChart3,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      key: "gamma_activity_ratio" as BiomarkerKey,
      short: "Gamma",
      name: "Activity Ratio",
      Icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
  ];

  const firstObservation = observations[0];
  const secondObservation = observations[1];
  const summaryText =
    Array.isArray(clinical.summary) && clinical.summary.length > 0
      ? clinical.summary.join(" ")
      : "The patient's cognitive risk percentage coupled with EEG biomarker changes indicates potential neural network dysfunction, particularly in brain regions associated with executive functions and attention.";
  const affectedDomains =
    Array.isArray(clinical.affected_domains) && clinical.affected_domains.length > 0
      ? clinical.affected_domains
      : [];
  const neuralRegions =
    Array.isArray(clinical.possible_neural_regions) && clinical.possible_neural_regions.length > 0
      ? clinical.possible_neural_regions
      : [];
  const possibleConditions =
    Array.isArray(cognitiveDecline.possible_conditions) && cognitiveDecline.possible_conditions.length > 0
      ? cognitiveDecline.possible_conditions
      : [];
  const followupItems =
    Array.isArray(followup.clinical_recommendations) &&
    followup.clinical_recommendations.length > 0
      ? followup.clinical_recommendations
      : [
          "Comprehensive Neuropsychological Assessment",
          "Brain Imaging (MRI / PET as indicated)",
          "Neurology Consultation",
          "Movement Disorder Evaluation (if applicable)",
          "Longitudinal Monitoring",
        ];
  const lifestyleItems =
    Array.isArray(lifestyle.recommendations) && lifestyle.recommendations.length > 0
      ? lifestyle.recommendations
      : [
          "Optimize Sleep Hygiene",
          "Stress Management",
          "Regular Physical Activity",
          "Cognitive Enrichment",
          "Reduce Cognitive Overload",
        ];
  const integrationItems =
    Array.isArray(note.recommended_integration) && note.recommended_integration.length > 0
      ? note.recommended_integration
      : [];

  return wrapContent(
    <>
      {/* Print styles: hide app chrome, only show captured report */}
      <style>{`
      @media print {
  #print-report {
    width: 1180px !important;
    max-width: 1180px !important;
    margin: 0 auto !important;
    box-shadow: none !important;
    // padding: 20px !important;
  }

  #print-report * {
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* Grid aur Flex ko stable rakho */
  #print-report .grid {
    display: grid !important;
  }
  
  #print-report .flex {
    display: flex !important;
  }
}
      `}</style>

      <div className="space-y-4">
              <div
          ref={reportRef}
          id="print-report"
          className=" gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" 
        >
          <header className="grid -4 grid-cols-[250px_minmax(0,1fr)_245px] items-start gap-5 border-b border-slate-200 pb-5">
            <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3">
              <div className="grid place-items-center p-[5px]">
               <img src="/logo2.png" alt="logo2" className="h-[100%] w-[100%]" />
              </div>
              <div>
                <p className="text-[25px] font-medium  tracking-tight text-slate-950">NEMA AI</p>
                <p className="mt-1 text-[10px] font-semibold tracking-wide text-slate-600">Cognitive Health Intelligence</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-[22px] font-black font-[500] uppercase leading-[1.05] tracking-tight text-[#082c73]">
                Cognitive &amp; Neural Function
                <br />
                Assessment Summary
              </h1>
              <p className="mt-2 text-[14px] font-medium text-slate-600">
                EEG-Based Biomarker Insights for Early Detection &amp;
                Cognitive Wellness
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[12px] shadow-md">
              <div className="grid grid-cols-[20px_86px_1fr] items-center gap-2 py-1">
                <User className="h-4 w-4 text-[#082c73]" />
                <span className="font-bold">Patient ID</span>
                <span className="font-bold">: {pi.patient_id ?? "XXXX-1234"}</span>
              </div>
              <div className="grid grid-cols-[20px_86px_1fr] items-center gap-2 py-1">
                <Stethoscope className="h-4 w-4 text-[#082c73]" />
                <span className="font-bold">Age / Gender</span>
                <span className="font-bold">: {pi.age ?? "38"} / {pi.gender ?? "Male"}</span>
              </div>
              <div className="grid grid-cols-[20px_86px_1fr] items-center gap-2 py-1">
                <img src="/calendar.png" alt="calendar" className="h-4 w-4 text-[#082c73]" />
                <span className="font-bold">Date</span>
                <span className="font-bold">: {pi.assessment_date ?? "20 May 2025"}</span>
              </div>
            </div>
          </header>
          <section className="mt-5 grid grid-cols-[340px_minmax(0,1fr)] gap-5">
            <div className="overflow-hidden rounded-2xl bg-[#003e59] text-white shadow-lg">
              <div className="bg-white/10 py-2.5 text-center text-[16px] font-semibold font-black uppercase tracking-wide">
                Overall Cognitive Risk
              </div>
              <div className="grid grid-cols-[170px_minmax(0,1fr)] items-center gap-3 px-5 pb-7 pt-5">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="48" fill="none" stroke="#f7b23b" strokeWidth="12" />
                    <circle cx="60" cy="60" r="48" fill="none" stroke={riskRingColor} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(Math.min(Math.max(riskScore || 72, 0), 100) * 302) / 100} 302`} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-[31px] font-black ">{(overall.risk_level || "High").split(" ")[0].toUpperCase()}</p>
                      <p className="mt-1 text-[20px] font-medium">RISK</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white/90">Cognitive Risk Score</p>
                  <p
                    className="mt-2 text-[44px] font-black "
                    style={{ color: riskRingColor }}
                  >
                    {typeof overall.cognitive_risk_score_percent === "number"
                      ? `${Math.round(overall.cognitive_risk_score_percent)}%`
                      : "72%"}
                  </p>
                  <p className="mt-3 text-[12px] font-medium leading-snug text-white/85">
                    {overall.summary || "Elevated compared to age-matched norms"}
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              <div className="bg-[#003e59] py-2.5 text-center text-[16px] font-black font-semibold uppercase tracking-wide text-white">
                Key EEG Biomarker Highlights
              </div>
              <div className="grid grid-cols-4 bg-white">
                {biomarkerCards.slice(0, 4).map(({ key, short, name, Icon, color, bg }) => {
                  const b = biomarkers[key] || { value: "N/A", status: "N/A", clinical_significance: "No biomarker data available." };
                  const styles = statusStyles(b.status);
                  return (
                    <div key={key} className="grid justify-items-center border-r border-slate-100 px-3 py-4 text-center last:border-r-0">
                      <div className={cn("grid h-14 w-14 place-items-center rounded-2xl")}>
                        {Icon}
                      </div>
                      <p className="mt-2 text-[11px] font-black leading-tight text-slate-800">
                        {short}
                        <br />
                        {name}
                      </p>
                      <p className={cn("mt-2 text-[27px] font-black ", color)}>
                        {typeof b.value === "number"
                          ? b.value.toFixed(2)
                          : b.value}
                      </p>
                      <span className={cn("mt-2 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide", styles.badge)}>
                        {b.status}
                      </span>
                      <p className="mt-2 text-[10.5px] font-medium leading-snug text-slate-600">
                        {b.clinical_significance}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          <section className="mt-5 grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader n={1} title="Clinical Interpretation" />
              <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4">
                <div className="grid place-items-center rounded-2xl ">
                  <div className="relative h-32 w-36">
                   <img src="/brain_1.png" alt="brain" className=" h-[100%]"/>
                  </div>
                </div>
                <p className="text-[14.5px] font-medium leading-relaxed text-slate-900">
                  {summaryText}
                </p>
              </div>
              {(affectedDomains.length > 0 || neuralRegions.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                  {affectedDomains.length > 0 && (
                    <div className="rounded-xl border border-purple-100 bg-purple-50 px-3 py-2.5">
                      <p className="font-medium text-purple-700">Affected Domains</p>
                      <p className="mt-1 font-medium text-slate-800">{affectedDomains.join(", ")}</p>
                    </div>
                  )}
                  {neuralRegions.length > 0 && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                      <p className="font-medium text-blue-700">Possible Neural Regions</p>
                      <p className="mt-1 font-medium text-slate-800">{neuralRegions.join(", ")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative flex items-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
              <SectionHeader n={2} title="Dementia / Cognitive Decline Likelihood" />
             
              <p className="pr-20 text-[14.5px] font-medium leading-relaxed text-slate-900">
                {cognitiveDecline.dementia_likelihood || "Not diagnostic at current stage."}
              </p>
              {possibleConditions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pr-20">
                  {possibleConditions.map((condition) => (
                    <Badge key={condition} variant="secondary" className="rounded-full px-2.5  text-[10.5px] font-bold">
                      {condition} 
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mt-4 grid grid-cols-[48px_minmax(0,1fr)] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium leading-relaxed text-slate-800">
                <BarChart3 className="h-9 w-9 text-emerald-600" />
                <p>{cognitiveDecline.risk_interpretation || "Early identification enables proactive monitoring, lifestyle optimization, and better long-term outcomes."}</p>
              </div>
              </div>
               <img src="/shield1.png" className=" w-[80px]" alt="shield"/>
            </div>
          </section>
          <section className="mt-5 grid grid-cols-2 gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <SectionHeader n={3} title="Key Concerning Abnormalities" />
              <div className="space-y-4">
                <div className="grid grid-cols-[70px_minmax(0,1fr)] gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-blue-100 text-blue-700">
                    <Network className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-[#082c73]">{firstObservation?.observation || "Elevated Posterior Dominance Index"}</h3>
                    <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-slate-900">
                      {firstObservation?.interpretation || "The increased posterior dominance activity may represent a compensatory mechanism to maintain functionality despite abnormal frontal activity. If persistent, it may be associated with cognitive fatigue, reduced processing efficiency, and increased neural workload."}
                    </p>
                    {firstObservation?.potential_implications?.length ? (
                      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] font-bold text-slate-700">
                        {firstObservation.potential_implications.join(" • ")}
                      </p>
                    ) : null}
                  </div>
                </div>
                {secondObservation ? (
                  <div className="grid grid-cols-[70px_minmax(0,1fr)] gap-4">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-orange-100 text-orange-600">
                      <Activity className="h-10 w-10" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-medium text-[#082c73]">{secondObservation.observation}</h3>
                      <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-slate-900">
                        {secondObservation.interpretation}
                      </p>
                      {secondObservation.potential_implications?.length ? (
                        <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] font-bold text-slate-700">
                          {secondObservation.potential_implications.join(" • ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
             <img src="/calendar.png" alt="calendar" className="absolute right-5 top-5 h-12 w-12 text-[#082c73]" />
              <SectionHeader n={4} title="Recommended Clinical Follow-up" />
              {followup.purpose && (
                <p className="pr-12 text-[13px] font-medium leading-relaxed text-slate-800">{followup.purpose}</p>
              )}
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60">
                {followupItems.slice(0, 5).map((item, i) => (
                  <div key={i} className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-2 bg-white/70 px-3 py-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-600" />
                    <div>
                      <p className="text-[12.5px] font-medium text-[#082c73]">{item}</p>
                      <p className="text-[11.5px] leading-snug text-slate-700">
                        {i === 0 && "Detailed evaluation of memory, attention, executive function & more."}
                        {i === 1 && "To assess structural or functional changes."}
                        {i === 2 && "Specialist evaluation for underlying neurological causes."}
                        {i === 3 && "If tremors, slowing, rigidity or other motor symptoms are present."}
                        {i === 4 && "Repeat EEG & cognitive assessments to track changes over time."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader n={5} title="Lifestyle & Preventive Recommendations" />
            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <div className="mx-auto mb-4 w-fit rounded-full bg-emerald-600 px-8 py-1.5 text-[12px] font-bold text-white shadow-sm">
                  Cognitive &amp; Lifestyle Support
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {lifestyleItems.slice(0, 5).map((title, index) => {
                    const Icon = [Moon, Stethoscope, Dumbbell, Brain, UserRoundCheck][index] || Leaf;
                    return (
                    <div key={title} className="grid justify-items-center gap-2 rounded-xl bg-white px-2 py-3 shadow-sm">
                      <Icon className="h-9 w-9 text-emerald-600" />
                      <p className="text-[10.5px] font-medium leading-tight text-slate-800">{title}</p>
                    </div>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl bg-white px-4 py-3 text-center text-[12.5px] font-medium text-slate-800 shadow-sm">
                  These habits help strengthen cognitive reserve, improve neural efficiency and overall well-being.
                </div>
              </div>
              <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-5">
                <div className="mx-auto mb-4 w-fit rounded-full bg-purple-100 px-9 py-1.5 text-[12px] font-medium text-purple-700">
                  Mental Health Evaluation
                </div>
                <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full ">
                    <img src="/human_1.png" alt=""/>
                  </div>
                  <p className="text-[13.5px] font-medium leading-relaxed text-slate-900">
                    {lifestyle.mental_health_consideration || "A psychological or psychiatric consultation may be beneficial. Conditions such as anxiety, depression, chronic stress, or burnout can significantly impact cognitive performance and EEG biomarkers."}
                  </p>
                </div>
                <div className="mt-6 rounded-xl bg-purple-100 px-4 py-3 text-center text-[12.5px] font-semibold text-purple-900">
                  Early support leads to better outcomes.
                </div>
              </div>
            </div>
          </section>
          <section className="mt-5 grid grid-cols-[56px_minmax(0,1fr)_150px] items-center rounded-2xl border border-blue-100 bg-blue-50/60 px-5 py-4">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#082c73] shadow-sm">
              <Heart className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-[16px] font-medium uppercase text-[#082c73]">
                Clinical Note
              </h2>
              <p className="text-[12.5px] font-medium leading-relaxed text-slate-800">
                {note.important_notice || "These findings should be interpreted as supportive neurophysiological indicators and not as a standalone diagnosis. EEG-based cognitive biomarkers are most valuable when integrated with clinical history, behavioral symptoms, neuropsychological testing, and longitudinal follow-up."}
              </p>
              {integrationItems.length > 0 && (
                <p className="mt-1.5 text-[11px] font-bold text-slate-700">
                  Recommended integration: {integrationItems.join(", ")}
                </p>
              )}
            </div>
            <Network className="h-24 w-24 justify-self-center text-blue-200" />
          </section>
          <footer className="-mx-5 -mb-5 mt-4 bg-gradient-to-r from-[#082c73] via-[#0a3b89] to-[#082c73] py-3 text-center">
            <p className="text-[14px] font-semibold tracking-wide text-white">
              Early Insight. Better Decisions. Healthier Tomorrow.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ReportSummary;

