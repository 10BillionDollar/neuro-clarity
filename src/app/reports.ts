import { API_BASE_URL } from "./config";
import { fetchWithAuth } from "../lib/fetchWithAuth";

// Generate PDF report
export async function generatePDF(patientId: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/reports/pdf/${encodeURIComponent(patientId)}`, {
    method: "POST",
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url; // can be used as href to download
}

// Fetch report data
export async function getReport(patientId: string) {
  const res = await fetchWithAuth(`${API_BASE_URL}/reports/${encodeURIComponent(patientId)}`, {
    method: "GET",
  });
  return res.json();
}

// Download prescription by result ID
export async function downloadPrescription(resultId: string | number) {
  const res = await fetchWithAuth(`${API_BASE_URL}/download-prescription/${encodeURIComponent(String(resultId))}`, {
    method: "GET",
  });
  
  if (!res.ok) {
    throw new Error(`Failed to download prescription: ${res.statusText}`);
  }
  
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return { url, blob }; // return both url and blob for file type detection
}

// Helper function to get file extension from MIME type
export function getFileExtension(mimeType: string): string {
  const mimeTypes: { [key: string]: string } = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'text/plain': 'txt',
    'text/html': 'html',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'image/tiff': 'tiff',
    'image/bmp': 'bmp',
    'image/gif': 'gif'
  };
  return mimeTypes[mimeType] || 'pdf';
}

// Helper function to check if file can be opened in browser
export function canOpenInBrowser(mimeType: string): boolean {
  const browserSupportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'text/plain',
    'text/html',
    'image/tiff',
    'image/bmp',
    'image/gif'
  ];
  return browserSupportedTypes.includes(mimeType);
}

// Get prescription data with file info
export async function getPrescriptionData(resultId: string | number) {
  const { url, blob } = await downloadPrescription(resultId);
  const fileExtension = getFileExtension(blob.type);
  const fileName = `prescription_${resultId}.${fileExtension}`;
  
  // Get text content for text files
  let textContent;
  if (blob.type.startsWith('text/')) {
    textContent = await blob.text();
  }
  
  return { url, blob, fileName, textContent };
}
