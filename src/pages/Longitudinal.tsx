import { useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { longitudinal } from "@/app/patients";
import { useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Brain, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

// Mock longitudinal data
const patient = {
  id: "P001",
  name: "Rajesh Kumar",
  age: 68,
  sex: "M",
  totalVisits: 5,
};

const longitudinalData = [
  { date: "Jan 2023", riskScore: 58, brainAge: 72, pdr: 8.8, cdi: 1.4, quality: 85 },
  { date: "Apr 2023", riskScore: 62, brainAge: 73, pdr: 8.6, cdi: 1.5, quality: 88 },
  { date: "Jul 2023", riskScore: 68, brainAge: 74, pdr: 8.4, cdi: 1.6, quality: 86 },
  { date: "Oct 2023", riskScore: 72, brainAge: 75, pdr: 8.2, cdi: 1.7, quality: 90 },
  { date: "Jan 2024", riskScore: 78, brainAge: 76, pdr: 8.1, cdi: 1.8, quality: 88 },
];

const visitHistory = [
  { 
    date: "2024-01-15", 
    riskScore: 78, 
    riskLevel: "high", 
    brainAge: 76, 
    pdr: 8.1, 
    cdi: 1.8, 
    quality: 88,
    notes: "Progressive decline observed"
  },
  { 
    date: "2023-10-20", 
    riskScore: 72, 
    riskLevel: "high", 
    brainAge: 75, 
    pdr: 8.2, 
    cdi: 1.7, 
    quality: 90,
    notes: "Continued slowing trend"
  },
  { 
    date: "2023-07-12", 
    riskScore: 68, 
    riskLevel: "moderate", 
    brainAge: 74, 
    pdr: 8.4, 
    cdi: 1.6, 
    quality: 86,
    notes: "Mild deterioration"
  },
  { 
    date: "2023-04-05", 
    riskScore: 62, 
    riskLevel: "moderate", 
    brainAge: 73, 
    pdr: 8.6, 
    cdi: 1.5, 
    quality: 88,
    notes: "Baseline elevated"
  },
  { 
    date: "2023-01-18", 
    riskScore: 58, 
    riskLevel: "moderate", 
    brainAge: 72, 
    pdr: 8.8, 
    cdi: 1.4, 
    quality: 85,
    notes: "Initial screening"
  },
];

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

const getRiskBadgeVariant = (level: string) => {
  switch (level) {
    case "high": return "riskHigh";
    case "moderate": return "riskModerate";
    case "low": return "riskLow";
    default: return "secondary";
  }
};



const Longitudinal = () => {
  const { patientId } = useParams();
   useEffect(() => {
  longitudinal(patient.id, { /* payload if needed */ })
    .then(data => {
      console.log("Longitudinal data updated:", data);
      // Update state with new longitudinal data if necessary
    })
    .catch(error => {
      console.error("Error updating longitudinal data:", error);
    });

 }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
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

        {/* Tabs */}
        <Tabs defaultValue="markers" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="markers">EEG Marker Trends</TabsTrigger>
            <TabsTrigger value="trajectory">Risk Trajectory</TabsTrigger>
          </TabsList>

          {/* Marker Trends Tab */}
          <TabsContent value="markers" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Brain Age Chart */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">Brain Age Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={longitudinalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[68, 80]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="brainAge" stroke="hsl(var(--chart-primary))" strokeWidth={2} name="Brain Age" dot={{ fill: 'hsl(var(--chart-primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* PDR Changes */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">Posterior Dominant Rhythm (PDR)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={longitudinalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[7.5, 9.5]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="pdr" stroke="hsl(var(--risk-moderate))" strokeWidth={2} name="PDR (Hz)" dot={{ fill: 'hsl(var(--risk-moderate))' }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Normal range: 9.5–10.5 Hz (lower values indicate slowing)
                </p>
              </div>

              {/* Cognitive Decline Index */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">Cognitive Decline Index</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={longitudinalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[1, 2]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cdi" stroke="hsl(var(--risk-high))" strokeWidth={2} name="CDI Ratio" dot={{ fill: 'hsl(var(--risk-high))' }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Normal range: 0.8–1.2 (higher values suggest cognitive slowing)
                </p>
              </div>

              {/* EEG Quality */}
              <div className="clinical-card">
                <h3 className="mb-4 font-semibold text-foreground">EEG Signal Quality</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={longitudinalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[70, 100]} />
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
                <LineChart data={longitudinalData}>
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
                <TableHead className="font-semibold">Brain Age</TableHead>
                <TableHead className="font-semibold">PDR (Hz)</TableHead>
                <TableHead className="font-semibold">CDI</TableHead>
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
                        <span className="font-semibold">{visit.riskScore}%</span>
                        {getTrendIcon(visit.riskScore, prevVisit?.riskScore)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRiskBadgeVariant(visit.riskLevel)}>
                        {visit.riskLevel.charAt(0).toUpperCase() + visit.riskLevel.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{visit.brainAge} yrs</span>
                        {getTrendIcon(visit.brainAge, prevVisit?.brainAge)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{visit.pdr}</span>
                        {getTrendIcon(visit.pdr, prevVisit?.pdr, true)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{visit.cdi}</span>
                        {getTrendIcon(visit.cdi, prevVisit?.cdi)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={visit.quality >= 85 ? "qualityGood" : "qualityFair"}>
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
