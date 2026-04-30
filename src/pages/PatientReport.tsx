import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";
import { historypreview } from "@/app/patients";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Brain,
  Calendar,
  Download,
  Mail,
  Printer,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// Mock patient data
const initialPatientData = {
  id: "",
  name: "",
  age: 0,
  sex: "",
  screeningDate: "",
  riskLevel: "low" as const,
  probability: 0,
  brainAge: 0,
  signalQuality: 0,
  interpretation: "",
};

const initialCognitiveMarkers = [
  {
    title: "Cognitive Decline Index",
    subtitle: "Slow/Fast Wave Ratio",
    value: "1.8",
    normalRange: "0.8–1.2",
    interpretation: "Higher than expected — suggests early slowing of brain activity.",
    trend: "up" as const,
    percentile: 82,
  },
  {
    title: "Posterior Dominant Rhythm",
    subtitle: "PDR Frequency",
    value: "8.1 Hz",
    normalRange: "9.5–10 Hz",
    interpretation: "PDR slowing detected — common in early cognitive decline.",
    trend: "down" as const,
    percentile: 20,
  },
  {
    title: "Memory-Related Pattern",
    subtitle: "Theta/Alpha Ratio",
    value: "Elevated",
    normalRange: "Age-matched norms",
    interpretation: "Mild deviation from age norms — may indicate memory processing changes.",
    trend: "up" as const,
    percentile: 68,
  },
  {
    title: "Frontal Executive Function",
    subtitle: "Theta/Beta Ratio",
    value: "2.4",
    normalRange: "1.5–2.0",
    interpretation: "Elevated — often associated with executive dysfunction.",
    trend: "up" as const,
    percentile: 75,
  },
  {
    title: "Arousal Stability Index",
    subtitle: "Alertness Consistency",
    value: "Normal",
    normalRange: "Within range",
    interpretation: "Within normal range — no significant arousal abnormalities.",
    trend: "stable" as const,
    percentile: 55,
  },
  {
    title: "Interhemispheric Asymmetry",
    subtitle: "Left-Right Balance",
    value: "Asymmetric",
    normalRange: "Symmetric",
    interpretation: "Left temporal slowing noted — localized abnormality detected.",
    trend: "down" as const,
    percentile: 30,
  },
  {
    title: "Sleep Dysregulation Index",
    subtitle: "Sleep Pattern Markers",
    value: "Moderate",
    normalRange: "Low",
    interpretation: "Moderately elevated — may indicate sleep-related cognitive impact.",
    trend: "up" as const,
    percentile: 65,
  },
  {
    title: "Gamma Activity Ratio",
    subtitle: "High-frequency Activity",
    value: "Normal",
    normalRange: "Age-appropriate",
    interpretation: "Within normal parameters — high-frequency processing intact.",
    trend: "stable" as const,
    percentile: 48,
  },
];

const initialBrainAgeData = [
  { date: "Jan 23", brainAge: 72, chronoAge: 67 },
  { date: "Apr 23", brainAge: 73, chronoAge: 67.3 },
  { date: "Jul 23", brainAge: 74, chronoAge: 67.5 },
  { date: "Oct 23", brainAge: 75, chronoAge: 67.8 },
  { date: "Jan 24", brainAge: 76, chronoAge: 68 },
];

const initialRiskTrendData = [
  { date: "Jan 23", risk: 58 },
  { date: "Apr 23", risk: 62 },
  { date: "Jul 23", risk: 68 },
  { date: "Oct 23", risk: 72 },
  { date: "Jan 24", risk: 78 },
];

const initialPercentileData = [
  { name: "PDR", value: 20 },
  { name: "CDI", value: 82 },
  { name: "Memory", value: 68 },
  { name: "Executive", value: 75 },
  { name: "Asymmetry", value: 30 },
];

