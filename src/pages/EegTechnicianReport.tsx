import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateNIMHANSPDF } from "@/components/generateDrPdf";
// Add these imports at the top
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Printer,
  Plus,
  UploadCloud,
  UserRound,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { processEEG } from "@/app/eeg";
import { createPatient, getPatientsDb, type PatientPayload } from "@/app/patients";
import { toast } from "@/hooks/use-toast";

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface PatientOption {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  hospital?: string;
  hospitalAddress?: string;
}

type ReportData = {
  file: File | null;
  patientName: string;
  pid?: string;
  age: string;
  gender: string;
  handedness: string;
  neuroNo: string;
  uhid: string;
  eegNo: string;
  doctor: string;
  lastAttack: string;
  lastMeal: string;
  diagnosis: string;
  medications: string;
  dateTime: string;
  technician: string;
  resident: string;
  sensorium: string;
  sedation: string;
  recordType: string;
  backgroundText: string;
  findingsDetail: string;
  sleepDetail: string;
  conclusion: string;
  correlate: string;
  normalFindings: string[];
  abnormalFindings: string[];
  regions: string[];
  hospital: string;
  hospitalAddress: string;
};

const steps = [
  { id: 1, title: "Upload EEG file" },
  { id: 2, title: "Patient details" },
  { id: 3, title: "Recording info" },
  { id: 4, title: "Background" },
  { id: 5, title: "Findings" },
  { id: 6, title: "Conclusion" },
  { id: 7, title: "Review" },
] as const;

const backgroundOptions = [
  { value: "normal", label: "Normal (8–9 Hz alpha)" },
  { value: "slow", label: "Theta-dominant / slow" },
  { value: "sedated", label: "Sedated / no awake" },
  { value: "custom", label: "Custom" },
];

const normalFindings = [
  "No epileptiform discharges",
  "No definite epileptiform discharges",
  "No focal slowing",
  "Normal sleep structures",
  "Sleep spindles present",
  "K complexes present",
  "Alpha reactivity preserved",
];

const abnormalFindings = [
  "Sharp waves",
  "Spike and wave discharges",
  "Poly spike and wave",
  "Broad sharps (PHR)",
  "Focal slowing",
  "Generalised slowing",
  "Asymmetric background",
];

const regionOptions = [
  "Right",
  "Left",
  "Bilateral",
  "Generalised",
  "Frontal",
  "Fronto-central",
  "Fronto-temporal",
  "Centro-temporal",
  "Temporal",
  "Parietal",
  "Occipital",
];

const correlateOptions = [
  "Kindly correlate clinically",
  "Clinical correlation recommended",
  "None",
];

