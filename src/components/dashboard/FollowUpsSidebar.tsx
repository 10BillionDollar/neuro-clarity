import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, AlertCircle, Plus, Edit2, Trash2, X, Check, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import { getPatientsDb } from "@/app/patients";
import { DateRangePicker } from "../ui/date-range-picker";
interface FollowUp {
  id: string;
  patient_code: string;
  patientName?: string;
  followup_date: string;
  priority: "high" | "moderate" | "routine";
  clinician_note?: string;
  created_at?: string;
}

interface Patient {
  patient_code: string;
  name: string;
  age?: number;
  gender?: string;
}

interface DateRangeOption {
  label: string;
  value: string;
  getStartDate: () => Date;
  getEndDate: () => Date;
}


const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-red-500";
    case "moderate": return "bg-yellow-500";
    case "routine": return "bg-green-500";
    default: return "bg-muted";
  }
};

const getPriorityBgColor = (priority: string, followUpDate?: string) => {
  // Check if follow-up is today
  if (followUpDate) {
    const today = new Date();
    const followDate = new Date(followUpDate);
    if (followDate.toDateString() === today.toDateString()) {
      return "bg-blue-50 border-blue-200";
    }
  }
  
  switch (priority) {
    case "high": return "bg-red-50 border-red-200";
    case "moderate": return "bg-yellow-50 border-yellow-200";
    case "routine": return "bg-green-50 border-green-200";
    default: return "bg-muted/20";
  }
};

const getPriorityTextColor = (priority: string) => {
  switch (priority) {
    case "high": return "text-red-700";
    case "moderate": return "text-yellow-700";
    case "routine": return "text-green-700";
    default: return "text-foreground";
  }
};

const getDateRangeMessage = (selectedDateRange: string, customStartDate?: Date, customEndDate?: Date) => {
  if (selectedDateRange === "all") return "";
  
  if (selectedDateRange === "custom") {
    if (customStartDate && customEndDate) {
      const start = format(customStartDate, 'd MMM');
      const end = format(customEndDate, 'd MMM');
      return `No follow-ups available from ${start} to ${end}`;
    }
    return "No follow-ups found in selected date range";
  }
  
  const dateOption = dateRangeOptions.find(option => option.value === selectedDateRange);
  if (dateOption) {
    const start = format(dateOption.getStartDate(), 'd MMM');
    const end = format(dateOption.getEndDate(), 'd MMM');
    return `No follow-ups available from ${start} to ${end}`;
  }
  
  return "No follow-ups found in selected date range";
};

const getDateRangeForPicker = (selectedDateRange: string, customStartDate?: Date, customEndDate?: Date) => {
  if (selectedDateRange === "all") return undefined;
  
  if (selectedDateRange === "custom") {
    if (customStartDate && customEndDate) {
      return { from: customStartDate, to: customEndDate };
    }
    return undefined;
  }
  
  const dateOption = dateRangeOptions.find(option => option.value === selectedDateRange);
  if (dateOption) {
    return { from: dateOption.getStartDate(), to: dateOption.getEndDate() };
  }
  
  return undefined;
};

const dateRangeOptions: DateRangeOption[] = [
  {
    label: "All Time",
    value: "all",
    getStartDate: () => new Date(0),
    getEndDate: () => new Date()
  },
  {
    label: "Today",
    value: "today",
    getStartDate: () => new Date(new Date().setHours(0, 0, 0, 0)),
    getEndDate: () => new Date(new Date().setHours(23, 59, 59, 999))
  },
  {
    label: "This Week",
    value: "week",
    getStartDate: () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    },
    getEndDate: () => {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      return endOfWeek;
    }
  },
  {
    label: "This Month",
    value: "month",
    getStartDate: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    },
    getEndDate: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  },
  {
    label: "Next 7 Days",
    value: "next7",
    getStartDate: () => new Date(new Date().setHours(0, 0, 0, 0)),
    getEndDate: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(23, 59, 59, 999);
      return date;
    }
  },
  {
    label: "Next 30 Days",
    value: "next30",
    getStartDate: () => new Date(new Date().setHours(0, 0, 0, 0)),
    getEndDate: () => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      date.setHours(23, 59, 59, 999);
      return date;
    }
  },
  {
    label: "Custom Range",
    value: "custom",
    getStartDate: () => customStartDate || new Date(0),
    getEndDate: () => customEndDate || new Date()
  }
];