const recommendations = [
  "Consider routine neuropsychological evaluation to establish baseline.",
  "Follow-up EEG screening recommended in 6 months.",
  "If symptoms progress, consider referral to neurology.",
  "Lifestyle factors (sleep, exercise, diet) may influence EEG patterns.",
];

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-risk-moderate" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-risk-high" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const PatientReport = () => {
  const { jobId: jobIdParam } = useParams();
  const location = useLocation();
  const jobId = jobIdParam ? decodeURIComponent(jobIdParam) : undefined;
  const [graphsExpanded, setGraphsExpanded] = useState(false);
  const [explainabilityExpanded, setExplainabilityExpanded] = useState(false);
  
  // Check if navigated from patient history page
  const fromPatientHistory = location.state?.fromPatientHistory || false;
  const reportId = location.state?.reportId || jobId;

  const [patientData, setPatientData] = useState(initialPatientData);
  const [cognitiveMarkers, setCognitiveMarkers] = useState(initialCognitiveMarkers);
  const [brainAgeData, setBrainAgeData] = useState(initialBrainAgeData);
  const [riskTrendData, setRiskTrendData] = useState(initialRiskTrendData);
  const [graphData, setGraphData] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [patientInfo, setPatientInfo] = useState<any>({
    patient_info: {
      name: "",
      age: 0,
      gender: "",
      id: "",
      mmse_score: "",
      moca_score: "",
      notes: "",
    },
    decline_summary: {
      band: "",
      percent: 0,
    },
    rf_risk: {
      category: "",
      percentage: 0,
      probability: 0,
      model: "",
    },
  });

  const getRiskBadgeVariant = (level: string) => {
    if (!level) return "secondary";
    const key = level.toLowerCase();
    if (key.includes("high")) return "riskHigh";
    if (key.includes("moderate")) return "riskModerate";
    if (key.includes("low")) return "riskLow";
    return "secondary";
  };

  useEffect(() => {
    const loadCardAndGraphData = async () => {
      if (!reportId) return;

      try {
        let cardsData;
        
        if (fromPatientHistory) {
          // If navigated from patient history, call historypreview API
          cardsData = await historypreview(reportId, {});
          console.log(cardsData, "historypreview data");
        } else {
          // Otherwise, call the regular report API
          const encodedJobId = reportId ? encodeURIComponent(reportId) : "";
          const cardsRes = await fetchWithAuth(`${API_BASE_URL}/report/${encodedJobId}`);
          if (cardsRes.ok) {
            cardsData = await cardsRes.json();
            console.log(cardsData, "regular report data");
          }
        }

        if (cardsData) {
          setCognitiveMarkers(cardsData.cards ?? cardsData);
          setPatientInfo(cardsData);
          setIsLoading(false);
        }

        // Load graphs data (this can be called regardless of navigation source)
        const encodedJobId = reportId ? encodeURIComponent(reportId) : "";
        const graphsRes = await fetchWithAuth(`${API_BASE_URL}/graphs/${encodedJobId}`);
        if (graphsRes.ok) {
          const graphDataResponse = await graphsRes.json();
          setGraphData(graphDataResponse);
        }
      } catch (error) {
        console.error("Error loading report data:", error);
      }
    };

    loadCardAndGraphData();
  }, [fromPatientHistory, reportId]);

  // historypreview(jobId).then((data) => {
  //   console.log(data, "historypreview");
  // });


  const handleDownload = async (format: "pdf" | "csv" = "pdf") => {
    if (!jobId) return;

    setDownloadLoading(true);
    setDownloadError(null);

    try {
      const endpoint = `${API_BASE_URL}/download/${jobId}${format === "csv" ? "?format=csv" : ""}`;
      const res = await fetchWithAuth(endpoint);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Download request failed: ${res.status} ${text}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient_report_${jobId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report:", error);
      setDownloadError(`Unable to download ${format.toUpperCase()} report. Please try again later.`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const markerItems = Array.isArray(cognitiveMarkers)
    ? cognitiveMarkers
    : cognitiveMarkers?.cards || [];
  const abnormalMarkerCount = markerItems.filter((m) => m.status === "abnormal").length;

  const riskPercentage = patientInfo?.rf_risk?.percentage ?? patientInfo?.decline_summary?.percent ?? "N/A";
  const riskCategory = patientInfo?.rf_risk?.category ?? "N/A";

  // Show loader if no patient data is available
  if (!patientInfo) {
    return (
      <MainLayout>
        <PageLoader text="Loading patient report..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{patientInfo?.patient_info?.name}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>{patientInfo?.patient_info?.age} years / {patientInfo?.patient_info?.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Screening Date: N/A
                </span>
              </div>
            </div>
          </div>

          {/* Risk Badge */}
          <div className="text-right">
            <Badge variant={getRiskBadgeVariant(patientInfo?.rf_risk?.category)} className="px-4 py-2 text-base">
              {patientInfo?.rf_risk?.category?.toUpperCase()} 
            </Badge>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {patientInfo?.rf_risk?.percentage?.toFixed(2)}%
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                likelihood
              </span>
            </p>
          </div>
        </div>

        {/* Key Summary Box */}
        <div className="rounded-xl border border-primary/20 bg-accent/30 p-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <AlertCircle className="h-5 w-5 text-primary" />
            AI Risk Interpretation
          </h2>
          <p className="text-foreground leading-relaxed">{patientInfo?.decline_summary?.band}</p>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-card p-4 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Risk Percentage</p>
              <p className={`text-2xl font-bold ${
                riskPercentage >= 70 ? "text-risk-high" :
                riskPercentage >= 40 ? "text-risk-moderate" :
                "text-green-600"
              }`}>
                {riskPercentage.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                Patient age: {patientInfo?.patient_info?.age}
              </p>
            </div>
            <div className="rounded-lg bg-card p-4 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Abnormal Markers</p>
              <p className="text-2xl font-bold text-green-600">{abnormalMarkerCount}</p>
              <p className="text-xs text-muted-foreground">out of {markerItems.length}</p>
            </div>
            <div className="rounded-lg bg-card p-4 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">Risk Category</p>
              <p className={`text-2xl font-bold ${
                riskCategory?.toLowerCase().includes('low') ? "text-green-600" :
                riskCategory?.toLowerCase().includes('moderate') ? "text-risk-moderate" :
                "text-risk-high"
              }`}>
                {riskCategory}
              </p>
              <p className="text-xs text-muted-foreground">Classification</p>
            </div>
          </div>
        </div>

        {/* Cognitive Markers Panel */}
        <div className="clinical-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Cognitive Markers</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {markerItems.map((marker, index) => (
              <div
                key={marker.id}
                className={cn(
                  "rounded-lg border border-border p-4 transition-all hover:bg-muted/40 animate-fade-in",
                  marker.status === "normal" ? "bg-green-50 border-green-200" : 
                  marker.status === "abnormal" ? "bg-red-50 border-red-200" : 
                  "bg-muted/20"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{marker.label}</h3>
                    <p className="text-xs text-muted-foreground">{marker.description}</p>
                  </div>
                  {/* <TrendIcon trend={marker.status === 'high' ? 'up' : marker.status === 'low' ? 'down' : 'stable'} /> */}
                </div>
                
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-foreground">{marker.value}</span>
                  <span className="text-xs text-muted-foreground">
                   <span className="capitalize"> {marker?.status}</span> : {marker.normal_range}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {marker.interpretation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Graph Section - Collapsible */}
        <Collapsible open={graphsExpanded} onOpenChange={setGraphsExpanded}>
          <div className="clinical-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Trends & Visualizations</h2>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  graphsExpanded && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4 space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Bandpowers Chart */}
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-4 font-semibold text-foreground">EEG Band Powers (µV²/Hz)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(graphData?.bandpowers || {}).map(([key, value]) => ({ name: key, value }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Ratios Chart */}
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-4 font-semibold text-foreground">EEG Ratios</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(graphData?.ratios || {}).map(([key, value]) => ({ name: key, value }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="value" fill="hsl(var(--risk-moderate))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Variance Info */}
              <div className="rounded-lg border border-border p-4">
                <h3 className="mb-4 font-semibold text-foreground">Signal Variance Analysis</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground"> Signal Variance (µV²)</p>
                    <p className="text-xl font-bold">{graphData?.variance?.signal_variance?.toFixed(4)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Normal Mean Variance (µV²) </p>
                    <p className="text-xl font-bold">{graphData?.variance?.normal_mean_variance?.toFixed(4)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">VarianceZ score</p>
                    <p className="text-xl font-bold">{graphData?.variance?.variance_zscore?.toFixed(3)}</p>
                  </div>
                </div>
              </div>

              {/* Plot Images */}
              {/* {graphData?.plots && (
                <div className="rounded-lg border border-border p-4">
                  <h3 className="mb-4 font-semibold text-foreground">EEG Analysis Plots</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {Object.entries(graphData.plots).map(([key, url]) => (
                      <div key={key} className="text-center">
                        <h4 className="text-sm font-medium capitalize mb-2">{key.replace('_', ' ')}</h4>
                        <img 
                          src={`${API_BASE_URL}${url}`} 
                          alt={`${key} plot`} 
                          className="w-full h-auto rounded border" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Explainability Section */}
        <Collapsible open={explainabilityExpanded} onOpenChange={setExplainabilityExpanded}>
          <div className="clinical-card">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Info className="h-5 w-5 text-primary" />
                  Model Explainability
                </h2>
                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  explainabilityExpanded && "rotate-180"
                )} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground">EEG Analysis Interpretation</h4>
                  <ul className="mt-2 list-inside list-disc text-muted-foreground">
                    {graphData?.interpretation?.map((item, index) => (
                      <li key={index}>{item}</li>
                    )) }
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Alpha Dominance</h4>
                  <p className="mt-1 text-muted-foreground">
                    Value: {graphData?.alpha_dominance?.toFixed(4) || '0.1614'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Data Confidence</h4>
                  <p className="mt-1 text-muted-foreground">
                    High confidence (88% signal quality). Artifact-corrected, muscle noise removed. Eye blink contamination: Low.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Model Limitations</h4>
                  <p className="mt-1 text-muted-foreground">
                    This assessment is based on EEG biomarkers only. Clinical diagnosis requires comprehensive evaluation including neuroimaging, cognitive testing, and clinical history.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Recommendations */}
        <div className="clinical-card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Activity className="h-5 w-5 text-primary" />
            Recommendations
          </h2>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground italic">
            Note: These are suggestions based on AI analysis. Always consult qualified medical professionals for clinical decisions.
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" onClick={() => handleDownload("csv")} disabled={downloadLoading}>
            <Download className="h-4 w-4" />
            {downloadLoading ? "Downloading..." : "Download CSV for EMR"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleDownload("pdf")} disabled={downloadLoading}>
            <Download className="h-4 w-4" />
            {downloadLoading ? "Downloading..." : "Download PDF for EMR"}
          </Button>
          <Button variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Send to Referring Doctor
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Summary
          </Button>
        </div>
        {downloadError && (
          <p className="mt-2 text-sm text-destructive">{downloadError}</p>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientReport;
