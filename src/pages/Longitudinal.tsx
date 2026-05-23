import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { longitudinal, getPatientsDb } from "@/app/patients";
import { getRiskLevelFromPercentage, getRiskBadgeVariantFromPercentage, getRiskLevelText, getRiskBadgeVariant } from "@/lib/riskUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Brain, Calendar, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Longitudinal = () => {
  const { patientId: patientIdParam } = useParams();
  const navigate = useNavigate();
  const patientId = patientIdParam ? decodeURIComponent(patientIdParam) : undefined;
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await getPatientsDb();
        const patients = Array.isArray(data) ? data : data?.patients ?? [];
        setAllPatients(patients);
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };

    loadPatients();
  }, []);

  const handlePatientChange = (patientCode: string) => {
    setSelectedPatient(patientCode);
    navigate(`/longitudinal/${encodeURIComponent(patientCode)}`);
  };
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        setError('Please select a patient from the dropdown above');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await longitudinal(patientId);
        setPatientData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('No data available');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  // Transform API data to chart format
  const transformChartData = (apiData) => {
    if (!apiData?.charts) return [];
    
    const dates = [...new Set([
      ...apiData.charts.pdr.map(item => item.date),
      ...apiData.charts.quality.map(item => item.date)
    ])];
    
    return dates.map(date => ({
      date,
      riskScore: apiData.charts.risk_trend.find(item => item.date === date)?.value || 0,
      pdr: apiData.charts.pdr.find(item => item.date === date)?.value || 0,
      quality: apiData.charts.quality.find(item => item.date === date)?.value || 0,
      thetaAlphaRatio: apiData.charts.theta_alpha_ratio.find(item => item.date === date)?.value || 0,
    }));
  };

  const chartData = transformChartData(patientData);
  const visitHistory = patientData?.history || [];
  const patient = patientData?.patient_info || { name: 'Loading...', age: 0, gender: 'F' };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedPatient} onValueChange={handlePatientChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPatients.map((patient: any) => (
                      <SelectItem key={patient.patient_code} value={patient.patient_code}>
                        {patient.name} ({patient.patient_code.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading patient data...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedPatient} onValueChange={handlePatientChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPatients.map((patient: any) => (
                      <SelectItem key={patient.patient_code} value={patient.patient_code}>
                        {patient.name} ({patient.patient_code.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-8 w-8" />
            <span className="text-lg">No Patient Selected</span>
          </div>
          <div className="text-destructive text-center">{error}</div>
        </div>
      </MainLayout>
    );
  }

const getTrendIcon = (current: number, previous: number | undefined, lowerIsBetter: boolean = false) => {
  if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const increased = current > previous;
  const isGood = lowerIsBetter ? !increased : increased;
  
  if (current === previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  return increased ? (
    <TrendingUp className={`h-4 w-4 ${isGood ? "text-risk-low" : "text-risk-high"}`} />
  ) : (
    <TrendingDown className={`h-4 w-4 ${isGood ? "text-risk-low" : "text-risk-high"}`} />
  );
};

// Common function to determine risk level based on percentage
const getRiskLevelFromPercentage = (percentage: number) => {
  if (percentage >= 70) return "high";
  if (percentage >= 40) return "moderate";
  return "low";
};

// Common function to get risk badge variant based on percentage
const getRiskBadgeVariantFromPercentage = (percentage: number) => {
  const riskLevel = getRiskLevelFromPercentage(percentage);
  switch (riskLevel) {
    case "high": return "riskHigh";
    case "moderate": return "riskModerate";
    case "low": return "riskLow";
    default: return "secondary";
  }
};

// Legacy function for backward compatibility
const getRiskBadgeVariant = (level: string) => {
  if (!level) return "secondary";
  
  switch (level.toLowerCase()) {
    case "high": return "riskHigh";
    case "moderate": return "riskModerate";
    case "low": return "riskLow";
    default: return "secondary";
  }
};




  return (
    <MainLayout>
      <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedPatient} onValueChange={handlePatientChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPatients.map((patient: any) => (
                      <SelectItem key={patient.patient_code} value={patient.patient_code}>
                        {patient.name} ({patient.patient_code.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
      <div className="space-y-6 mt-4">
        {/* Patient Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{patient.age} years / {patient.sex}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {patient.totalVisits} screenings over 12 months
                  </span>
                </div>
              </div>
              
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="markers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="markers">EEG Marker Trends</TabsTrigger>
            <TabsTrigger value="trajectory">Risk Trajectory</TabsTrigger>
          </TabsList>

          {/* Marker Trends Tab */}
          <TabsContent value="markers" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Risk Trend Chart */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">Risk Score Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="riskScore" stroke="hsl(var(--chart-primary))" strokeWidth={2} name="Risk Score" dot={{ fill: 'hsl(var(--chart-primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* PDR Changes */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">Posterior Dominant Rhythm (PDR)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 5]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="pdr" stroke="hsl(var(--risk-moderate))" strokeWidth={2} name="PDR" dot={{ fill: 'hsl(var(--risk-moderate))' }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  PDR values (lower values indicate slowing)
                </p>
              </div>

              {/* Theta/Alpha Ratio */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">Theta/Alpha Ratio</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 2]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="thetaAlphaRatio" stroke="hsl(var(--risk-high))" strokeWidth={2} name="Theta/Alpha Ratio" dot={{ fill: 'hsl(var(--risk-high))' }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Higher values suggest cognitive slowing
                </p>
              </div>

              {/* EEG Quality */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">EEG Signal Quality</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="quality" stroke="hsl(var(--risk-low))" strokeWidth={2} name="Quality %" dot={{ fill: 'hsl(var(--risk-low))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Risk Trajectory Tab */}
          <TabsContent value="trajectory" className="space-y-6">
            <div className="clinical-card">
              <h3 className="mb-4 font-semibold text-foreground">Risk Score Trajectory</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="riskScore" stroke="hsl(var(--chart-primary))" strokeWidth={3} name="Risk Score %" dot={{ fill: 'hsl(var(--chart-primary))', strokeWidth: 2, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-risk-low" />
                  <span className="text-muted-foreground">Low Risk: 0-40%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-risk-moderate" />
                  <span className="text-muted-foreground">Moderate: 40-70%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-risk-high" />
                  <span className="text-muted-foreground">High Risk: 70%+</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Visit History Table */}
        <div className="clinical-card overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-lg font-semibold text-foreground">Screening History</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Risk Score</TableHead>
                <TableHead className="font-semibold">Risk Level</TableHead>
                {/* <TableHead className="font-semibold">Brain Age</TableHead> */}
                <TableHead className="font-semibold">PDR</TableHead>
                <TableHead className="font-semibold">Theta/Alpha Ratio</TableHead>
                {/* <TableHead className="font-semibold">CDI</TableHead> */}
                <TableHead className="font-semibold">Quality</TableHead>
                <TableHead className="font-semibold">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visitHistory.map((visit, index) => {
                const prevVisit = visitHistory[index + 1];
                return (
                  <TableRow key={visit.date} className="data-row">
                    <TableCell className="font-medium">
                      {new Date(visit.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariantFromPercentage(parseInt(visit.risk_score))} className="font-semibold">
                          {parseInt(visit.risk_score)}%
                        </Badge>
                        {getTrendIcon(visit.riskScore, prevVisit?.riskScore)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariantFromPercentage(parseInt(visit.risk_score))}>
                        {getRiskLevelFromPercentage(parseInt(visit.risk_score)).charAt(0).toUpperCase() + getRiskLevelFromPercentage(parseInt(visit.risk_score)).slice(1)} Risk
                      </Badge>
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{visit.brain_age || 'N/A'}</span>
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{parseInt(visit.pdr)}</span>
                        {getTrendIcon(visit.pdr, prevVisit?.pdr, true)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{parseInt(visit.theta_alpha_ratio)}</span>
                        {getTrendIcon(visit.theta_alpha_ratio, prevVisit?.theta_alpha_ratio)}
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{visit.cdi || 'N/A'}</span>
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <Badge variant={visit.quality >= 50 ? "qualityGood" : "qualityFair"}>
                        {visit.quality}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {visit.notes}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default Longitudinal;