// API Functions
const createFollowUp = async (followUpData: Omit<FollowUp, 'id' | 'created_at'>) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/followups/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followUpData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating follow-up:', error);
    throw error;
  }
};

const getUpcomingFollowUps = async (filters?: {
  dateRange?: string;
  patient?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.dateRange && filters.dateRange !== 'all') {
      const dateOption = dateRangeOptions.find(option => option.value === filters.dateRange);
      if (dateOption) {
        params.append('startDate', format(dateOption.getStartDate(), 'yyyy-MM-dd'));
        params.append('endDate', format(dateOption.getEndDate(), 'yyyy-MM-dd'));
      }
    }
    if (filters?.patient && filters.patient !== 'all') {
      params.append('patient_code', filters.patient);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }
    
    const url = params.toString() 
      ? `${API_BASE_URL}/followups/upcoming?${params.toString()}`
      : `${API_BASE_URL}/followups/upcoming`;
    
    const response = await fetchWithAuth(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching upcoming follow-ups:', error);
    return [];
  }
};

const getFollowUpCalendar = async () => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/followups/calendar`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return [];
  }
};

const updateFollowUp = async (id: string, followUpData: Partial<FollowUp>) => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/followups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followUpData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating follow-up:', error);
    throw error;
  }
};

const deleteFollowUp = async (id: string) => {
  try {
    await fetchWithAuth(`${API_BASE_URL}/followups/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    throw error;
  }
};

