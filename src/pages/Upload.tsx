import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Upload as UploadIcon, 
  FileText, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/app/config";

type Step = 1 | 2 | 3;

interface QualityResult {
  overallScore: number;
  badChannels: string[];
  muscleArtifacts: "Low" | "Moderate" | "High";
  eyeBlinkContamination: "Low" | "Moderate" | "High";
}

const Upload = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    gender: "",
    id: "",
    notes: "",
    mocaScore: "",
    mmseScore: "",
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.edf') || droppedFile.name.endsWith('.bdf'))) {
      setFile(droppedFile);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload an EDF or BDF file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const runQualityCheck = async () => {
    if (!uploadedFileId) return;

    // Move to Quality Check step immediately so the user sees the spinner
    setCurrentStep(3);
    setIsAnalyzing(true);

    try {
      // Save patient info (POST) using the job_id
      const savePatientResponse = await fetchWithAuth(`${API_BASE_URL}/patient-info/${uploadedFileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          id: patientInfo.id,
          notes: patientInfo.notes,
          moca_score: patientInfo.mocaScore,
          mmse_score: patientInfo.mmseScore,
        }),
      });

      if (savePatientResponse.ok) {
        const patientData = await savePatientResponse.json();
        setPatientInfo({
          name: patientData.name || "",
          age: patientData.age || "",
          gender: patientData.gender || "",
          id: patientData.id || "",
          notes: patientData.notes || "",
          mocaScore: patientData.moca_score || "",
          mmseScore: patientData.mmse_score || "",
        });
      }

      // Fetch quality check results
      const qualityResponse = await fetchWithAuth(`${API_BASE_URL}/quality-check/${uploadedFileId}`, {
        method: 'GET',
      });

      if (qualityResponse.ok) {
        const qualityData = await qualityResponse.json();
        setQualityResult({
          overallScore: qualityData.overall_quality || 0,
          badChannels: qualityData.bad_channels || [],
          muscleArtifacts: qualityData.muscle_artifacts || "Low",
          eyeBlinkContamination: qualityData.eye_blinks || "Low",
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to save patient info or load quality check results.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadAndContinue = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithAuth(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const jobId = result.job_id || result.id; // Get job_id from response
      setUploadedFileId(jobId);

      toast({
        title: "Upload Successful",
        description: "File uploaded successfully.",
      });

      setCurrentStep(2);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!uploadedFileId) {
      toast({
        title: "No Job ID",
        description: "Please upload a file first to generate a report.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Generated",
      description: "Processing complete. Redirecting to patient report...",
    });

    // Redirect immediately using the known jobId
    navigate(`/report/${uploadedFileId}`);
  };

  const steps = [
    { number: 1, title: "Upload EEG", icon: UploadIcon },
    { number: 2, title: "Patient Info", icon: User },
    { number: 3, title: "Quality Check", icon: CheckCircle2 },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">New EEG Screening</h1>
          <p className="text-muted-foreground">Upload EEG data and run dementia risk assessment</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  currentStep === step.number && "step-active",
                  currentStep > step.number && "step-complete",
                  currentStep < step.number && "step-pending"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "mx-4 h-0.5 w-16",
                  currentStep > step.number ? "bg-risk-low" : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="clinical-card">
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Upload EEG File</h2>
                <p className="mt-1 text-sm text-muted-foreground">Supported formats: EDF, BDF</p>
              </div>

              <div
                className={cn(
                  "upload-zone",
                  isDragging && "upload-zone-active",
                  file && "border-risk-low bg-risk-low-bg"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-risk-low" />
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {!uploadedFileId && (
                      <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                        Remove
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <UploadIcon className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Drag and drop your EEG file here</p>
                      <p className="text-sm text-muted-foreground">or click to browse</p>
                    </div>
                    <input
                      type="file"
                      accept=".edf,.bdf"
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileSelect}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" asChild>
                        <span>Browse Files</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUploadAndContinue} disabled={!file || isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Patient Info */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Patient Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Enter patient details for the screening</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Patient Name *</Label>
                  <Input
                    id="name"
                    value={patientInfo.name}
                    onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">Patient ID *</Label>
                  <Input
                    id="id"
                    value={patientInfo.id}
                    onChange={(e) => setPatientInfo({ ...patientInfo, id: e.target.value })}
                    placeholder="Hospital ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    value={patientInfo.age}
                    onChange={(e) => setPatientInfo({ ...patientInfo, age: e.target.value })}
                    placeholder="Years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Input
                    id="gender"
                    value={patientInfo.gender}
                    onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                    placeholder="M / F / Other"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Clinical Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={patientInfo.notes}
                  onChange={(e) => setPatientInfo({ ...patientInfo, notes: e.target.value })}
                  placeholder="Any relevant clinical observations..."
                  rows={3}
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Neuropsych Scores (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moca">MoCA Score</Label>
                    <Input
                      id="moca"
                      type="number"
                      value={patientInfo.mocaScore}
                      onChange={(e) => setPatientInfo({ ...patientInfo, mocaScore: e.target.value })}
                      placeholder="0-30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mmse">MMSE Score</Label>
                    <Input
                      id="mmse"
                      type="number"
                      value={patientInfo.mmseScore}
                      onChange={(e) => setPatientInfo({ ...patientInfo, mmseScore: e.target.value })}
                      placeholder="0-30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={runQualityCheck}
                  disabled={!patientInfo.name || !patientInfo.id || !patientInfo.age || !patientInfo.gender}
                >
                  Run Quality Check <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Quality Check */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">EEG Quality Analysis</h2>
                <p className="mt-1 text-sm text-muted-foreground">Automated signal quality assessment</p>
              </div>

              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-4 py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analyzing EEG signal quality...</p>
                </div>
              ) : qualityResult && (
                <div className="space-y-4">
                  {/* Overall Score */}
                  <div className={cn(
                    "rounded-xl p-6 text-center",
                    qualityResult.overallScore >= 80 ? "bg-risk-low-bg" :
                    qualityResult.overallScore >= 60 ? "bg-risk-moderate-bg" :
                    "bg-risk-high-bg"
                  )}>
                    <p className="text-sm font-medium text-muted-foreground">Overall Quality Score</p>
                    <p className={cn(
                      "text-5xl font-bold",
                      qualityResult.overallScore >= 80 ? "text-risk-low" :
                      qualityResult.overallScore >= 60 ? "text-risk-moderate" :
                      "text-risk-high"
                    )}>
                      {qualityResult.overallScore}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">out of 100</p>
                  </div>

                  {/* Quality Warning */}
                  {qualityResult.overallScore < 60 && (
                    <div className="flex items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high-bg p-4">
                      <AlertCircle className="h-5 w-5 text-risk-high flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-risk-high">Poor Signal Quality</p>
                        <p className="text-sm text-muted-foreground">
                          Please consider re-recording. Low quality signals may affect diagnostic accuracy.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Quality Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Bad Channels</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {qualityResult.badChannels.map((ch) => (
                          <Badge key={ch} variant="riskModerate">{ch}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <p className="text-sm text-muted-foreground">Muscle Artifacts</p>
                      <Badge 
                        variant={
                          qualityResult.muscleArtifacts === "Low" ? "riskLow" :
                          qualityResult.muscleArtifacts === "Moderate" ? "riskModerate" :
                          "riskHigh"
                        }
                        className="mt-2"
                      >
                        {qualityResult.muscleArtifacts}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-border p-4 col-span-2">
                      <p className="text-sm text-muted-foreground">Eye Blink Contamination</p>
                      <Badge 
                        variant={
                          qualityResult.eyeBlinkContamination === "Low" ? "riskLow" :
                          qualityResult.eyeBlinkContamination === "Moderate" ? "riskModerate" :
                          "riskHigh"
                        }
                        className="mt-2"
                      >
                        {qualityResult.eyeBlinkContamination}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  Back
                </Button>
                <Button onClick={handleGenerateReport} disabled={isAnalyzing}>
                  Generate Report <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Upload;
