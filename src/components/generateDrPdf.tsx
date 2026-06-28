// report-generator.tsx

export interface ReportData {
  patientName: string;
  age?: string;
  gender?: string;
  handedness?: string;
  neuroNo?: string;
  eegNo?: string;
  uhid?: string;
  dateTime?: string;
  lastAttack?: string;
  lastMeal?: string;
  sensorium?: string;
  sedation?: string;
  medications?: string;
  diagnosis?: string;
  doctor?: string;
  technician?: string;
  resident?: string;
  recordType?: string;
  backgroundText?: string;
  conclusion?: string;
  findingsDetail?: string;
  sleepDetail?: string;
  correlate?: string;
  normalFindings?: string[];
  abnormalFindings?: string[];
  regions?: string[];
}

export interface ProcessedData {
  finding_background?: string;
  conclusion_draft?: string;
  bandActivity?: Record<string, string>;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function dash(v?: string): string {
  return v?.trim() || "—";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatList(values?: string[]): string {
  const items = (values || []).filter(Boolean);
  return items.length ? items.join(", ") : "—";
}

// ─────────────────────────────────────────────
//  HTML Print Export
// ─────────────────────────────────────────────

function openHtmlExport(
  reportData: ReportData,
  processedData?: ProcessedData,
  filename = "EEG_Report.pdf"
) {
  if (typeof window === "undefined") return;

  const rows = [
    ["Name", dash(reportData.patientName), "Age", dash(reportData.age)],
    ["Neuro No.", dash(reportData.neuroNo), "Gender", dash(reportData.gender)],
    ["Recording", dash(reportData.dateTime), "EEG No.", dash(reportData.eegNo)],
    ["Handedness", dash(reportData.handedness), "UHID / Unit", dash(reportData.uhid)],
    ["Last Attack", dash(reportData.lastAttack), "Last Meal", dash(reportData.lastMeal)],
    ["Doctor", dash(reportData.doctor), "Technician", dash(reportData.technician)],
  ];

  const factualText = processedData?.finding_background || reportData.backgroundText || "Background details will appear here.";
  const conclusionText = processedData?.conclusion_draft || reportData.conclusion || "This EEG is within normal limits.";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(filename)}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background: #fff; color: #000; }
      .rp-page { width: 794px; margin: 20px auto; padding: 24px; box-sizing: border-box; }
      .rp-inst { text-align: center; margin-bottom: 6px; }
      .rp-inst-name { font-size: 18px; font-weight: 700; }
      .rp-inst-sub { font-size: 12px; margin-top: 2px; }
      .rp-dept { text-align: center; font-size: 13px; margin-top: 4px; }
      .rp-title { text-align: center; font-size: 16px; font-weight: 700; margin: 10px 0 12px; }
      .rp-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
      .rp-table td { border: 1px solid #000; padding: 6px 8px; }
      .rp-body { font-size: 12px; margin: 6px 0; }
      .rp-lbl { font-weight: 700; }
      .rp-hr { border-top: 1px solid #000; margin: 8px 0; }
      .rp-conclusion { font-size: 12px; margin-top: 6px; line-height: 1.4; }
      .rp-sig-row { display: flex; justify-content: space-between; gap: 24px; margin-top: 24px; }
      .rp-sig-block { width: 45%; }
      .rp-sig-line { border-top: 1px solid #000; margin-top: 28px; }
      .rp-sig-lbl { font-size: 12px; margin-top: 4px; }
      @media print { body { background: #fff; } .rp-page { width: 100%; margin: 0; padding: 0; } }
    </style>
  </head>
  <body>
    <div class="rp-page">
      <div class="rp-inst">
        <div class="rp-inst-name">NATIONAL INSTITUTE OF MENTAL HEALTH AND NEURO SCIENCES</div>
        <div class="rp-inst-sub">Bangalore, KA, 560029, India</div>
      </div>
      <div class="rp-dept">Department of Neurology</div>
      <div class="rp-title">Scalp EEG Report</div>

      <table class="rp-table">
        <tr><td>Name</td><td>${escapeHtml(dash(reportData.patientName))}</td><td>Age</td><td>${escapeHtml(dash(reportData.age))}</td></tr>
        <tr><td>Neuro No.</td><td>${escapeHtml(dash(reportData.neuroNo))}</td><td>Gender</td><td>${escapeHtml(dash(reportData.gender))}</td></tr>
        <tr><td>Recording Date</td><td>${escapeHtml(dash(reportData.dateTime))}</td><td>EEG No</td><td>${escapeHtml(dash(reportData.eegNo))}</td></tr>
        <tr><td>Handedness</td><td>${escapeHtml(dash(reportData.handedness))}</td><td>UHID / Unit</td><td>${escapeHtml(dash(reportData.uhid))}</td></tr>
        <tr><td>Last Attack</td><td>${escapeHtml(dash(reportData.lastAttack))}</td><td>Last Meal</td><td>${escapeHtml(dash(reportData.lastMeal))}</td></tr>
        <tr><td>Doctor</td><td>${escapeHtml(dash(reportData.doctor))}</td><td>Technician</td><td>${escapeHtml(dash(reportData.technician))}</td></tr>
      </table>

      <div class="rp-body"><span class="rp-lbl">Instrument:</span> Galileo Mizar 40 Channel Digital EEG System</div>
      <div class="rp-body"><span class="rp-lbl">Record Type:</span> ${escapeHtml(dash(reportData.recordType))}</div>
      <div class="rp-body"><span class="rp-lbl">Resident:</span> ${escapeHtml(dash(reportData.resident))}</div>
      <div class="rp-hr"></div>
      <div class="rp-body"><span class="rp-lbl">Level of Sensorium:</span> ${escapeHtml(dash(reportData.sensorium))}</div>
      <div class="rp-body"><span class="rp-lbl">Sedation:</span> ${escapeHtml(dash(reportData.sedation))}</div>
      <div class="rp-body"><span class="rp-lbl">Medications:</span> ${escapeHtml(dash(reportData.medications))}</div>
      <div class="rp-body"><span class="rp-lbl">Diagnosis:</span> ${escapeHtml(dash(reportData.diagnosis))}</div>
      <div class="rp-hr"></div>
      <div class="rp-lbl">Findings Detail</div>
      <div class="rp-body">${escapeHtml(dash(reportData.findingsDetail))}</div>
      <div class="rp-body"><span class="rp-lbl">Sleep Detail:</span> ${escapeHtml(dash(reportData.sleepDetail))}</div>
      <div class="rp-body"><span class="rp-lbl">Normal Findings:</span> ${escapeHtml(formatList(reportData.normalFindings))}</div>
      <div class="rp-body"><span class="rp-lbl">Abnormal Findings:</span> ${escapeHtml(formatList(reportData.abnormalFindings))}</div>
      <div class="rp-body"><span class="rp-lbl">Regions:</span> ${escapeHtml(formatList(reportData.regions))}</div>
      <div class="rp-body"><span class="rp-lbl">Correlate:</span> ${escapeHtml(dash(reportData.correlate))}</div>
      <div class="rp-hr"></div>
      <div class="rp-lbl">Factual Report</div>
      <div class="rp-body">${escapeHtml(factualText)}</div>
      <div class="rp-hr"></div>
      <div class="rp-lbl">Conclusion</div>
      <div class="rp-conclusion">${escapeHtml(conclusionText)}</div>
      <div class="rp-sig-row">
        <div class="rp-sig-block"><div class="rp-sig-line"></div><div class="rp-sig-lbl">Signature of Consultant</div></div>
        <div class="rp-sig-block"><div class="rp-sig-line"></div><div class="rp-sig-lbl">Signature of Resident</div></div>
      </div>
      <div style="margin-top:14px;font-size:12px;">Date: ${new Date().toLocaleDateString("en-GB")}</div>
    </div>
  </body>
</html>`;

  const printWindow = window.open("", "_blank", "width=1000,height=1300");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = filename;
  printWindow.focus();

  setTimeout(() => printWindow.print(), 700);
}

// ─────────────────────────────────────────────
//  Main Function
// ─────────────────────────────────────────────

export interface GenerateOptions {
  filename?: string;
}

export function generateNIMHANSPDF(
  reportData: ReportData,
  processedData?: ProcessedData,
  options: GenerateOptions = {}
) {
  openHtmlExport(reportData, processedData, options.filename);
}