import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Eye, Download, TrendingUp } from "lucide-react";

interface Report {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  sex: string;
  screeningDate: string;
  riskLevel: "low" | "moderate" | "high";
  probability: number;
  brainAge: number;
  signalQuality: number;
}

const mockReports: Report[] = [
  { id: "R001", patientId: "P001", patientName: "Rajesh Kumar", age: 68, sex: "M", screeningDate: "2024-01-15", riskLevel: "high", probability: 78, brainAge: 76, signalQuality: 88 },
  { id: "R002", patientId: "P002", patientName: "Priya Patel", age: 72, sex: "F", screeningDate: "2024-01-14", riskLevel: "high", probability: 72, brainAge: 79, signalQuality: 85 },
  { id: "R003", patientId: "P003", patientName: "Suresh Reddy", age: 65, sex: "M", screeningDate: "2024-01-14", riskLevel: "moderate", probability: 45, brainAge: 68, signalQuality: 91 },
  { id: "R004", patientId: "P004", patientName: "Anita Sharma", age: 58, sex: "F", screeningDate: "2024-01-13", riskLevel: "moderate", probability: 38, brainAge: 62, signalQuality: 89 },
  { id: "R005", patientId: "P005", patientName: "Vikram Singh", age: 75, sex: "M", screeningDate: "2024-01-13", riskLevel: "high", probability: 82, brainAge: 82, signalQuality: 78 },
  { id: "R006", patientId: "P006", patientName: "Meera Gupta", age: 62, sex: "F", screeningDate: "2024-01-12", riskLevel: "low", probability: 15, brainAge: 60, signalQuality: 94 },
  { id: "R007", patientId: "P007", patientName: "Arun Joshi", age: 70, sex: "M", screeningDate: "2024-01-12", riskLevel: "low", probability: 22, brainAge: 69, signalQuality: 86 },
  { id: "R008", patientId: "P008", patientName: "Lakshmi Nair", age: 67, sex: "F", screeningDate: "2024-01-11", riskLevel: "moderate", probability: 48, brainAge: 71, signalQuality: 87 },
  { id: "R009", patientId: "P009", patientName: "Ravi Krishnan", age: 73, sex: "M", screeningDate: "2024-01-10", riskLevel: "moderate", probability: 55, brainAge: 77, signalQuality: 82 },
  { id: "R010", patientId: "P010", patientName: "Sunita Verma", age: 60, sex: "F", screeningDate: "2024-01-10", riskLevel: "low", probability: 18, brainAge: 58, signalQuality: 92 },
];

const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case "high": return "riskHigh";
    case "moderate": return "riskModerate";
    case "low": return "riskLow";
    default: return "secondary";
  }
};

const Reports = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filteredReports = mockReports.filter((report) => {
    const matchesSearch = report.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === "all" || report.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Reports</h1>
          <p className="text-muted-foreground">View and manage all screening reports</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="clinical-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Age/Sex</TableHead>
                <TableHead className="font-semibold">Screening Date</TableHead>
                <TableHead className="font-semibold">Risk Level</TableHead>
                <TableHead className="font-semibold">Probability</TableHead>
                <TableHead className="font-semibold">Brain Age</TableHead>
                <TableHead className="font-semibold">Quality</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report, index) => (
                <TableRow 
                  key={report.id} 
                  className="data-row animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{report.patientName}</span>
                      <span className="text-xs text-muted-foreground">{report.patientId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {report.age} / {report.sex}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(report.screeningDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(report.riskLevel)}>
                      {report.riskLevel.charAt(0).toUpperCase() + report.riskLevel.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      report.probability >= 70 ? "text-risk-high" :
                      report.probability >= 40 ? "text-risk-moderate" :
                      "text-risk-low"
                    }`}>
                      {report.probability}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-foreground">{report.brainAge} yrs</span>
                    {report.brainAge > report.age && (
                      <span className="ml-1 text-xs text-risk-moderate">(+{report.brainAge - report.age})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.signalQuality >= 85 ? "qualityGood" : "qualityFair"}>
                      {report.signalQuality}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/report/${report.patientId}`)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/longitudinal/${report.patientId}`)}
                      >
                        <TrendingUp className="mr-1 h-4 w-4" />
                        Trends
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredReports.length} of {mockReports.length} reports
        </p>
      </div>
    </MainLayout>
  );
};

export default Reports;
