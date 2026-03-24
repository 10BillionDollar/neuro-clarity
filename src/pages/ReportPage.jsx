import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function ReportPage() {
  const { patientId } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    fetchWithAuth(`http://34.135.191.239:8000/auth/report/${patientId}`)
      .then(res => res.json())
      .then(data => setReport(data))
      .catch(err => console.error(err));
  }, [patientId]);

  if (!report) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Report for {patientId}</h1>
      <pre className="mt-4 bg-gray-100 p-4 rounded">
        {JSON.stringify(report, null, 2)}
      </pre>
    </div>
  );
}
