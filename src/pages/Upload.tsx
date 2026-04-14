import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Upload as UploadIcon, 
  FileText, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/app/config";
import { getPatientsDb, createPatient, PatientPayload } from "@/app/patients";

type Step = 1 | 2 | 3;

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
}

interface QualityResult {
  overallScore: number;
  badChannels: string[];
  muscleArtifacts: "Low" | "Moderate" | "High";
  eyeBlinkContamination: "Low" | "Moderate" | "High";
}

const Upload = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [patients, setPatients] = useState<Patient[]>([]);  
  const [selectedPatientCode, setSelectedPatientCode] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  
  const [patientInfo, setPatientInfo] = useState({
    name: "",
    age: "",
    gender: "",
    id: "",
    notes: "",
    mocaScore: "",
    mmseScore: "",
  });

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "",
    patient_code: "",
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatientsDb();
        const list = Array.isArray(data) ? data : data.patients ?? [];
        setPatients(list);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    if (!patientSearch.trim()) return true;
    const query = patientSearch.toLowerCase().trim();
    return [patient.name, patient.patient_code, patient.gender]
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const handlePatientSelect = (value: string) => {
    if (value === "add-new") {
      setIsAddPatientModalOpen(true);
    } else {
      setSelectedPatientCode(value);
      const patient = patients.find(p => p.patient_code === value);
      if (patient) {
        setPatientInfo({
          name: patient.name,
          age: patient.age.toString(),
          gender: patient.gender,
          id: patient.patient_code,
          notes: "",
          mocaScore: "",
          mmseScore: "",
        });
      }
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.gender || !newPatient.patient_code) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: PatientPayload = {
        hospital_id: 1, // Assuming default hospital_id
        patient_code: newPatient.patient_code,
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
      };

      await createPatient(payload);

      // Refresh patients list
      const data = await getPatientsDb();
      const list = Array.isArray(data) ? data : data.patients ?? [];
      setPatients(list);

      // Select the new patient
      setSelectedPatientCode(newPatient.patient_code);
      setPatientInfo({
        name: newPatient.name,
        age: newPatient.age,
        gender: newPatient.gender,
        id: newPatient.patient_code,
        notes: "",
        mocaScore: "",
        mmseScore: "",
      });

      // Close modal and reset form
      setIsAddPatientModalOpen(false);
      setNewPatient({
        name: "",
        age: "",
        gender: "",
        patient_code: "",
      });

      toast({
        title: "Patient Added",
        description: "New patient has been added successfully.",
      });
    } catch (error) {
      console.error('Error adding patient:', error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNextFromPatientSelect = () => {
    if (selectedPatientCode) {
      setCurrentStep(2);
    } else {
      toast({
        title: "Select Patient",
        description: "Please select a patient first.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleUploadAndContinue = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_code', selectedPatientCode);

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

      // Save patient info (POST) using the job_id
      const savePatientResponse = await fetchWithAuth(`${API_BASE_URL}/patient-info/${jobId}`, {
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

      toast({
        title: "Upload Successful",
        description: "File uploaded and patient information saved. Proceeding to quality check.",
      });

      // Move to step 3 for quality check
      setCurrentStep(3);

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

  const runQualityCheck = async () => {
    if (!uploadedFileId) return;

    setIsAnalyzing(true);

    try {
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

        toast({
          title: "Quality Check Complete",
          description: "Analysis completed successfully.",
        });
      } else {
        throw new Error('Quality check failed');
      }
    } catch (error) {
      console.error('Error in quality check:', error);
      toast({
        title: "Quality Check Failed",
        description: "Failed to run quality analysis. You can still generate a report.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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
    { number: 1, title: "Select Patient", icon: User },
    { number: 2, title: "Upload EEG", icon: UploadIcon },
    { number: 3, title: "Quality Check", icon: CheckCircle2 },
  ];

  return (
    <MainLayout>
      <Dialog open={isAddPatientModalOpen} onOpenChange={setIsAddPatientModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the details for the new patient.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-name"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                className="col-span-3"
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-patient-code" className="text-right">
                Patient ID
              </Label>
              <Input
                id="new-patient-code"
                value={newPatient.patient_code}
                onChange={(e) => setNewPatient({ ...newPatient, patient_code: e.target.value })}
                className="col-span-3"
                placeholder="Unique patient code"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-age" className="text-right">
                Age
              </Label>
              <Input
                id="new-age"
                type="number"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                className="col-span-3"
                placeholder="Age in years"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-gender" className="text-right">
                Gender
              </Label>
              <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddPatientModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddPatient}>
              Add Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          {/* Step 1: Patient Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Select Patient</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose a patient for the EEG screening</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Patient</Label>
                  <Select value={selectedPatientCode} onValueChange={handlePatientSelect}>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Choose a patient or add new..." />
                    </SelectTrigger>
                    <SelectContent className="w-full min-w-[20rem] max-w-md">
                      <div className="px-3 pt-3 pb-2">
                        <div className="text-sm font-semibold text-foreground">Search patients</div>
                        <Input
                          value={patientSearch}
                          onChange={(event) => setPatientSearch(event.target.value)}
                          placeholder="Type name, ID or gender..."
                          className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="border-t border-border/70 my-2" />
                      <SelectItem value="add-new" className="rounded-xl px-3 py-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Plus className="h-4 w-4" />
                          Add New Patient
                        </div>
                      </SelectItem>
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => (
                          <SelectItem key={p.patient_code} value={p.patient_code} className="rounded-xl px-3 py-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-muted-foreground">{p.patient_code} · {p.gender} · {p.age} yrs</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-sm text-muted-foreground">No patients match your search.</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedPatientCode && selectedPatientCode !== "add-new" && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Selected Patient Details</h3>
                  {(() => {
                    const patient = patients.find(p => p.patient_code === selectedPatientCode);
                    return patient ? (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Name:</strong> {patient.name}</div>
                        <div><strong>ID:</strong> {patient.patient_code}</div>
                        <div><strong>Age:</strong> {patient.age}</div>
                        <div><strong>Gender:</strong> {patient.gender}</div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleNextFromPatientSelect} disabled={!selectedPatientCode || selectedPatientCode === "add-new"}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Upload EEG */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Upload EEG File</h2>
                <p className="mt-1 text-sm text-muted-foreground">Supported formats: EDF, BDF</p>
              </div>

              {uploadedFileId ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Upload Successful</span>
                    </div>
                    <p className="mt-1 text-sm text-green-700">File uploaded and patient information saved successfully.</p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => setCurrentStep(3)}>
                      Proceed to Quality Check <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
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

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button onClick={handleUploadAndContinue} disabled={!file || isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          Upload File <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Quality Check */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Quality Check</h2>
                <p className="mt-1 text-sm text-muted-foreground">Run quality analysis on the uploaded EEG data</p>
              </div>

              {qualityResult ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-900">Quality Check Complete</p>
                          <p className="text-sm text-green-800">EEG analysis is complete and results are ready.</p>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-sm">
                        <span>Patient: </span>
                        <span className="text-primary">{patientInfo.name || patientInfo.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="text-sm font-medium text-muted-foreground">Overall Quality</p>
                      <p className="mt-3 text-4xl font-bold text-foreground">{qualityResult.overallScore}%</p>
                      <p className="mt-2 text-sm text-muted-foreground">Higher is better</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="text-sm font-medium text-muted-foreground">Signal Quality</p>
                      <Badge
                        className="mt-3"
                        variant={qualityResult.overallScore >= 70 ? 'default' : 'destructive'}
                      >
                        {qualityResult.overallScore >= 70 ? 'Good' : 'Poor'}
                      </Badge>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {qualityResult.overallScore >= 70 ? 'Signal quality is within expected range.' : 'Signal quality is below threshold.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="text-sm font-medium text-muted-foreground">Bad Channels</p>
                      <p className="mt-3 text-3xl font-semibold text-foreground">{qualityResult.badChannels?.length || 0}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Channels flagged for review</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Muscle Artifacts</p>
                        <Badge variant={qualityResult.muscleArtifacts === 'Low' ? 'default' : 'destructive'}>
                          {qualityResult.muscleArtifacts || 'Unknown'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Movement-related noise in the recording.</p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Eye Blink Contamination</p>
                        <Badge variant={qualityResult.eyeBlinkContamination === 'Low' ? 'default' : 'destructive'}>
                          {qualityResult.eyeBlinkContamination || 'Unknown'}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">Eye blink activity present in the EEG.</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button onClick={handleGenerateReport} className="w-full sm:w-auto">
                      Generate Report <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Ready for Quality Check</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Your EEG file is uploaded. Run the analysis to view quality metrics and next steps.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button onClick={runQualityCheck} disabled={isAnalyzing} className="w-full sm:w-auto">
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running Quality Check...
                        </>
                      ) : (
                        <>
                          Run Quality Check <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </MainLayout>
  );
};

export default Upload;
