import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "../lib/fetchWithAuth";

// Generate PDF report
export async function generatePDF(patientId: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/reports/pdf/${patientId}`, {
    method: "POST",
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url; // can be used as href to download
}

// Fetch report data
export async function getReport(patientId: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/reports/${patientId}`, {
    method: "GET",
  });
  return res.json();
}
