import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "../lib/fetchWithAuth";

// Upload EEG file
export async function uploadEEG(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithAuth(`${API_BASE_URL}/eeg/upload`, {
    method: "POST",
    body: formData,
  });

  return res.json();
}

// Analyze EEG
export async function analyzeEEG(eegId: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/eeg/process/${encodeURIComponent(eegId)}`, {
    method: "POST",
  });
  return res.json();
}
