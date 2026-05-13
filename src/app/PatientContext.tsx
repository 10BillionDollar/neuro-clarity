import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getPatientsDb } from "./patients";

interface Patient {
  patient_code: string;
  name: string;
  age?: number;
  gender?: string;
}

interface PatientContextType {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  refetchPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPatientsDb();
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const refetchPatients = fetchPatients;

  return (
    <PatientContext.Provider value={{ patients, loading, error, refetchPatients }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
}