export default function EegTechnicianReport() {
  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [background, setBackground] = useState("normal");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientCode, setSelectedPatientCode] = useState("");
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "",
    patient_code: "",
    hospital: "",
    hospitalAddress: "",
  });
  const [report, setReport] = useState<ReportData>({
    file: null,
    patientName: "",
    age: "",
    gender: "",
    handedness: "",
    neuroNo: "",
    uhid: "",
    eegNo: "",
    doctor: "",
    lastAttack: "",
    lastMeal: "",
    diagnosis: "",
    medications: "",
    dateTime: "",
    technician: "",
    resident: "",
    sensorium: "Good",
    sedation: "",
    recordType: "Awake resting",
    backgroundText: "Background in the posterior leads shows well-defined alpha activity with preserved reactivity and no focal slowing.",
    findingsDetail: "",
    sleepDetail: "",
    conclusion: "This EEG is within normal limits.",
    correlate: "Clinical correlation recommended",
    normalFindings: ["No epileptiform discharges"],
    abnormalFindings: [],
    regions: ["Bilateral"],
    hospital: "",
    hospitalAddress: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatientsDb();
        const list = Array.isArray(data) ? data : data.patients ?? [];
        setPatients(list);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  const previewLines = useMemo(() => {
    const parts = [
      `Patient: ${report.patientName || "—"}`,
      `Age/Gender: ${report.age || "—"}/${report.gender || "—"}`,
      `Recording: ${report.dateTime || "—"}`,
      `Background: ${backgroundOptions.find((item) => item.value === background)?.label || background}`,
      `Findings: ${[...report.normalFindings, ...report.abnormalFindings].join(", ") || "No findings selected"}`,
      `Conclusion: ${report.conclusion || "—"}`,
    ];
    return parts;
  }, [background, report]);

  const handleFieldChange = (field: keyof ReportData, value: string) => {
    setReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setReport((prev) => ({ ...prev, file }));
    setSubmitError(null);
  };

  const handlePatientSelect = (value: string) => {
    if (value === "add-new") {
      setIsAddPatientModalOpen(true);
      return;
    }

    setSelectedPatientCode(value);
    const patient = patients.find((item) => item.patient_code === value);
    if (patient) {
      setReport((prev) => ({
        ...prev,
        patientName: patient.name,
        age: String(patient.age),
        pid:patient.patient_code,
        gender: patient.gender,
        hospital: patient.hospital || "",
        hospitalAddress: patient.hospitalAddress || "",
      }));
    }
  };

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.gender || !newPatient.patient_code || !newPatient.hospital || !newPatient.hospitalAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including hospital name and address.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: PatientPayload = {
        hospital_id: 1,
        patient_code: newPatient.patient_code,
        name: newPatient.name,
        age: Number(newPatient.age),
        gender: newPatient.gender,
        hospital: newPatient.hospital,
        hospitalAddress: newPatient.hospitalAddress,
      };

      await createPatient(payload);

      const data = await getPatientsDb();
      const list = Array.isArray(data) ? data : data.patients ?? [];
      setPatients(list);
      setSelectedPatientCode(newPatient.patient_code);
      setReport((prev) => ({
        ...prev,
        patientName: newPatient.name,
        age: newPatient.age,
        gender: newPatient.gender,
        hospital: newPatient.hospital,
        hospitalAddress: newPatient.hospitalAddress,
      }));
      setIsAddPatientModalOpen(false);
      setNewPatient({ name: "", age: "", gender: "", patient_code: "", hospital: "", hospitalAddress: "" });

      toast({
        title: "Patient Added",
        description: "The patient has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding patient:", error);
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSexValue = (gender: string) => {
    if (gender === "M") return "Male";
    if (gender === "F") return "Female";
    return gender;
  };

  const handleSubmitReport = async () => {
    console.log(report)
    if (!report.file) {
      setSubmitError("Please upload an EDF file before submitting.");
      toast({ title: "Submit failed", description: "No EEG file selected.", variant: "destructive" });
      return;
    }

    if (!report.patientName) {
      setSubmitError("Patient name is required for final submission.");
      toast({ title: "Submit failed", description: "Enter the patient's full name before submitting.", variant: "destructive" });
      return;
    }

    setSubmitError(null);
    setCurrentStep(7);
  };

  const handleFinalSubmit = async () => {
    if (!report.file) {
      setSubmitError("Please upload an EDF file before submitting.");
      toast({ title: "Submit failed", description: "No EEG file selected.", variant: "destructive" });
      return;
    }

    if (!report.patientName) {
      setSubmitError("Patient name is required for final submission.");
      toast({ title: "Submit failed", description: "Enter the patient's full name before submitting.", variant: "destructive" });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
   let processed=   await processEEG({
        file: report.file,
        name: report.patientName,
        pid:report.pid,
        age: report.age,
        sex: getSexValue(report.gender),
        sensorium: report.sensorium,
        sedation: report.sedation,
        meds: report.medications,
        dx: report.diagnosis,
        resident: report.resident,
        handedness: report.handedness,
        eegNo: report.eegNo,
        doctor: report.doctor,
        lastAttack: report.lastAttack,
        lastMeal: report.lastMeal,
        dateTime: report.dateTime,
        technician: report.technician,
        backgroundText: report.backgroundText,
        findingsDetail: report.findingsDetail,
        sleepDetail: report.sleepDetail,
        conclusion: report.conclusion,
        correlate: report.correlate,
        normalFindings: report.normalFindings,
        abnormalFindings: report.abnormalFindings,
        regions: report.regions,
        recordType: report.recordType,
        uhid: report.uhid,
        gender: report.gender,
        diagnosis: report.diagnosis,
        medications: report.medications,
      });

      toast({ title: "Report submitted", description: "EEG report has been submitted successfully." });
      generateNIMHANSPDF(report, processed);
    } catch (error) {
      console.error("processEEG error", error);
      setSubmitError("Submission failed. Please try again.");
      toast({ title: "Submit failed", description: "Unable to send the report to the server.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChip = (value: string, group: "normal" | "abnormal" | "region") => {
    if (group === "normal") {
      setReport((prev) => ({
        ...prev,
        normalFindings: prev.normalFindings.includes(value)
          ? prev.normalFindings.filter((item) => item !== value)
          : [...prev.normalFindings, value],
      }));
      return;
    }

    if (group === "abnormal") {
      setReport((prev) => ({
        ...prev,
        abnormalFindings: prev.abnormalFindings.includes(value)
          ? prev.abnormalFindings.filter((item) => item !== value)
          : [...prev.abnormalFindings, value],
      }));
      return;
    }

    setReport((prev) => ({
      ...prev,
      regions: prev.regions.includes(value)
        ? prev.regions.filter((item) => item !== value)
        : [...prev.regions, value],
    }));
  };

  const goNext = () => setCurrentStep((step) => (step < steps.length ? ((step + 1) as StepId) : step));
  const goBack = () => setCurrentStep((step) => (step > 1 ? ((step - 1) as StepId) : step));

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Upload EEG recording</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drop an EEG file here or browse locally. The workflow will guide the report drafting from upload to export.
              </p>
              <div className="mt-6 flex justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".edf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button variant="default" className="gap-2" type="button" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4" />
                  Choose EEG file
                </Button>
              </div>
              {report.file ? (
                <p className="mt-3 text-sm text-foreground">Selected file: {report.file.name}</p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Accepted format: .edf</p>
              )}
              <div className="mt-4 rounded-xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                The EEG file is saved in the report object and will be submitted on the final step.
              </div>
              {submitError && <p className="mt-3 text-sm text-rose-600">{submitError}</p>}
            </div>
            <div className="rounded-2xl border border-border/60 bg-accent/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How this works</p>
              <p className="mt-1">
                Upload the recording, populate patient and technical details, and review the auto-drafted background and conclusion before printing.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="patientSelect">Patient</Label>
                <Select value={selectedPatientCode} onValueChange={handlePatientSelect}>
                  <SelectTrigger id="patientSelect">
                    <SelectValue placeholder="Select or add a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="add-new"
                      className="rounded-xl px-3 py-3"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setIsAddPatientModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        Add New Patient
                      </div>
                    </SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.patient_code} value={patient.patient_code}>
                        {patient.name} ({patient.patient_code}) · {patient.gender} · {patient.age} yrs
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
              </div>
              <div>
                <Label htmlFor="patientName">Patient name</Label>
                <Input id="patientName" value={report.patientName} onChange={(e) => handleFieldChange("patientName", e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" value={report.age} onChange={(e) => handleFieldChange("age", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={report.gender} onValueChange={(value) => handleFieldChange("gender", value)}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="handedness">Handedness</Label>
                <Select value={report.handedness} onValueChange={(value) => handleFieldChange("handedness", value)}>
                  <SelectTrigger id="handedness">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right-handed">Right-handed</SelectItem>
                    <SelectItem value="Left-handed">Left-handed</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="neuroNo">Neuro No.</Label>
                <Input id="neuroNo" value={report.neuroNo} onChange={(e) => handleFieldChange("neuroNo", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="uhid">UHID / Unit</Label>
                <Input id="uhid" value={report.uhid} onChange={(e) => handleFieldChange("uhid", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eegNo">EEG No.</Label>
                <Input id="eegNo" value={report.eegNo} onChange={(e) => handleFieldChange("eegNo", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="doctor">Doctor</Label>
                <Input id="doctor" value={report.doctor} onChange={(e) => handleFieldChange("doctor", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="hospital">Hospital *</Label>
                <Input id="hospital" value={report.hospital} onChange={(e) => handleFieldChange("hospital", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="hospitalAddress">Hospital Address *</Label>
                <Input id="hospitalAddress" value={report.hospitalAddress} onChange={(e) => handleFieldChange("hospitalAddress", e.target.value)} />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="dateTime">Recording date & time</Label>
                <Input id="dateTime" type="datetime-local" value={report.dateTime} onChange={(e) => handleFieldChange("dateTime", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="technician">Technician</Label>
                <Input id="technician" value={report.technician} onChange={(e) => handleFieldChange("technician", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="resident">Resident / Reporting doctor</Label>
                <Input id="resident" value={report.resident} onChange={(e) => handleFieldChange("resident", e.target.value)} />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="sensorium">Level of sensorium</Label>
                <Select value={report.sensorium} onValueChange={(value) => handleFieldChange("sensorium", value)}>
                  <SelectTrigger id="sensorium">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Drowsy">Drowsy</SelectItem>
                    <SelectItem value="Stupor">Stupor</SelectItem>
                    <SelectItem value="Unconscious">Unconscious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sedation">Sedation</Label>
                <Input id="sedation" value={report.sedation} onChange={(e) => handleFieldChange("sedation", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="recordType">Record type</Label>
                <Select value={report.recordType} onValueChange={(value) => handleFieldChange("recordType", value)}>
                  <SelectTrigger id="recordType">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Awake resting">Awake resting</SelectItem>
                    <SelectItem value="Resting with sleep">Resting with sleep</SelectItem>
                    <SelectItem value="Drug-induced sleep">Drug-induced sleep</SelectItem>
                    <SelectItem value="Prolonged">Prolonged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {backgroundOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBackground(option.value)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm transition-all",
                    background === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">Background review</p>
                <Badge variant="secondary" className="gap-1">
                  <Waves className="h-3.5 w-3.5" />
                  Signal-informed
                </Badge>
              </div>
              <Textarea
                className="mt-3 min-h-[140px]"
                value={report.backgroundText}
                onChange={(e) => handleFieldChange("backgroundText", e.target.value)}
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Normal findings</p>
              <div className="flex flex-wrap gap-2">
                {normalFindings.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleChip(item, "normal")}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-all",
                      report.normalFindings.includes(item)
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Abnormal findings</p>
              <div className="flex flex-wrap gap-2">
                {abnormalFindings.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleChip(item, "abnormal")}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-all",
                      report.abnormalFindings.includes(item)
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Region / laterality</p>
              <div className="flex flex-wrap gap-2">
                {regionOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleChip(item, "region")}
                    className={cn(
                      "rounded-full border px-3 py-2 text-sm transition-all",
                      report.regions.includes(item)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="findingsDetail">Additional findings / details</Label>
              <Textarea id="findingsDetail" className="min-h-[120px]" value={report.findingsDetail} onChange={(e) => handleFieldChange("findingsDetail", e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label htmlFor="sleepDetail">Sleep findings (optional)</Label>
              <Textarea id="sleepDetail" className="min-h-[100px]" value={report.sleepDetail} onChange={(e) => handleFieldChange("sleepDetail", e.target.value)} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FileText className="h-4 w-4" />
                Conclusion draft
              </div>
              <Textarea className="mt-3 min-h-[140px]" value={report.conclusion} onChange={(e) => handleFieldChange("conclusion", e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label htmlFor="correlate">Append correlate note</Label>
              <Select value={report.correlate} onValueChange={(value) => handleFieldChange("correlate", value)}>
                <SelectTrigger id="correlate">
                  <SelectValue placeholder="Select note" />
                </SelectTrigger>
                <SelectContent>
                  {correlateOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <BrainCircuit className="h-4 w-4 text-primary" />
                Report summary
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                {previewLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FileText className="h-4 w-4" />
                Review Report Before Submission
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient Information</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {report.patientName || "—"}</div>
                    <div><span className="font-medium">Age:</span> {report.age || "—"}</div>
                    <div><span className="font-medium">Gender:</span> {report.gender || "—"}</div>
                    <div><span className="font-medium">Handedness:</span> {report.handedness || "—"}</div>
                    <div><span className="font-medium">Hospital:</span> {report.hospital || "—"}</div>
                    <div><span className="font-medium">Hospital Address:</span> {report.hospitalAddress || "—"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Neuro Details</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div><span className="font-medium">Neuro No.:</span> {report.neuroNo || "—"}</div>\n                    <div><span className="font-medium">UHID/Unit:</span> {report.uhid || "—"}</div>
                    <div><span className="font-medium">EEG No.:</span> {report.eegNo || "—"}</div>
                    <div><span className="font-medium">Doctor:</span> {report.doctor || "—"}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recording Details</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div><span className="font-medium">Date/Time:</span> {report.dateTime || "—"}</div>
                    <div><span className="font-medium">Record Type:</span> {report.recordType || "—"}</div>
                    <div><span className="font-medium">Technician:</span> {report.technician || "—"}</div>
                    <div><span className="font-medium">Resident:</span> {report.resident || "—"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinical Status</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div><span className="font-medium">Sensorium:</span> {report.sensorium || "—"}</div>
                    <div><span className="font-medium">Sedation:</span> {report.sedation || "—"}</div>
                    <div><span className="font-medium">Medications:</span> {report.medications || "—"}</div>
                    <div><span className="font-medium">Diagnosis:</span> {report.diagnosis || "—"}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clinical History</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div><span className="font-medium">Last Attack:</span> {report.lastAttack || "—"}</div>
                  <div><span className="font-medium">Last Meal:</span> {report.lastMeal || "—"}</div>
                </div>
              </div>
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">EEG Background</p>
                <p className="mt-2 text-sm text-muted-foreground">{report.backgroundText || "—"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Findings</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div><span className="font-medium">Normal:</span> {report.normalFindings.join(", ") || "—"}</div>
                  <div><span className="font-medium">Abnormal:</span> {report.abnormalFindings.join(", ") || "—"}</div>
                  <div><span className="font-medium">Regions:</span> {report.regions.join(", ") || "—"}</div>
                  <div><span className="font-medium">Details:</span> {report.findingsDetail || "—"}</div>
                  <div><span className="font-medium">Sleep:</span> {report.sleepDetail || "—"}</div>
                </div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Conclusion</p>
                <p className="mt-2 text-sm text-muted-foreground">{report.conclusion || "—"}</p>
                <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium">Correlate:</span> {report.correlate || "—"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Review Complete</p>
              <p className="mt-1 text-sm text-amber-800">Please verify all information above before final submission. Click \"Submit Report\" to proceed.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-2 py-6 lg:px-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">EEG Report — Technician Interface</h1>
                <p className="text-sm text-muted-foreground">A step-by-step workflow with the same clinical flow and your app’s theme.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Theme synced
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Printer className="h-3.5 w-3.5" />
              Print ready
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <Card className="rounded-3xl border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {steps.map((step) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all",
                        isActive && "border-primary bg-primary text-primary-foreground",
                        isCompleted && !isActive && "border-emerald-600/30 bg-emerald-50 text-emerald-700",
                        !isActive && !isCompleted && "border-border bg-background text-muted-foreground",
                      )}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-current text-[11px] font-semibold">
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                      </span>
                      {step.title}
                    </div>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6 rounded-2xl border border-border/60 bg-accent/20 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <UserRound className="h-4 w-4 text-primary" />
                  Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
                </div>
                <p className="mt-1">Complete the details for this stage, then move forward to build the final EEG report.</p>
              </div>
              {renderStepContent()}
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Button variant="outline" className="gap-2" onClick={goBack} disabled={currentStep === 1}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  {currentStep === 7 ? (
                    <Button className="gap-2" onClick={handleFinalSubmit} disabled={isSubmitting}>
                      <FileText className="h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit report"}
                    </Button>
                  ) : currentStep === 6 ? (
                    <Button className="gap-2" onClick={handleSubmitReport} disabled={!report.file || !report.patientName}>
                      Review
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button className="gap-2" onClick={goNext} disabled={currentStep === 1 && !report.file}>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {submitError ? (
                  <p className="text-sm text-rose-600">{submitError}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Live report preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Draft summary</p>
                  <div className="mt-3 space-y-2">
                    {previewLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Clinical note</p>
                  <p className="mt-2">
                    The form is structured to match the technician report flow and can be extended with autofill, upload validation, and PDF export next.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Theme cues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-primary" />
                  Primary clinical blue
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-600" />
                  Normal / completed state
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-600" />
                  Abnormal / warning state
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-hospital" className="text-right">
                      Hospital *
                    </Label>
                    <Input
                      id="new-hospital"
                      value={newPatient.hospital}
                      onChange={(e) => setNewPatient({ ...newPatient, hospital: e.target.value })}
                      className="col-span-3"
                      placeholder="Hospital name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-hospital-address" className="text-right">
                      Hospital Address *
                    </Label>
                    <Input
                      id="new-hospital-address"
                      value={newPatient.hospitalAddress}
                      onChange={(e) => setNewPatient({ ...newPatient, hospitalAddress: e.target.value })}
                      className="col-span-3"
                      placeholder="Full hospital address"
                    />
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
    </MainLayout>
  );
}
