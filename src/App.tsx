import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./app/AuthContext";
import ProtectedRoute from "./app/ProtectedRoute";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import PatientReport from "./pages/PatientReport";
import Reports from "./pages/Reports";
import Longitudinal from "./pages/Longitudinal";
import Evidence from "./pages/Evidence";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./app/Login";
import Signup from "./app/Signup";
import Patients from "./pages/Patients";
import PatientHistory from "./pages/PatientHistory";
import CognitiveAssessment from "./pages/Cognitive_Assessment";
import ReportSummary from "./pages/ReportSummary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:jobId"
              element={
                <ProtectedRoute>
                  <PatientReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/longitudinal"
              element={
                <ProtectedRoute>
                  <Longitudinal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/longitudinal/:patientId"
              element={
                <ProtectedRoute>
                  <Longitudinal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <Evidence />
                </ProtectedRoute> 
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cognitive-assessment"
              element={
                <ProtectedRoute>
                  <CognitiveAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-history/:patient_code"
              element={
                <ProtectedRoute>
                  <PatientHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-summary/:resultId"
              element={
                <ProtectedRoute>
                  <ReportSummary />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
