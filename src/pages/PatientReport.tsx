import { useEffect, useState, useRef } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import { downloadPrescription, getFileExtension } from "@/app/reports";
import ReportSummary from "./ReportSummary";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

// Mock patient datakaise
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
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Check if navigated from patient history page
  const fromPatientHistory = location.state?.fromPatientHistory || false;
  const reportId = location.state?.reportId ? decodeURIComponent(location.state.reportId) : jobId;
  const POLL_INTERVAL_MS = 5000;

  const [patientData, setPatientData] = useState(initialPatientData);
  const [cognitiveMarkers, setCognitiveMarkers] = useState(initialCognitiveMarkers);
  const [brainAgeData, setBrainAgeData] = useState(initialBrainAgeData);
  const [riskTrendData, setRiskTrendData] = useState(initialRiskTrendData);
  const [graphData, setGraphData] = useState(null);
  const [csvDownloadLoading, setCsvDownloadLoading] = useState(false);
  const [pdfDownloadLoading, setPdfDownloadLoading] = useState(false);
  const [screenshotPdfLoading, setScreenshotPdfLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<"analysis" | "summary">("summary");
  
  // Prescription modal state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState<{ url: string; blob: Blob; fileName: string; textContent?: string } | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  
  // AI Recommendation modal state
  const [aiRecommendationModalOpen, setAiRecommendationModalOpen] = useState(false);
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
  const summaryResultId =
    patientInfo?.result_id ??
    patientInfo?.resultId ??
    patientInfo?.report?.result_id ??
    patientInfo?.data?.result_id ??
    (fromPatientHistory ? reportId : null);

  console.log('summaryResultId:', summaryResultId, 'fromPatientHistory:', fromPatientHistory, 'reportId:', reportId);

  const getRiskBadgeVariant = (level: string) => {
    if (!level) return "secondary";
    const key = level.toLowerCase();
    if (key.includes("high")) return "riskHigh";
    if (key.includes("moderate")) return "riskModerate";
    if (key.includes("low")) return "riskLow";
    return "secondary";
  };

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

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

        const hasReportData = Boolean(cardsData?.cards || cardsData?.patient_info || cardsData?.rf_risk);
        const isAiSuccess = cardsData?.ai_status === "success";

        if (cardsData && hasReportData) {
          setCognitiveMarkers(cardsData.cards ?? cardsData);
          setPatientInfo(cardsData);
        }

        // Stop polling if we have data from either source
        if (!cancelled && (hasReportData || (fromPatientHistory && cardsData))) {
          setIsLoading(false);
        }

        if (!cancelled && !hasReportData && !fromPatientHistory) {
          timeoutId = setTimeout(loadCardAndGraphData, POLL_INTERVAL_MS);
          return;
        }

        const encodedJobId = reportId ? encodeURIComponent(reportId) : "";
        const graphsRes = await fetchWithAuth(`${API_BASE_URL}/graphs/${encodedJobId}`);
        if (graphsRes.ok) {
          const graphDataResponse = await graphsRes.json();
          setGraphData(graphDataResponse);
        }

        if (!cancelled && hasReportData && !isAiSuccess && !fromPatientHistory) {
          timeoutId = setTimeout(loadCardAndGraphData, POLL_INTERVAL_MS);
          return;
        }

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading report data:", error);
        if (!cancelled && !fromPatientHistory) {
          timeoutId = setTimeout(loadCardAndGraphData, POLL_INTERVAL_MS);
        } else if (!cancelled && fromPatientHistory) {
          setIsLoading(false);
        }
      }
    };

    loadCardAndGraphData();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fromPatientHistory, reportId]);

  // historypreview(jobId).then((data) => {
  //   console.log(data, "historypreview");
  // });


  const handleDownload = async (format: "pdf" | "csv" = "pdf") => {
    if (!reportId) {
      console.error("No reportId available for download");
      setDownloadError("No report ID available. Please try refreshing the page.");
      return;
    }

    // Set appropriate loading state based on format
    if (format === "csv") {
      setCsvDownloadLoading(true);
    } else {
      setPdfDownloadLoading(true);
    }
    setDownloadError(null);

    try {
      const encodedReportId = reportId ? encodeURIComponent(reportId) : "";
      const endpoint = `${API_BASE_URL}/download/${encodedReportId}${format === "csv" ? "?format=csv" : ""}`;
      console.log("Attempting download from:", endpoint);
      
      const res = await fetchWithAuth(endpoint);
      console.log("Download response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Download failed with response:", errorText);
        throw new Error(`Download request failed: ${res.status} ${errorText}`);
      }

      const blob = await res.blob();
      console.log("Download blob size:", blob.size, "type:", blob.type);
      
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Method 1: Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient_report_${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      console.log("Download completed successfully");
    } catch (error) {
      console.error("Failed to download report:", error);
      
      // Try alternative method if first fails
      try {
        console.log("Trying alternative download method...");
        const encodedReportId = reportId ? encodeURIComponent(reportId) : "";
        const endpoint = `${API_BASE_URL}/download/${encodedReportId}${format === "csv" ? "?format=csv" : ""}`;
        
        // Open in new tab as fallback
        window.open(endpoint, '_blank');
        setDownloadError("Download opened in new tab. Please save it manually.");
      } catch (fallbackError) {
        console.error("Alternative download also failed:", fallbackError);
        setDownloadError(`Download failed: ${error.message || 'Unknown error'}. Please try again or check your internet connection.`);
      }
    } finally {
      // Reset appropriate loading state based on format
      if (format === "csv") {
        setCsvDownloadLoading(false);
      } else {
        setPdfDownloadLoading(false);
      }
    }
  };

  const handlePrescriptionDownload = async () => {
    if (!reportId) {
      console.error("No reportId available for prescription download");
      return;
    }

    try {
      // Use the result ID for the API call
      const { url, blob } = await downloadPrescription(reportId);
      
      // Detect file type from MIME type
      const fileExtension = getFileExtension(blob.type);
      const fileName = `prescription_${reportId}.${fileExtension}`;
      
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
    }
  };

  const handlePrescriptionView = async () => {
    if (!reportId) {
      console.error("No reportId available for prescription view");
      return;
    }

    setPrescriptionLoading(true);
    setPrescriptionModalOpen(true);

    try {
      // Use the API endpoint for prescription download
      const { url, blob } = await downloadPrescription(reportId);
      
      // Detect file type from MIME type
      const fileExtension = getFileExtension(blob.type);
      const fileName = `prescription_${reportId}.${fileExtension}`;
      
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

  const handleAiRecommendationView = () => {
    setAiRecommendationModalOpen(true);
  };

  const handleAiRecommendationDownload = () => {
    const parsedSummary = parseAiSummary(patientInfo.ai_recommendation);
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Set font sizes and colors
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    
    // Add title
    doc.text('AI Recommendations', 20, 30);
    
    // Add patient info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const patientName = patientInfo.patient_info?.name || 'Patient';
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Patient: ${patientName}`, 20, 45);
    doc.text(`Date: ${currentDate}`, 20, 55);
    
    // Add recommendations
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Recommendations:', 20, 75);
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    let yPosition = 85;
    const lineHeight = 8;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    parsedSummary.forEach((recommendation, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Add recommendation with bullet point
      const text = `${index + 1}. ${recommendation}`;
      const lines = doc.splitTextToSize(text, 170);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = 30;
        }
        doc.text(line, 25, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += 3; // Extra space between recommendations
    });
    
    // Add footer note
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Note: These are suggestions based on AI analysis. Always consult qualified medical professionals for clinical decisions.', 20, yPosition);
    
    // Save the PDF
    doc.save(`ai_recommendations_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleScreenshotPdf = async () => {
    setDownloadError(null);

    // if (!reportRef.current) {
    //   console.error("Report ref not available");
    //   setDownloadError("Report content is not ready yet. Please wait a moment and try again.");
    //   return;
    // }

    // setScreenshotPdfLoading(true);

    // const reportElement = reportRef.current;
    // const originalWidth = reportElement.style.width;
    // const originalMaxWidth = reportElement.style.maxWidth;
    window.print()


    // try {
    //   // reportElement.style.width = "1180px";
    //   // reportElement.style.maxWidth = "1180px";
    //   // reportElement.style.margin = "0";
    //   //       reportElement.style.padding = "0";

    //   reportElement.style.transform = "translateY(0)";
    //   await new Promise((resolve) => requestAnimationFrame(resolve));

    //   // Capture the report content as a canvas
    //   const canvas = await html2canvas(reportElement, {
    //     scale: 2, // Higher scale for better quality
    //     useCORS: true,
    //     // logging: false,
    //     backgroundColor: '#ffffff',
    //     // width: reportElement.scrollWidth,
    //     // height: reportElement.scrollHeight ,
    //     // windowWidth: 1280,
    //     // windowHeight: reportElement.scrollHeight,
    //     scrollX: 0,
    //     scrollY: 0,
    //   });

    //   const imgData = canvas.toDataURL('image/png');
      
    //   const pdf = new jsPDF('p', 'mm', 'a4');
    //   const pageWidth = pdf.internal.pageSize.getWidth();
    //   const pageHeight = pdf.internal.pageSize.getHeight();
    //   const pageMargin = 0;
    //   const maxWidth = pageWidth - pageMargin * 2;
    //   const maxHeight = pageHeight - pageMargin * 2;
    //   const imageRatio = canvas.width / canvas.height;
    //   const pageRatio = maxWidth / maxHeight;
    //   const imgWidth = imageRatio > pageRatio ? maxWidth : maxHeight * imageRatio;
    //   const imgHeight = imageRatio > pageRatio ? maxWidth / imageRatio : maxHeight;
    //   const x = (pageWidth - imgWidth) / 2;
    //   const y = (pageHeight - imgHeight) / 2;

    //   pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

    //   // Save the PDF
    //   const patientName = patientInfo?.patient_info?.name || 'Patient';
    //   pdf.save(`patient_report_screenshot_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    // } catch (error) {
    //   console.error('Error generating screenshot PDF:', error);
    //   alert('Failed to generate PDF screenshot. Please try again.');
    // } finally {
    //   reportElement.style.width = originalWidth;
    //   reportElement.style.maxWidth = originalMaxWidth;
    //   // reportElement.style.margin = originalMargin;
    //   // reportElement.style.transform = originalTransform;
    //   setScreenshotPdfLoading(false);
    // }
  };

  const markerItems = Array.isArray(cognitiveMarkers)
    ? cognitiveMarkers
    : cognitiveMarkers?.cards || [];
  const abnormalMarkerCount = markerItems.filter((m) => m.status === "abnormal").length;

 const parseAiSummary = (aiSummary: string | null | undefined): string[] => {
  if (!aiSummary) return [];

  try {
    // Case 1: Agar already array hai
    if (Array.isArray(aiSummary)) {
      return aiSummary;
    }

    // Case 2: JSON string hai (jaise tumhara example)
    let parsed = aiSummary.trim();

    // Agar string JSON array jaisa hai to parse karo
    if (parsed.startsWith("{") || parsed.startsWith("[")) {
      // Kuch strings mein outer {} hote hain, usko [] mein convert kar dete hain
      if (parsed.startsWith("{") && parsed.endsWith("}")) {
        parsed = "[" + parsed.slice(1, -1) + "]";
      }
      const result = JSON.parse(parsed);
      return Array.isArray(result) ? result : [aiSummary];
    }

    // Case 3: Normal string hai (fallback)
    return [aiSummary];

  } catch (error) {
    console.error("Error parsing AI Summary:", error);
    // Agar parse fail ho jaye toh pura text ek hi line mein dikhao
    return [aiSummary];
  }
};

  // Parse JSON-formatted medical observations
  const parseMedicalObservations = (observations: string) => {
    try {
      // Remove outer braces and split by comma
      const cleaned = observations.replace(/[{}]/g, '');
      const items = cleaned.split(',').map(item => {
        // Remove quotes and trim
        return item.replace(/"/g, '').trim();
      }).filter(item => item.length > 0);
      
      return items;
    } catch (error) {
      console.error('Error parsing medical observations:', error);
      return [observations];
    }
  };

  // Format AI recommendations from clinical interpretation text
  const formatAiRecommendations = (aiText: string | null | undefined): string[] => {
    if (!aiText) return [];

    try {
      const recommendations: string[] = [];
      
      // Extract clinical assessment findings
      if (aiText.includes('high risk for cognitive decline')) {
        recommendations.push('🔴 **High Risk Alert**: Patient shows elevated risk for cognitive decline based on EEG biomarkers');
      }
      
      // Extract signal quality concerns
      if (aiText.includes('Signal Quality Score')) {
        recommendations.push('📊 **Signal Quality**: Suboptimal recording conditions detected - consider repeat EEG if clinically indicated');
      }
      
      // Extract specific EEG findings
      if (aiText.includes('Posterior Dominance Index')) {
        recommendations.push('🧠 **EEG Finding**: Abnormal posterior-to-anterior dominance suggests disrupted cognitive networks');
      }
      
      if (aiText.includes('Alpha Peak Gradient')) {
        recommendations.push('⚡ **EEG Marker**: Elevated Alpha Peak Gradient indicates altered cortical function');
      }
      
      if (aiText.includes('Frontal Theta Beta Ratio')) {
        recommendations.push('📉 **EEG Marker**: Reduced Frontal Theta Beta Ratio may impact memory processes');
      }
      
      // Extract follow-up recommendations
      if (aiText.includes('neuropsychological assessment')) {
        recommendations.push('🔍 **Recommended**: Comprehensive neuropsychological assessment for detailed cognitive evaluation');
      }
      
      if (aiText.includes('MRI')) {
        recommendations.push('🖼️ **Imaging**: Consider MRI for structural and functional brain mapping correlations');
      }
      
      // Extract referral suggestions
      if (aiText.includes('memory specialist')) {
        recommendations.push('👥 **Referral**: Consider referral to memory specialist or Alzheimer\'s disease center');
      }
      
      // Extract lifestyle interventions
      if (aiText.includes('lifestyle interventions')) {
        recommendations.push('🏃‍♂️ **Lifestyle**: Implement cognitive health interventions - regular exercise, mental stimulation, social engagement');
      }
      
      if (aiText.includes('diet')) {
        recommendations.push('🥗 **Nutrition**: Balanced diet rich in omega-3 fatty acids recommended');
      }
      
      if (aiText.includes('sleep hygiene')) {
        recommendations.push('😴 **Sleep**: Good sleep hygiene practices essential for cognitive health');
      }
      
      // Extract limitations
      if (aiText.includes('limitations of EEG')) {
        recommendations.push('⚠️ **Limitation**: EEG screening has lower sensitivity for early dementia - comprehensive clinical workup required');
      }
      
      // If no specific patterns found, split by sentences and format
      if (recommendations.length === 0) {
        const sentences = aiText.split('.').filter(s => s.trim().length > 20);
        sentences.forEach((sentence, index) => {
          if (index < 5) { // Limit to top 5 recommendations
            recommendations.push(`• ${sentence.trim()}`);
          }
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error formatting AI recommendations:', error);
      return [aiText];
    }
  };

  const riskPercentage = patientInfo?.rf_risk?.percentage ?? patientInfo?.decline_summary?.percent ?? "N/A";
  const riskCategory = patientInfo?.rf_risk?.category ?? "N/A";
  const isAiRecommendationLoading = patientInfo?.ai_status && patientInfo.ai_status !== "success" && !patientInfo?.ai_summary && !fromPatientHistory;



  const renderFormattedAIText = (text: string) => {
  if (!text) return null;

  // Split into sentences (smart split)
  const sentences = text
    .replace(/\n/g, " ")
    .split(/(?<=\.)\s+(?=[A-Z])/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {sentences.map((sentence, index) => {
        const lower = sentence.toLowerCase();

        // Highlight important lines
        const isImportant =
          lower.includes("high risk") ||
          lower.includes("abnormal") ||
          lower.includes("significant");

        const isRecommendation =
          lower.includes("recommended") ||
          lower.includes("should") ||
          lower.includes("consider");

        return (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              isImportant
                ? "bg-red-50 border-red-200"
                : isRecommendation
                ? "bg-blue-50 border-blue-200"
                : "bg-muted/20 border-border"
            }`}
          >
            {sentence}
          </div>
        );
      })}
    </div>
  );
};
  // Show loader if data is loading
  if (isLoading || !patientInfo) {
    return (
      <MainLayout>
        <PageLoader text="Loading patient report..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Top action bar */}
        <div className="flex mb-5 flex-col gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
  
  {/* Tabs */}
  <div className="inline-flex w-fit  rounded-xl bg-muted/70 p-1">
    <button
      type="button"
      onClick={() => setActiveReportTab("summary")}
      disabled={!summaryResultId}
      className={cn(
        "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
        activeReportTab === "summary"
          ? "bg-background text-foreground shadow-md"
          : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
        !summaryResultId && "cursor-not-allowed opacity-50"
      )}
    >
      Report Summary
    </button>

    <button
      type="button"
      onClick={() => setActiveReportTab("analysis")}
      className={cn(
        "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
        activeReportTab === "analysis"
          ? "bg-background text-foreground shadow-md"
          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
      )}
    >
      Cognitive Analysis
    </button>
  </div>

{activeReportTab !== "analysis" && (
 <div className="flex justify-end">
    <Button
      className="gap-2 rounded-xl px-5 shadow-sm transition-all hover:scale-[1.02]"
      onClick={handleScreenshotPdf}
      disabled={screenshotPdfLoading}
    >
      <Download className="h-4 w-4" />
      {screenshotPdfLoading
        ? "Generating PDF..."
        : "Print PDF"}
    </Button>
  </div>  )}
</div>
        {activeReportTab === "summary" ? (
          <div ref={reportRef} className="bg-background">
            {summaryResultId ? (
              <ReportSummary embedded embeddedResultId={String(summaryResultId)} />
            ) : (
              <PageLoader text="Waiting for report summary..." />
            )}
          </div>
        ) : (
        <>
        <div ref={reportRef} id="print-report" className="space-y-6 bg-background p-2">
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
<div className="rounded-2xl border bg-white border-border/50 p-5 shadow-sm">
  
  {/* Header */}
  <div className="mb-5 flex items-start justify-between gap-4">
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <AlertCircle className="h-4 w-4 text-primary" />
        </div>
        AI Risk Interpretation
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {patientInfo?.decline_summary?.band}
      </p>
    </div>

    <div
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold",
        riskPercentage >= 70
          ? "bg-red-100 text-red-700"
          : riskPercentage >= 40
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700"
      )}
    >
      {riskCategory}
    </div>
  </div>

  {/* Compact 4 Cards */}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

    {/* Risk Percentage */}
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">
        Risk Percentage
      </p>

      <h3
        className={cn(
          "mt-2 text-3xl font-bold",
          riskPercentage >= 70
            ? "text-risk-high"
            : riskPercentage >= 40
            ? "text-risk-moderate"
            : "text-green-600"
        )}
      >
        {riskPercentage.toFixed(2)}%
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        Age: {patientInfo?.patient_info?.age}
      </p>
    </div>

    {/* Abnormal Markers */}
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">
        Abnormal Markers
      </p>

      <h3 className="mt-2 text-3xl font-bold text-primary">
        {abnormalMarkerCount}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        out of {markerItems.length}
      </p>
    </div>

    {/* Brain Age */}
    <div
      className={cn(
        "rounded-xl border p-4 shadow-sm",
        patientInfo?.brain_age_analysis?.brain_age_gap > 5
          ? "border-red-200 bg-red-50"
          : patientInfo?.brain_age_analysis?.brain_age_gap > 0
          ? "border-yellow-200 bg-yellow-50"
          : "border-green-200 bg-green-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Brain Age
          </p>

          <h3
            className={cn(
              "mt-2 text-3xl font-bold",
              patientInfo?.brain_age_analysis?.brain_age_gap > 5
                ? "text-red-600"
                : patientInfo?.brain_age_analysis?.brain_age_gap > 0
                ? "text-yellow-600"
                : "text-green-600"
            )}
          >
            {patientInfo?.brain_age_analysis?.functional_brain_age}
          </h3>
        </div>

        <div className="text-2xl">🧠</div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Gap: {patientInfo?.brain_age_analysis?.brain_age_gap}
        </span>

        <span
          className={cn(
            "font-semibold",
            patientInfo?.brain_age_analysis?.brain_age_gap > 5
              ? "text-red-600"
              : patientInfo?.brain_age_analysis?.brain_age_gap > 0
              ? "text-yellow-600"
              : "text-green-600"
          )}
        >
          {patientInfo?.brain_age_analysis?.brain_age_gap > 5
            ? "High"
            : patientInfo?.brain_age_analysis?.brain_age_gap > 0
            ? "Moderate"
            : "Healthy"}
        </span>
      </div>
    </div>

    {/* Risk Category */}
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">
        Risk Category
      </p>

      <h3
        className={cn(
          "mt-2 text-[20px] font-bold",
          riskCategory?.toLowerCase().includes("low")
            ? "text-green-600"
            : riskCategory?.toLowerCase().includes("moderate")
            ? "text-risk-moderate"
            : "text-risk-high"
        )}
      >
        {riskCategory}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground">
        Classification
      </p>
    </div>
  </div>

  {/* Interpretation */}
  <div className="mt-4 rounded-xl border bg-muted/30 p-4">
    <p className="text-sm leading-6 text-muted-foreground">
      {
        patientInfo?.brain_age_analysis
          ?.brain_age_interpretation
      }
    </p>
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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              AI Recommendations
            </h2>
          {patientInfo.ai_status === "success" && patientInfo.ai_recommendation && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={handleAiRecommendationView}>
                <Eye className="h-4 w-4" />
                View Detail
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={handleAiRecommendationDownload}>
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>)}
          </div>
          {isAiRecommendationLoading ? (
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-5">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              <div className="flex items-start gap-4">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <div className="absolute h-11 w-11 animate-ping rounded-full bg-primary/20" />
                  <Brain className="relative h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">Generating AI clinical insights</p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {patientInfo.ai_status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recommendations are being prepared and will appear here automatically.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
                    <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-muted" />
                    <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
                {(() => {
                  const parsedSummary = parseAiSummary(patientInfo.ai_summary);
                  console.log('Final parsed summary for rendering:', parsedSummary);
                  return parsedSummary.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    {rec}
                  </li>
                  ));
                })()}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground italic">
            Note: These are suggestions based on AI analysis. Always consult qualified medical professionals for clinical decisions.
          </p>
        </div>

        </div>
        {/* Export Actions */}
        <div className="flex flex-wrap gap-3">
          {/* <Button className="gap-2" onClick={() => handleScreenshotPdf()} disabled={screenshotPdfLoading}>
            <Download className="h-4 w-4" />
            {screenshotPdfLoading ? "Generating PDF..." : "Save Report as PDF"}
          </Button> */}
          <Button className="gap-2" onClick={() => handleDownload("csv")} disabled={csvDownloadLoading}>
            <Download className="h-4 w-4" />
            {csvDownloadLoading ? "Downloading..." : "Download CSV for EMR"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleDownload("pdf")} disabled={pdfDownloadLoading}>
            <Download className="h-4 w-4" />
            {pdfDownloadLoading ? "Downloading..." : "Download PDF for EMR"}
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const subject = encodeURIComponent(
                `Patient Report - ${patientInfo?.patient_info?.name || ''}`
              );
              const body = encodeURIComponent(
                `Please find the patient report details below.\n\nReport ID: ${reportId || ''}\nPatient: ${patientInfo?.patient_info?.name || ''}\nAge/Gender: ${patientInfo?.patient_info?.age || ''} / ${patientInfo?.patient_info?.gender || ''}\n`
              );
              window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }}
          >
            <Mail className="h-4 w-4" />
            Send to Referring Doctor
          </Button>
        </div>
        {downloadError && (
          <p className="mt-2 text-sm text-destructive">{downloadError}</p>
        )}

        {/* Prescription Modal */}
        <Dialog open={prescriptionModalOpen} onOpenChange={setPrescriptionModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Prescription View</DialogTitle>
            </DialogHeader>
            {prescriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading prescription...</span>
              </div>
            ) : currentPrescription ? (
              <div className="space-y-4">
               
                {currentPrescription.blob.type.startsWith('text/') ? (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {currentPrescription.textContent}
                    </pre>
                  </div>
                ) : currentPrescription.blob.type.startsWith('image/') ? (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <img 
                      src={currentPrescription.url} 
                      alt="Prescription" 
                      className="max-w-full h-auto mx-auto"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <iframe
                      src={currentPrescription.url}
                      className="w-full h-[600px]"
                      title="Prescription"
                    />
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* AI Recommendation Modal */}
        <Dialog open={aiRecommendationModalOpen} onOpenChange={setAiRecommendationModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Recommendations Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
             
              {renderFormattedAIText(patientInfo.ai_recommendation)}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setAiRecommendationModalOpen(false)}>
                  Close
                </Button>
               
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientReport;
