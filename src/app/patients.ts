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
