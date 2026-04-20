import { useEffect, useState } from "react";
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
import { Search, Filter, Eye, Download, TrendingUp, Loader2 } from "lucide-react";
import { historypreview } from "@/app/patients";
import { getReport } from "@/app/reports";
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
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      try {
        // Replace this with a real API call when available.
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };


    loadReports();
    
  }, []);

  const filteredReports = reports.filter((report) => {
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40">
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading reports...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((report, index) => (
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
                        "text-green-600"
                      }`}>
                        {report.probability.toFixed(2)}%
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                    {reports.length === 0
                      ? "No reports are available at the moment. Please check back later."
                      : "No reports match your search or filter."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Results Count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            Showing {filteredReports.length} of {reports.length} reports
          </p>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
