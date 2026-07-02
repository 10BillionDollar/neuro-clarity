import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, User, FileText, TrendingUp, Shield, Settings, ChevronRight, CheckCircle2, Circle, Printer, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/MainLayout';
interface Patient {
  name: string;
  age: string;
  gender: string;
  phone: string;
  date: string;
  ref: string;
  neuro: string;
  edu: string;
  conditions: string;
  meds: string;
}

interface Answers {
  [key: string]: string | number;
}

interface Scores {
  cognitive?: number;
  sleep?: number;
  midas?: number;
  midasB?: number;
  midasC?: number;
}

interface Completed {
  intake: boolean;
  cognitive: boolean;
  sleep: boolean;
  headache: boolean;
}

const epworthItems = [
  'Sitting and reading',
  'Watching TV',
  'Sitting inactive in a public place (e.g. cinema, meeting)',
  'As a passenger in a car for an hour without a break',
  'Lying down to rest in the afternoon',
  'Sitting and talking to someone',
  'Sitting quietly after lunch (no alcohol)',
  'In a car, while stopped for a few minutes in traffic'
];

export default function NeuroIntake() {
  const [currentScreen, setCurrentScreen] = useState('screen-welcome');
  const [role, setRole] = useState<'patient' | 'staff'>('patient');
  const [patient, setPatient] = useState<Patient>({
    name: '',
    age: '',
    gender: '',
    phone: '',
    date: '',
    ref: '',
    neuro: '',
    edu: '',
    conditions: '',
    meds: ''
  });
  const [answers, setAnswers] = useState<Answers>({});
  const [scores, setScores] = useState<Scores>({});
  const [completed, setCompleted] = useState<Completed>({
    intake: false,
    cognitive: false,
    sleep: false,
    headache: false
  });

  const screens = ['screen-welcome', 'screen-reg', 'screen-modules', 'screen-intake', 'screen-cognitive', 'screen-sleep', 'screen-headache', 'screen-summary'] as const;
  const currentIndex = screens.indexOf(currentScreen as any);
  const progress = Math.round((currentIndex / (screens.length - 1)) * 100);

  const goTo = (screenId: string) => {
    setCurrentScreen(screenId);
    window.scrollTo(0, 0);
  };

  const selectRole = (r: 'patient' | 'staff') => {
    setRole(r);
  };

  const goToReg = () => {
    const today = new Date().toISOString().split('T')[0];
    setPatient(prev => ({ ...prev, date: today }));
    goTo('screen-reg');
  };

  const goToModules = () => {
    if (!patient.name || !patient.age || !patient.gender) {
      alert('Please fill in Name, Age, and Gender to continue.');
      return;
    }
    goTo('screen-modules');
  };

  const handlePatientChange = (field: keyof Patient, value: string) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const selectOpt = (key: string, val: string) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const selectScale = (key: string, val: number) => {
    setAnswers(prev => ({ ...prev, [key]: val }));
  };

  const startModule = (mod: string) => {
    goTo('screen-' + mod);
  };

  const completeModule = (mod: string) => {
    setCompleted(prev => ({ ...prev, [mod]: true }));

    if (mod === 'cognitive') scoreCognitive();
    if (mod === 'sleep') scoreSleep();
    if (mod === 'headache') scoreMIDAS();

    goTo('screen-modules');
  };

  const scoreCognitive = () => {
    const keys = ['cog1', 'cog2', 'cog3', 'cog4', 'cog5', 'cog6'];
    let score = keys.reduce((sum, k) => sum + ((answers[k] as number) || 0), 0);
    
    if (answers['cogconcern'] === 'Yes — frequently') score += 3;
    else if (answers['cogconcern'] === 'Yes — occasionally') score += 1;
    if (answers['cogadl'] === 'Yes — significantly') score += 3;
    else if (answers['cogadl'] === 'Yes — mildly') score += 1;
    
    setScores(prev => ({ ...prev, cognitive: score }));
  };

  const scoreSleep = () => {
    let total = 0;
    for (let i = 0; i < 8; i++) total += ((answers['ep' + i] as number) || 0);
    setScores(prev => ({ ...prev, sleep: total }));
  };

  const scoreMIDAS = () => {
    if (answers['hasheadache'] === 'No') {
      setScores(prev => ({ ...prev, midas: -1 }));
      return;
    }
    const midasInputs = [1, 2, 3, 4, 5];
    const total = midasInputs.reduce((sum, i) => {
      const val = parseInt((document.getElementById('midas' + i) as HTMLInputElement)?.value) || 0;
      return sum + val;
    }, 0);
    
    const midasB = parseInt((document.getElementById('midasB') as HTMLInputElement)?.value) || 0;
    const midasC = parseInt((document.getElementById('midasC') as HTMLInputElement)?.value) || 0;
    
    setScores(prev => ({ ...prev, midas: total, midasB, midasC }));
  };

  const viewSummary = () => {
    goTo('screen-summary');
  };

  const startNew = () => {
    if (!confirm('Start a new patient? Current data will be cleared.')) return;
    setCurrentScreen('screen-welcome');
    setRole('patient');
    setPatient({
      name: '',
      age: '',
      gender: '',
      phone: '',
      date: '',
      ref: '',
      neuro: '',
      edu: '',
      conditions: '',
      meds: ''
    });
    setAnswers({});
    setScores({});
    setCompleted({
      intake: false,
      cognitive: false,
      sleep: false,
      headache: false
    });
  };

  const cogLabel = (s: number) => {
    if (s <= 4) return { label: 'Low Concern', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (s <= 10) return { label: 'Mild Concern', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: 'High Concern', cls: 'bg-red-50 text-red-700 border-red-200' };
  };

  const sleepLabel = (s: number) => {
    if (s <= 10) return { label: 'Normal', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (s <= 15) return { label: 'Mild EDS', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    if (s <= 20) return { label: 'Moderate EDS', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: 'Severe EDS', cls: 'bg-red-50 text-red-700 border-red-200' };
  };

  const midasLabel = (s: number) => {
    if (s < 0) return { label: 'No Headache', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (s <= 5) return { label: 'Grade I – Minimal', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (s <= 10) return { label: 'Grade II – Mild', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    if (s <= 20) return { label: 'Grade III – Moderate', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: 'Grade IV – Severe', cls: 'bg-red-50 text-red-700 border-red-200' };
  };

  const allDone = Object.values(completed).every(v => v);
  const cog = cogLabel(scores.cognitive || 0);
  const slp = sleepLabel(scores.sleep || 0);
  const mid = midasLabel(scores.midas || -1);

  const flags = [];
  if ((scores.cognitive || 0) >= 11) flags.push({ cls: 'bg-red-50 text-red-800 border-red-200', icon: '🔴', text: `High cognitive complaint score (${scores.cognitive}). Formal MMSE / MoCA assessment strongly recommended.` });
  else if ((scores.cognitive || 0) >= 5) flags.push({ cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: '🟡', text: `Mild cognitive complaints reported. Consider formal cognitive screening at this visit.` });
  else flags.push({ cls: 'bg-green-50 text-green-800 border-green-200', icon: '🟢', text: `Cognitive self-report within normal range. No immediate escalation needed.` });

  if ((scores.sleep || 0) >= 16) flags.push({ cls: 'bg-red-50 text-red-800 border-red-200', icon: '🔴', text: `Severe excessive daytime sleepiness (Epworth ${scores.sleep}). Evaluate for obstructive sleep apnoea or narcolepsy.` });
  else if ((scores.sleep || 0) >= 11) flags.push({ cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: '🟡', text: `Mild–moderate daytime sleepiness (Epworth ${scores.sleep}). Consider sleep history and polysomnography referral.` });
  else flags.push({ cls: 'bg-green-50 text-green-800 border-green-200', icon: '🟢', text: `Daytime sleepiness within normal range (Epworth ${scores.sleep}).` });

  if ((scores.midas || 0) >= 21) flags.push({ cls: 'bg-red-50 text-red-800 border-red-200', icon: '🔴', text: `Severe migraine disability (MIDAS ${scores.midas}). Prophylactic therapy review recommended.` });
  else if ((scores.midas || 0) >= 11) flags.push({ cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: '🟡', text: `Moderate headache disability (MIDAS ${scores.midas}). Discuss acute and preventive treatment.` });
  else if ((scores.midas || 0) >= 0) flags.push({ cls: 'bg-green-50 text-green-800 border-green-200', icon: '🟢', text: `Low headache disability (MIDAS ${scores.midas}).` });

  if (answers['family'] && (answers['family'] as string).includes('dementia')) flags.push({ cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: '🟡', text: 'Family history of dementia reported. Consider longitudinal cognitive monitoring.' });
  if (answers['trend'] === 'Getting worse') flags.push({ cls: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: '🟡', text: "Patient reports symptoms are worsening. Prioritise investigation." });

  const recs = [];
  if ((scores.cognitive || 0) >= 11) recs.push('Conduct formal MMSE and / or MoCA at this consultation. Consider EEG for cognitive biomarker baseline.');
  if ((scores.cognitive || 0) >= 5 && (scores.cognitive || 0) < 11) recs.push('Administer MoCA at this visit to quantify cognitive performance. Longitudinal monitoring advised.');
  if (answers['family'] && (answers['family'] as string).includes('dementia') && (scores.cognitive || 0) >= 5) recs.push('Family history of dementia with self-reported cognitive symptoms: consider referral to memory clinic and schedule 6-month EEG follow-up.');
  if ((scores.sleep || 0) >= 11) recs.push('Excessive daytime sleepiness detected. Evaluate for obstructive sleep apnoea — polysomnography referral if no contraindication.');
  if ((scores.midas || 0) >= 11) recs.push('Moderate–severe migraine disability. Review acute medication appropriateness; discuss prophylactic therapy (topiramate / propranolol / amitriptyline per SIGN guidelines).');
  if ((scores.midas || 0) >= 21) recs.push('Grade IV MIDAS: Severe impact on daily function. Urgent headache clinic referral recommended if not already under specialist care.');
  if (answers['trend'] === 'Getting worse') recs.push('Patient reports worsening symptoms. Prioritise investigations at this visit rather than watchful waiting.');
  if (!recs.length) recs.push('All screening scores within normal range. Routine clinical assessment recommended. Schedule follow-up in 6 months if symptoms persist.');

  const scaleLabel = (v: number) => ['Never', 'Rarely', 'Sometimes', 'Often'][v] || '—';

  return (
    <MainLayout>
    <div className="min-h-screen bg-background">
      <Progress value={progress} className="h-1" />

      {/* SCREEN 1 — WELCOME / ROLE */}
      {currentScreen === 'screen-welcome' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <div className="text-center py-8">
                   
            <p className="text-sm text-muted-foreground mt-2">Neuro Patient Intake — Cognitive, Sleep & Headache Screening</p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Who is filling this form?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div 
                  className={`p-6 text-center border-2 rounded-lg cursor-pointer transition-all ${role === 'patient' ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                  onClick={() => selectRole('patient')}
                >
                  <div className="text-4xl mb-3">🧑</div>
                  <div className="font-semibold text-primary">I am the Patient</div>
                  <div className="text-xs text-muted-foreground mt-1">Self-fill on tablet or phone</div>
                </div>
                <div 
                  className={`p-6 text-center border-2 rounded-lg cursor-pointer transition-all ${role === 'staff' ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                  onClick={() => selectRole('staff')}
                >
                  <div className="text-4xl mb-3">🩺</div>
                  <div className="font-semibold text-primary">Staff / Technician</div>
                  <div className="text-xs text-muted-foreground mt-1">Entering on patient's behalf</div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button size="lg" onClick={goToReg}>Continue <ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">What this does:</strong> This intake collects symptom history and runs validated screening tools for cognitive decline, sleep disorders, and headache. Results go directly to the neurologist before your consultation. Takes approximately 8–12 minutes.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 2 — PATIENT REGISTRATION */}
      {currentScreen === 'screen-reg' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Patient Details</CardTitle>
              <CardDescription>Basic Information</CardDescription>
              <p className="text-sm text-muted-foreground">This information will appear on the neurologist's summary.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input value={patient.name} onChange={(e) => handlePatientChange('name', e.target.value)} placeholder="e.g. Ramesh Kumar" />
                </div>
                <div>
                  <Label>Age <span className="text-destructive">*</span></Label>
                  <Input type="number" value={patient.age} onChange={(e) => handlePatientChange('age', e.target.value)} placeholder="e.g. 58" min="1" max="110" />
                </div>
                <div>
                  <Label>Gender <span className="text-destructive">*</span></Label>
                  <Select value={patient.gender} onValueChange={(value) => handlePatientChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input type="tel" value={patient.phone} onChange={(e) => handlePatientChange('phone', e.target.value)} placeholder="10-digit mobile" />
                </div>
                <div>
                  <Label>Visit Date</Label>
                  <Input type="date" value={patient.date} onChange={(e) => handlePatientChange('date', e.target.value)} />
                </div>
                <div>
                  <Label>Referred By</Label>
                  <Input value={patient.ref} onChange={(e) => handlePatientChange('ref', e.target.value)} placeholder="Dr. / Clinic name" />
                </div>
                <div>
                  <Label>Neurologist</Label>
                  <Input value={patient.neuro} onChange={(e) => handlePatientChange('neuro', e.target.value)} placeholder="Attending neurologist" />
                </div>
                <div>
                  <Label>Education Level</Label>
                  <Select value={patient.edu} onValueChange={(value) => handlePatientChange('edu', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No formal education">No formal education</SelectItem>
                      <SelectItem value="Primary school">Primary school</SelectItem>
                      <SelectItem value="Secondary school">Secondary school</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Known Medical Conditions</Label>
                  <Input value={patient.conditions} onChange={(e) => handlePatientChange('conditions', e.target.value)} placeholder="e.g. Diabetes, Hypertension, Thyroid disorder" />
                </div>
                <div className="md:col-span-2">
                  <Label>Current Medications</Label>
                  <Textarea value={patient.meds} onChange={(e) => handlePatientChange('meds', e.target.value)} placeholder="List current medications, if any" />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => goTo('screen-welcome')}>← Back</Button>
                <Button onClick={goToModules}>Next →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 3 — MODULE SELECTOR */}
      {currentScreen === 'screen-modules' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg mb-6 flex gap-5 flex-wrap text-sm">
            <span className="font-bold">{patient.name}</span>
            <span className="opacity-70 text-xs">{patient.age}y · {patient.gender}</span>
            <span className="opacity-70 text-xs">📅 {patient.date || 'Today'}</span>
            {patient.neuro && <span className="opacity-70 text-xs">Dr. {patient.neuro}</span>}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Screening Modules</CardTitle>
              <CardDescription>Complete All Sections</CardDescription>
              <p className="text-sm text-muted-foreground">Each section takes 1–3 minutes. Complete all four for the full neurologist summary.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div 
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${completed.intake ? 'border-green-500 bg-green-50' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                  onClick={() => startModule('intake')}
                >
                  <div className="text-2xl w-10 text-center">📋</div>
                  <div className="flex-1">
                    <div className="font-semibold">Neuro Symptom Intake</div>
                    <div className="text-xs text-muted-foreground">Chief complaint, onset, family history, triggers</div>
                  </div>
                  <Badge variant={completed.intake ? 'default' : 'secondary'} className={completed.intake ? 'bg-green-500' : ''}>
                    {completed.intake ? '✓ Done' : 'Pending'}
                  </Badge>
                </div>
                
                <div 
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${completed.cognitive ? 'border-green-500 bg-green-50' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                  onClick={() => startModule('cognitive')}
                >
                  <div className="text-2xl w-10 text-center">🧠</div>
                  <div className="flex-1">
                    <div className="font-semibold">Cognitive Screening</div>
                    <div className="text-xs text-muted-foreground">Memory, orientation, attention, language — flags for formal MMSE/MoCA</div>
                  </div>
                  <Badge variant={completed.cognitive ? 'default' : 'secondary'} className={completed.cognitive ? 'bg-green-500' : ''}>
                    {completed.cognitive ? '✓ Done' : 'Pending'}
                  </Badge>
                </div>
                
                <div 
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${completed.sleep ? 'border-green-500 bg-green-50' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                  onClick={() => startModule('sleep')}
                >
                  <div className="text-2xl w-10 text-center">😴</div>
                  <div className="flex-1">
                    <div className="font-semibold">Sleep Screening (Epworth)</div>
                    <div className="text-xs text-muted-foreground">Daytime sleepiness — validated 8-item scale</div>
                  </div>
                  <Badge variant={completed.sleep ? 'default' : 'secondary'} className={completed.sleep ? 'bg-green-500' : ''}>
                    {completed.sleep ? '✓ Done' : 'Pending'}
                  </Badge>
                </div>
                
                <div 
                  className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${completed.headache ? 'border-green-500 bg-green-50' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                  onClick={() => startModule('headache')}
                >
                  <div className="text-2xl w-10 text-center">🤕</div>
                  <div className="flex-1">
                    <div className="font-semibold">Headache Assessment (MIDAS)</div>
                    <div className="text-xs text-muted-foreground">Migraine disability — 90-day impact scoring</div>
                  </div>
                  <Badge variant={completed.headache ? 'default' : 'secondary'} className={completed.headache ? 'bg-green-500' : ''}>
                    {completed.headache ? '✓ Done' : 'Pending'}
                  </Badge>
                </div>
              </div>
              
              {allDone && (
                <div className="flex justify-end mt-6">
                  <Button size="lg" onClick={viewSummary}>View Neurologist Summary <ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 4 — NEURO SYMPTOM INTAKE */}
      {currentScreen === 'screen-intake' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg mb-6 flex gap-5 flex-wrap text-sm">
            <span className="font-bold">{patient.name}</span>
            <span className="opacity-70 text-xs">{patient.age}y · {patient.gender}</span>
            <span className="opacity-70 text-xs">📅 {patient.date || 'Today'}</span>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-2xl">📋</div>
                <div>
                  <CardTitle>Neuro Symptom Intake</CardTitle>
                  <CardDescription>Tell us about the main reason for today's visit</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">1</span>What is the main symptom or complaint today?</p>
                  <div className="space-y-2">
                    {['Memory problems / forgetfulness', 'Headache / migraine', 'Dizziness / vertigo', 'Seizures / fits', 'Numbness / weakness in limbs', 'Sleep problems', 'Tremors / shaking', 'Other'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['complaint'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('complaint', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['complaint'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">2</span>How long have you had this symptom?</p>
                  <div className="space-y-2">
                    {['Less than 1 week', '1–4 weeks', '1–6 months', '6 months – 2 years', 'More than 2 years'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['duration'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('duration', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['duration'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">3</span>How did the symptom start?</p>
                  <div className="space-y-2">
                    {['Suddenly (within hours/days)', 'Gradually (over weeks/months)', 'After an event (fall, illness, surgery)'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['onset'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('onset', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['onset'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">4</span>Is the symptom getting worse, better, or staying the same?</p>
                  <div className="space-y-2">
                    {['Getting worse', 'Staying the same', 'Getting better', 'Comes and goes'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['trend'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('trend', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['trend'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">5</span>Any family history of neurological conditions?</p>
                  <div className="space-y-2">
                    {['Yes — dementia / memory loss', 'Yes — epilepsy / seizures', 'Yes — stroke', "Yes — Parkinson's", 'Yes — migraine', 'No known family history'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['family'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('family', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['family'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">6</span>Has the patient had any previous neurological investigations?</p>
                  <div className="space-y-2">
                    {['EEG done previously', 'MRI / CT scan done', 'Both EEG and imaging', 'No previous investigations'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['prev'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('prev', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['prev'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => goTo('screen-modules')}>← Back</Button>
                <Button onClick={() => completeModule('intake')}>Save & Continue →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 5 — COGNITIVE SCREENING */}
      {currentScreen === 'screen-cognitive' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg mb-6 flex gap-5 flex-wrap text-sm">
            <span className="font-bold">{patient.name}</span>
            <span className="opacity-70 text-xs">{patient.age}y · {patient.gender}</span>
            <span className="opacity-70 text-xs">📅 {patient.date || 'Today'}</span>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-2xl">🧠</div>
                <div>
                  <CardTitle>Cognitive Screening</CardTitle>
                  <CardDescription>Self-reported cognitive symptoms — flags patients for formal MMSE / MoCA assessment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { q: 'Do you forget the names of people you know well — more than you used to?', key: 'cog1' },
                  { q: 'Do you forget where you placed things (keys, glasses, phone) more frequently than before?', key: 'cog2' },
                  { q: 'Do you have difficulty remembering recent events or conversations?', key: 'cog3' },
                  { q: 'Do you find it hard to follow conversations or TV programmes that you used to follow easily?', key: 'cog4' },
                  { q: 'Do you get confused about the day, date, or where you are?', key: 'cog5' },
                  { q: 'Do you have difficulty finding the right word when speaking?', key: 'cog6' }
                ].map((item, idx) => (
                  <div key={item.key} className="pb-6 border-b last:border-0">
                    <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">{idx + 1}</span>{item.q}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map(val => (
                        <div 
                          key={val} 
                          className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${answers[item.key] === val ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                          onClick={() => selectScale(item.key, val)}
                        >
                          <div className="text-lg font-bold">{val}</div>
                          <div className="text-xs">{['Never', 'Rarely', 'Sometimes', 'Often'][val]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">7</span>Have family members or close friends expressed concern about your memory?</p>
                  <div className="space-y-2">
                    {['Yes — frequently', 'Yes — occasionally', 'No'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['cogconcern'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('cogconcern', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['cogconcern'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">8</span>Do difficulties with memory or thinking affect your daily activities?</p>
                  <div className="space-y-2">
                    {['Yes — significantly', 'Yes — mildly', 'No'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['cogadl'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('cogadl', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['cogadl'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => goTo('screen-modules')}>← Back</Button>
                <Button onClick={() => completeModule('cognitive')}>Save & Continue →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 6 — EPWORTH SLEEP SCALE */}
      {currentScreen === 'screen-sleep' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg mb-6 flex gap-5 flex-wrap text-sm">
            <span className="font-bold">{patient.name}</span>
            <span className="opacity-70 text-xs">{patient.age}y · {patient.gender}</span>
            <span className="opacity-70 text-xs">📅 {patient.date || 'Today'}</span>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-2xl">😴</div>
                <div>
                  <CardTitle>Epworth Sleepiness Scale</CardTitle>
                  <CardDescription>Rate the chance you would doze off in each situation — 0 to 3</CardDescription>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground mt-4 leading-relaxed">
                <strong className="text-foreground">Scale: </strong>0 = Would never doze &nbsp;·&nbsp; 1 = Slight chance &nbsp;·&nbsp; 2 = Moderate chance &nbsp;·&nbsp; 3 = High chance
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {epworthItems.map((item, i) => (
                  <div key={i} className="pb-6 border-b last:border-0">
                    <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">{i + 1}</span>{item}</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[0, 1, 2, 3].map(val => (
                        <div 
                          key={val} 
                          className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${answers['ep' + i] === val ? 'border-primary bg-primary text-white' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                          onClick={() => selectScale('ep' + i, val)}
                        >
                          <div className="text-lg font-bold">{val}</div>
                          <div className="text-xs">{['Never', 'Slight', 'Moderate', 'High'][val]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => goTo('screen-modules')}>← Back</Button>
                <Button onClick={() => completeModule('sleep')}>Save & Continue →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 7 — MIDAS */}
      {currentScreen === 'screen-headache' && (
        <div className="max-w-2xl mx-auto p-6 pb-20">
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg mb-6 flex gap-5 flex-wrap text-sm">
            <span className="font-bold">{patient.name}</span>
            <span className="opacity-70 text-xs">{patient.age}y · {patient.gender}</span>
            <span className="opacity-70 text-xs">📅 {patient.date || 'Today'}</span>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center text-2xl">🤕</div>
                <div>
                  <CardTitle>MIDAS — Headache Assessment</CardTitle>
                  <CardDescription>Think about the <strong>last 3 months</strong> only. Enter number of days for each.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="pb-6 border-b">
                  <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">A</span>Do you get headaches?</p>
                  <div className="space-y-2">
                    {['Yes', 'No'].map(opt => (
                      <div 
                        key={opt} 
                        className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${answers['hasheadache'] === opt ? 'border-primary bg-accent' : 'border-border hover:border-primary hover:bg-accent/50'}`}
                        onClick={() => selectOpt('hasheadache', opt)}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border-2 flex-shrink-0 ${answers['hasheadache'] === opt ? 'border-primary bg-primary' : 'border-muted-foreground'}`}></div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {answers['hasheadache'] === 'Yes' && (
                  <div className="space-y-6">
                    {[
                      { q: 'Days you missed work or school because of headache in last 3 months', id: 'midas1' },
                      { q: 'Days your productivity at work/school was reduced by half or more due to headache', id: 'midas2' },
                      { q: 'Days you missed household chores because of headache', id: 'midas3' },
                      { q: 'Days your productivity in household chores was reduced by half or more', id: 'midas4' },
                      { q: 'Days you missed family, social, or leisure activities because of headache', id: 'midas5' }
                    ].map((item, idx) => (
                      <div key={item.id} className="pb-6 border-b last:border-0">
                        <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">{idx + 1}</span>{item.q}</p>
                        <Input type="number" id={item.id} min="0" max="90" placeholder="Enter number of days" className="max-w-[200px]" />
                      </div>
                    ))}

                    <div className="pb-6 border-b">
                      <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">B</span>On how many days in the last 3 months did you have a headache? (even if it didn't affect activity)</p>
                      <Input type="number" id="midasB" min="0" max="90" placeholder="Enter number of days" className="max-w-[200px]" />
                    </div>

                    <div>
                      <p className="font-semibold text-sm mb-3"><span className="bg-accent text-primary text-xs font-bold px-2 py-1 rounded mr-2">C</span>On a scale of 0–10, how painful were the headaches on average?</p>
                      <Input type="number" id="midasC" min="0" max="10" placeholder="0 = no pain, 10 = worst" className="max-w-[200px]" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => goTo('screen-modules')}>← Back</Button>
                <Button onClick={() => completeModule('headache')}>Save & Continue →</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SCREEN 8 — NEUROLOGIST SUMMARY */}
      {currentScreen === 'screen-summary' && (
        <div className="max-w-5xl mx-auto p-6 pb-20" id="print-report">
          <div className="bg-primary text-primary-foreground px-6 py-4 rounded-lg mb-6 flex gap-5 flex-wrap text-sm">
            <span className="font-bold">{patient.name}</span>
            <span className="opacity-70 text-xs">{patient.age}y · {patient.gender}</span>
            <span className="opacity-70 text-xs">📅 {patient.date || 'Today'}</span>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6 bg-primary text-primary-foreground">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-bold text-lg">Neurologist Summary</h2>
                  <p className="text-xs opacity-75 mt-1">NEMA AI — Neuro Intake Report · Confidential</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" /> Print / PDF
                  </Button>
                  <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={startNew}>
                    <Plus className="h-4 w-4 mr-2" /> New Patient
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SCORE CARDS */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Screening Scores at a Glance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-lg text-center ${cog.cls}`}>
                  <div className="text-3xl font-extrabold">{scores.cognitive || 0}</div>
                  <div className="text-xs font-semibold mt-1">Cognitive Screen</div>
                  <div className="text-xs opacity-70">{cog.label}</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${slp.cls}`}>
                  <div className="text-3xl font-extrabold">{scores.sleep || 0}</div>
                  <div className="text-xs font-semibold mt-1">Epworth Score</div>
                  <div className="text-xs opacity-70">{slp.label}</div>
                </div>
                <div className={`p-4 rounded-lg text-center ${mid.cls}`}>
                  <div className="text-3xl font-extrabold">{scores.midas < 0 ? '–' : scores.midas}</div>
                  <div className="text-xs font-semibold mt-1">MIDAS Score</div>
                  <div className="text-xs opacity-70">{mid.label}</div>
                </div>
                <div className="p-4 rounded-lg text-center bg-accent border-2 border-primary">
                  <div className="text-3xl font-extrabold text-primary">{Object.values(completed).filter(v => v).length}/4</div>
                  <div className="text-xs font-semibold mt-1">Modules Done</div>
                  <div className="text-xs opacity-70">Screening complete</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FLAGS */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Clinical Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {flags.map((f, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${f.cls}`}>
                    <span className="flex-shrink-0">{f.icon}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PATIENT INFO */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Name</span><span className="font-semibold text-sm">{patient.name}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Age / Gender</span><span className="font-semibold text-sm">{patient.age} yrs · {patient.gender}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Education</span><span className="font-semibold text-sm">{patient.edu || 'Not specified'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Phone</span><span className="font-semibold text-sm">{patient.phone || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Date</span><span className="font-semibold text-sm">{patient.date || 'Today'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Referred By</span><span className="font-semibold text-sm">{patient.ref || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Neurologist</span><span className="font-semibold text-sm">{patient.neuro || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Known Conditions</span><span className="font-semibold text-sm">{patient.conditions || 'None reported'}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Current Medications</span><span className="font-semibold text-sm">{patient.meds || 'None reported'}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* INTAKE SUMMARY */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Symptom Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Chief Complaint</span><span className="font-semibold text-sm">{answers['complaint'] || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Duration</span><span className="font-semibold text-sm">{answers['duration'] || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Onset</span><span className="font-semibold text-sm">{answers['onset'] || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Trend</span><span className="font-semibold text-sm">{answers['trend'] || '—'}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Family History</span><span className="font-semibold text-sm">{answers['family'] || '—'}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Prior Investigations</span><span className="font-semibold text-sm">{answers['prev'] || '—'}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* COGNITIVE DETAIL */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Cognitive Screening Detail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  ['Forgetting names', answers['cog1']],
                  ['Misplacing items', answers['cog2']],
                  ['Recent event memory', answers['cog3']],
                  ['Following conversations', answers['cog4']],
                  ['Orientation / confusion', answers['cog5']],
                  ['Word-finding difficulty', answers['cog6']],
                  ['Family concern expressed', answers['cogconcern']],
                  ['Impact on daily life', answers['cogadl']]
                ].map(([k, v], i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-muted-foreground text-sm">{k}</span>
                    <span className="font-semibold text-sm">{typeof v === 'number' ? scaleLabel(v) : (v || '—')}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 bg-muted rounded-lg px-3 mt-2">
                  <span className="text-muted-foreground text-sm font-bold">Total Cognitive Score</span>
                  <span className="font-bold text-sm">{scores.cognitive || 0} / 24 — {cog.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SLEEP DETAIL */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Sleep Screening Detail (Epworth)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {epworthItems.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0">
                    <span className="text-muted-foreground text-sm">{item}</span>
                    <span className="font-semibold text-sm">{['Never', 'Slight', 'Moderate', 'High'][(answers['ep' + i] as number) || 0]}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 bg-muted rounded-lg px-3 mt-2">
                  <span className="text-muted-foreground text-sm font-bold">Epworth Total</span>
                  <span className="font-bold text-sm">{scores.sleep || 0} / 24 — {slp.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HEADACHE DETAIL */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Headache Assessment (MIDAS)</CardTitle>
            </CardHeader>
            <CardContent>
              {answers['hasheadache'] === 'No' ? (
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Headaches</span><span className="font-semibold text-sm">Patient reports no headaches</span></div>
              ) : (
                <div className="space-y-2">
                  {[
                    'Days missed work/school',
                    'Days reduced productivity at work',
                    'Days missed household chores',
                    'Days reduced household productivity',
                    'Days missed social/leisure activities'
                  ].map((label, i) => (
                    <div key={i} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-muted-foreground text-sm">{label}</span>
                      <span className="font-semibold text-sm">{(document.getElementById('midas' + (i + 1)) as HTMLInputElement)?.value || 0} days</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Total headache days (3 months)</span><span className="font-semibold text-sm">{scores.midasB || 0} days</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground text-sm">Average pain intensity (0–10)</span><span className="font-semibold text-sm">{scores.midasC || 0}</span></div>
                  <div className="flex justify-between py-3 bg-muted rounded-lg px-3 mt-2">
                    <span className="text-muted-foreground text-sm font-bold">MIDAS Score</span>
                    <span className="font-bold text-sm">{scores.midas} — {mid.label}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RECOMMENDATIONS */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-primary">Suggested Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recs.map((r, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-muted rounded-lg text-sm">
                    <span className="font-bold text-primary flex-shrink-0">{i + 1}</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground mt-4 pb-8">
            Generated by NEMA AI Neuro Intake System · Not a diagnostic tool · For neurologist review only
          </div>
        </div>
      )}
    </div>
    </MainLayout>
  );
}
