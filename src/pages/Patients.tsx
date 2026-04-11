import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { ReportTable } from "@/components/dashboard/ReportTable";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPatientsDb, createPatient, editPatient, deletePatient, PatientPayload, getPatientHistory } from "@/app/patients";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  // hospital_id: number;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  latestEEGDate?: string;
  latestEEGQuality?: string;
  latestRiskLevel?: string;
  latestProbability?: number;
  latestScore?: number;
}

const emptyForm: PatientPayload = {
  hospital_id: 1,
  patient_code: "",
  name: "",
  age: 0,
  gender: "",
};

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected patient for viewing details and reports
  const [selectedPatientCode, setSelectedPatientCode] = useState<string>("");

  // Create / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete dialog
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPatientsDb();
      const patientList = Array.isArray(data) ? data : data?.patients ?? [];

      // Fetch latest screening data for each patient
      const patientsWithScreenings = await Promise.all(
        patientList.map(async (patient: Patient) => {
          try {
            const history = await getPatientHistory(patient.patient_code);
            const latestScreening = history && history.length > 0 ? history[0] : null;
            return {
              ...patient,
              latestEEGDate: latestScreening?.date || latestScreening?.created_at || latestScreening?.report_date,
              latestEEGQuality: latestScreening?.quality || latestScreening?.eeg_quality,
              latestRiskLevel: latestScreening?.risk_level,
              latestProbability: latestScreening?.probability,
              latestScore: latestScreening?.internal_brain_health_score,
            };
          } catch (error) {
            // If history fetch fails, return patient without screening data
            return patient;
          }
        })
      );

      setPatients(patientsWithScreenings);
    } catch {
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const openCreate = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (patient: Patient) => {
    setEditingCode(patient.patient_code);
    setForm({
      hospital_id: 1,
      patient_code: patient.patient_code,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError("");
    setSubmitting(true);
    try {
      if (editingCode) {
        await editPatient(editingCode, form);
        toast.success("Patient updated successfully");
      } else {
        await createPatient(form);
        toast.success("Patient added successfully");
      }
      setDialogOpen(false);
      fetchPatients();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCode) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePatient(deleteCode);
      setDeleteCode(null);
      fetchPatients();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete patient");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="">
        <div className="mb-4">
           <h1 className="text-[25px] font-semibold text-foreground">Patient Management & Screenings</h1>
          <p className="text-sm text-muted-foreground">Manage patients and view their screening reports</p>
</div>
        {/* Patient Report Screenings */}
        <div>
          <ReportTable 
            patients={patients}
            onEditPatient={openEdit}
            onDeletePatient={(patientCode) => setDeleteCode(patientCode)}
            onAddPatient={openCreate}
          />
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Patient" : "Add Patient"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="space-y-1">
              <Label>Patient Code</Label>
              <Input
                value={form.patient_code}
                disabled={!!editingCode}
                onChange={(e) => setForm((f) => ({ ...f, patient_code: e.target.value }))}
                placeholder="e.g. P002"
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={form.age || ""}
                  onChange={(e) => setForm((f) => ({ ...f, age: Number(e.target.value) }))}
                  placeholder="Age"
                />
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Input
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  placeholder="M / F"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : editingCode ? "Save Changes" : "Create Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCode} onOpenChange={(open) => { if (!open) { setDeleteCode(null); setDeleteError(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete patient <strong>{deleteCode}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-red-500 px-1">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </MainLayout>
  );
}
