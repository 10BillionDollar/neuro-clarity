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

export async function processEEG(params: {
  file: File;
  pid: string;
  name: string;
  age?: string;
  sex?: string;
  sensorium?: string;
  sedation?: string;
  meds?: string;
  dx?: string;
  resident?: string;
  handedness?: string;
  eegNo?: string;
  doctor?: string;
  lastAttack?: string;
  lastMeal?: string;
  dateTime?: string;
  technician?: string;
  backgroundText?: string;
  findingsDetail?: string;
  sleepDetail?: string;
  conclusion?: string;
  correlate?: string;
  normalFindings?: string[];
  abnormalFindings?: string[];
  regions?: string[];
  recordType?: string;
  uhid?: string;
  gender?: string;
  diagnosis?: string;
  medications?: string;
}) {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("pid", params.pid);
  formData.append("name", params.name);
  formData.append("report_data", JSON.stringify(params));

  if (params.age) formData.append("age", String(params.age));
  if (params.sex) formData.append("sex", params.sex);
  if (params.sensorium) formData.append("sensorium", params.sensorium);
  if (params.sedation) formData.append("sedation", params.sedation);
  if (params.meds) formData.append("meds", params.meds);
  if (params.dx) formData.append("dx", params.dx);
  if (params.resident) formData.append("resident", params.resident);
  if (params.handedness) formData.append("handedness", params.handedness);
  if (params.eegNo) formData.append("eeg_no", params.eegNo);
  if (params.doctor) formData.append("doctor", params.doctor);
  if (params.lastAttack) formData.append("last_attack", params.lastAttack);
  if (params.lastMeal) formData.append("last_meal", params.lastMeal);
  if (params.dateTime) formData.append("recording_date_time", params.dateTime);
  if (params.technician) formData.append("technician", params.technician);
  if (params.backgroundText) formData.append("background_text", params.backgroundText);
  if (params.findingsDetail) formData.append("findings_detail", params.findingsDetail);
  if (params.sleepDetail) formData.append("sleep_detail", params.sleepDetail);
  if (params.conclusion) formData.append("conclusion", params.conclusion);
  if (params.correlate) formData.append("correlate", params.correlate);
  if (params.recordType) formData.append("record_type", params.recordType);
  if (params.uhid) formData.append("uhid", params.uhid);
  if (params.gender) formData.append("gender", params.gender);
  if (params.diagnosis) formData.append("diagnosis", params.diagnosis);
  if (params.medications) formData.append("medications", params.medications);

  formData.append("normal_findings", JSON.stringify(params.normalFindings ?? []));
  formData.append("abnormal_findings", JSON.stringify(params.abnormalFindings ?? []));
  formData.append("regions", JSON.stringify(params.regions ?? []));

  const res = await fetchWithAuth(`${API_BASE_URL}/v1/process-eeg`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<Record<string, any>>(res);
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
