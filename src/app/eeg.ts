import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "../lib/fetchWithAuth";

export interface EEGMetadata {
  sampling_rate: number;
  duration_sec: number;
  channels: string[];
}

export interface EEGSignals {
  signals: Record<string, number[]>;
}

const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EEG API error ${res.status}: ${text}`);
  }
  return res.json();
};

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

export async function fetchEEGMetadata(resultId: string) {
  const url = new URL(`${API_BASE_URL}/eeg-viewer/metadata/${encodeURIComponent(resultId)}`);
  const res = await fetchWithAuth(url.toString(), {
    method: "GET",
  });
  return handleResponse<EEGMetadata>(res);
}

export async function fetchEEGWindow(resultId: string, start = 0, end = 5) {
  const url = new URL(`${API_BASE_URL}/eeg-viewer/window/${encodeURIComponent(resultId)}`);
  url.searchParams.set("start", String(start));
  url.searchParams.set("end", String(end));

  const res = await fetchWithAuth(url.toString(), {
    method: "GET",
  });
  return handleResponse<EEGSignals>(res);
}

export async function fetchEEGClinicalMontage(resultId: string, start = 0, end = 5) {
  const url = new URL(`${API_BASE_URL}/eeg-viewer/montage/${encodeURIComponent(resultId)}`);
  url.searchParams.set("start", String(start));
  url.searchParams.set("end", String(end));

  const res = await fetchWithAuth(url.toString(), {
    method: "GET",
  });
  return handleResponse<EEGSignals>(res);
}

// Fetch EEG montage for a result ID and optional time window
