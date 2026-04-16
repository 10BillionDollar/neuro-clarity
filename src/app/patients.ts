import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "../lib/fetchWithAuth";

export async function getPatients() {
  const res = await fetchWithAuth(`${API_BASE_URL}/patients`, {
    method: "GET",
  });
  return res.json();
}

export async function getPatientById(patientId: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/patients/${patientId}`, {
    method: "GET",
  });
  return res.json();
}

export async function getPatientsDb() {
  const res = await fetchWithAuth(`${API_BASE_URL}/patients_db`, {
    method: "GET",
  });
  return res.json();
}

export interface PatientPayload {
  hospital_id: number;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
}

function extractErrorMessage(data: any): string {
  if (!data) return "Unknown error";
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((e: any) => e.msg ?? JSON.stringify(e)).join(", ");
  }
  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  return JSON.stringify(data);
}

async function handleResponse(res: Response) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(extractErrorMessage(data));
  }
  return data;
}

export async function createPatient(payload: PatientPayload) {
  const res = await fetchWithAuth(`${API_BASE_URL}/create-patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function editPatient(patientCode: string, payload: Partial<PatientPayload>) {
  const res = await fetchWithAuth(`${API_BASE_URL}/edit-patient/${patientCode}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function longitudinal(patientCode: string, payload: Partial<PatientPayload>) {
  const res = await fetchWithAuth(`${API_BASE_URL}/longitudinal/${patientCode}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse(res);
}

export async function deletePatient(patientCode: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/delete-patient/${patientCode}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}

const patientHistoryPromiseMap = new Map<string, Promise<any>>();

export async function getPatientHistory(patientCode: string) {
  if (!patientCode) {
    throw new Error("Patient code is required to fetch history.");
  }

  const storageKey = `patientHistory:${patientCode}`;
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }
  }

  const existingPromise = patientHistoryPromiseMap.get(patientCode);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    const res = await fetchWithAuth(`${API_BASE_URL}/patient-history/${patientCode}`, {
      method: "GET",
    });
    const data = await handleResponse(res);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // ignore storage errors
      }
    }
    return data;
  })();

  patientHistoryPromiseMap.set(patientCode, promise);
  promise.finally(() => patientHistoryPromiseMap.delete(patientCode));
  return promise;
}