export function FollowUpsSidebar() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [selectedPatient, setSelectedPatient] = useState<string>("all");
  const [patientSearchTerm, setPatientSearchTerm] = useState<string>("");
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  
  // Form state
  const [formData, setFormData] = useState({
    patient_code: '',
    followup_date: new Date(),
    priority: 'routine' as 'high' | 'moderate' | 'routine',
    clinician_note: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to get patient name
  const getPatientName = (patientCode: string) => {
    const patient = patients.find(p => p.patient_code === patientCode);
    return patient?.name || patientCode;
  };

  // Filter and pagination logic
  const filteredFollowUps = useMemo(() => {
    let filtered = [...followUps];
    
    // Global search filter
    if (globalSearchTerm.trim()) {
      const searchTerm = globalSearchTerm.toLowerCase();
      filtered = filtered.filter(followUp => {
        const patientName = getPatientName(followUp.patient_code).toLowerCase();
        const patientCode = followUp.patient_code.toLowerCase();
        const clinicianNote = followUp.clinician_note?.toLowerCase() || '';
        const priority = followUp.priority.toLowerCase();
        
        return patientName.includes(searchTerm) || 
               patientCode.includes(searchTerm) || 
               clinicianNote.includes(searchTerm) ||
               priority.includes(searchTerm);
      });
    }
    
    // Date range filter
    if (selectedDateRange !== "all") {
      if (selectedDateRange === "custom") {
        // Handle custom date range
        if (customStartDate && customEndDate) {
          filtered = filtered.filter(followUp => {
            const followUpDate = new Date(followUp.followup_date);
            return followUpDate >= customStartDate && followUpDate <= customEndDate;
          });
        }
      } else {
        // Handle predefined date ranges
        const dateOption = dateRangeOptions.find(option => option.value === selectedDateRange);
        if (dateOption) {
          const startDate = dateOption.getStartDate();
          const endDate = dateOption.getEndDate();
          filtered = filtered.filter(followUp => {
            const followUpDate = new Date(followUp.followup_date);
            return followUpDate >= startDate && followUpDate <= endDate;
          });
        }
      }
    }
    
    // Patient filter
    if (selectedPatient !== "all") {
      filtered = filtered.filter(followUp => followUp.patient_code === selectedPatient);
    }
    
    return filtered;
  }, [followUps, globalSearchTerm, selectedDateRange, selectedPatient, customStartDate, customEndDate, patients]);
  
  // Paginated follow-ups
  const paginatedFollowUps = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredFollowUps.slice(startIndex, endIndex);
  }, [filteredFollowUps, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredFollowUps.length / itemsPerPage);
  
  // Filtered patients for dropdown
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm) return patients;
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
      patient.patient_code.toLowerCase().includes(patientSearchTerm.toLowerCase())
    );
  }, [patients, patientSearchTerm]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDateRange, selectedPatient, globalSearchTerm]);

  // Load data on component mount and when filters/pagination change
  useEffect(() => {
    loadPatients();
    loadFollowUps();
    loadCalendarDates();
  }, []);

  // Reload follow-ups when filters or pagination changes
  useEffect(() => {
    loadFollowUps();
  }, [selectedDateRange, selectedPatient, currentPage]);

  const loadPatients = async () => {
    try {
      const data = await getPatientsDb();
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } 
  };

  const loadFollowUps = async () => {
    try {
      const data = await getUpcomingFollowUps({
        dateRange: selectedDateRange,
        patient: selectedPatient,
        page: currentPage,
        limit: itemsPerPage
      });
      setFollowUps(data);
    } catch (error) {
      console.error('Failed to load follow-ups:', error);
    }
  };

  const loadCalendarDates = async () => {
    try {
      const dates = await getFollowUpCalendar();
      setCalendarDates(dates.map((dateStr: string) => new Date(dateStr)));
    } catch (error) {
      console.error('Failed to load calendar dates:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.patient_code) {
      newErrors.patient_code = 'Patient is required';
    }
    
    if (!formData.followup_date) {
      newErrors.followup_date = 'Date is required';
    } else if (formData.followup_date < new Date(new Date().setHours(0,0,0,0))) {
      newErrors.followup_date = 'Cannot select past dates';
    }
    
    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        followup_date: format(formData.followup_date, 'yyyy-MM-dd')
      };
      
      if (editingFollowUp) {
        await updateFollowUp(editingFollowUp.followup_id, submitData);
      } else {
        await createFollowUp(submitData);
      }
      
      await loadFollowUps();
      await loadCalendarDates();
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error saving follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (followUp: FollowUp) => {
    setEditingFollowUp(followUp);
    setFormData({
      patient_code: followUp.patient_code,
      followup_date: new Date(followUp.followup_date),
      priority: followUp.priority,
      clinician_note: followUp.clinician_note || ''
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this follow-up?')) {
      try {
        await deleteFollowUp(id);
        await loadFollowUps();
        await loadCalendarDates();
      } catch (error) {
        console.error('Error deleting follow-up:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patient_code: '',
      followup_date: new Date(),
      priority: 'routine',
      clinician_note: ''
    });
    setErrors({});
    setEditingFollowUp(null);
  };

  return (
    <div className="clinical-card h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Upcoming Follow-Ups</h3>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Global Search */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground block">Search Follow-Ups</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, code, notes, or priority..."
              value={globalSearchTerm}
              onChange={(e) => setGlobalSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
            {globalSearchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGlobalSearchTerm('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground block">Date Range</Label>
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Custom Date Pickers */}
          {selectedDateRange === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-8 text-sm"
                    >
                      {customStartDate ? (
                        format(customStartDate, 'MMM dd, yyyy')
                      ) : (
                        <span>Start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-8 text-sm"
                    >
                      {customEndDate ? (
                        format(customEndDate, 'MMM dd, yyyy')
                      ) : (
                        <span>End date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>

        {/* Patient Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground block">Patient</Label>
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All patients" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <div className="p-2 sticky top-0 bg-background border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <SelectItem value="all" className="cursor-pointer">
                  All Patients
                </SelectItem>
                {filteredPatients.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No patients found
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <SelectItem key={patient.patient_code} value={patient.patient_code} className="cursor-pointer">
                      {patient.name} ({patient.patient_code})
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3">
        {paginatedFollowUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {filteredFollowUps.length === 0 
                ? (selectedDateRange !== "all" 
                   ? getDateRangeMessage(selectedDateRange, customStartDate, customEndDate)
                   : "No follow-ups found")
                : "No follow-ups on this page"
              }
            </p>
          </div>
        ) : (
          paginatedFollowUps.map((followUp, index) => (
            <div 
              key={followUp.id} 
              className={`group relative rounded-lg border p-3 transition-all hover:shadow-sm animate-slide-in-right ${getPriorityBgColor(followUp.priority, followUp.followup_date)}`}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              {/* Priority indicator */}
              <div className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${getPriorityColor(followUp.priority)}`} />
              
              <div className="ml-2">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${getPriorityTextColor(followUp.priority)}`}>
                    {getPatientName(followUp.patient_code)}
                  </span>
                  <div className="flex items-center gap-1">
                    {followUp.priority === "high" && (
                      <AlertCircle className="h-4 w-4 text-red-500 animate-pulse-subtle" />
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(followUp)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(followUp.followup_id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(followUp.followup_date), 'MMM dd, yyyy')}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-2 text-xs ${getPriorityTextColor(followUp.priority)}`}
                  >
                    {followUp.priority}
                  </Badge>
                </div>
                
                {followUp.clinician_note && (
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                    {followUp.clinician_note}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFollowUps.length)} of {filteredFollowUps.length} follow-ups
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFollowUp ? 'Edit Follow-Up' : 'Schedule New Follow-Up'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="patient_code">Patient *</Label>
              <Select
                value={formData.patient_code}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, patient_code: value }));
                  if (errors.patient_code) {
                    setErrors(prev => ({ ...prev, patient_code: '' }));
                  }
                }}
              >
                <SelectTrigger className={errors.patient_code ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.patient_code} value={patient.patient_code}>
                      {patient.name} ({patient.patient_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_code && (
                <p className="text-sm text-red-500">{errors.patient_code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="followup_date">Follow-up Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${errors.followup_date ? 'border-red-500' : ''}`}
                  >
                    {formData.followup_date ? (
                      format(formData.followup_date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={formData.followup_date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData(prev => ({ ...prev, followup_date: date }));
                        if (errors.followup_date) {
                          setErrors(prev => ({ ...prev, followup_date: '' }));
                        }
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                    modifiers={{
                      hasFollowUp: (date) => calendarDates.some(d => 
                        d.toDateString() === date.toDateString()
                      )
                    }}
                    modifiersStyles={{
                      hasFollowUp: { 
                        backgroundColor: '#3b82f6', 
                        color: 'white',
                        borderRadius: '4px'
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.followup_date && (
                <p className="text-sm text-red-500">{errors.followup_date}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'high' | 'moderate' | 'routine') => {
                  setFormData(prev => ({ ...prev, priority: value }));
                  if (errors.priority) {
                    setErrors(prev => ({ ...prev, priority: '' }));
                  }
                }}
              >
                <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      Moderate
                    </div>
                  </SelectItem>
                  <SelectItem value="routine">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      Routine
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-500">{errors.priority}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinician_note">Clinician Note (Optional)</Label>
              <Textarea
                id="clinician_note"
                placeholder="Add any additional notes..."
                value={formData.clinician_note}
                onChange={(e) => setFormData(prev => ({ ...prev, clinician_note: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editingFollowUp ? 'Update' : 'Save'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
