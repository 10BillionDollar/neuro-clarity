import React, { useState } from "react";
import { signup, login } from "../app/auth";
import { getPatients } from "../app/patients";
import { uploadEEG, analyzeEEG } from "../app/eeg";
import { generatePDF } from "../app/reports";

export default function ApiTest() {
  const [log, setLog] = useState<string[]>([]);
  const [token, setToken] = useState<string>("");

  const appendLog = (msg: string) => setLog(prev => [...prev, msg]);

  const testSignupLogin = async () => {
    try {
      appendLog("Signing up...");
      const signupRes = await signup({
        name: "Netlify Test",
        email: `netlifytest${Date.now()}@test.com`,
        password: "123456",
      });
      appendLog(`Signup Response: ${JSON.stringify(signupRes)}`);

      appendLog("Logging in...");
      const loginRes = await login({
        email: signupRes.email || `netlifytest@test.com`,
        password: "123456",
      });
      appendLog(`Login Response: ${JSON.stringify(loginRes)}`);
      if (loginRes.access_token) setToken(loginRes.access_token);
    } catch (err: any) {
      appendLog(`Error: ${err.message}`);
    }
  };

  const testPatients = async () => {
    const patients = await getPatients();
    appendLog(`Patients: ${JSON.stringify(patients)}`);
  };

  const testEEG = async (file: File) => {
    const upload = await uploadEEG(file);
    appendLog(`EEG Upload: ${JSON.stringify(upload)}`);

    if (upload.id) {
      const analysis = await analyzeEEG(upload.id);
      appendLog(`EEG Analysis: ${JSON.stringify(analysis)}`);
    }
  };

  const testPDF = async (patientId: string) => {
    const pdfUrl = await generatePDF(patientId);
    appendLog(`PDF URL: ${pdfUrl}`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Netlify API Test</h1>
      <button onClick={testSignupLogin}>Signup & Login</button>
      <button onClick={testPatients} disabled={!token}>
        Get Patients
      </button>
      <input
        type="file"
        onChange={e => e.target.files && testEEG(e.target.files[0])}
      />
      <button onClick={() => testPDF("PATIENT_ID")} disabled={!token}>
        Generate PDF
      </button>
      <div style={{ marginTop: 20 }}>
        <h2>Logs:</h2>
        <pre>{log.join("\n")}</pre>
      </div>
    </div>
  );
}
