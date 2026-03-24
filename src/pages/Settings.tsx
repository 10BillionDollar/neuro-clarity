import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Link,
  Download,
  Shield,
  Users,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    doctorName: "Dr. Sharma",
    email: "sharma@hospital.com",
    specialty: "Neurology",
    hospitalName: "City Neuro Hospital",
    emrApiKey: "sk-xxxx-xxxx-xxxx",
    emrEndpoint: "https://emr.hospital.com/api",
    autoExportPdf: true,
    includeGraphsInExport: true,
    exportFormat: "pdf",
    consentTemplate: "Standard informed consent template for EEG screening...",
    dataRetentionDays: "365",
    anonymizeExports: false,
    adminAccess: true,
    viewerAccess: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account, integrations, and preferences</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="integration" className="gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Integration</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Doctor Information</h2>
                <p className="text-sm text-muted-foreground">Update your professional details</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Full Name</Label>
                  <Input
                    id="doctorName"
                    value={settings.doctorName}
                    onChange={(e) => setSettings({ ...settings, doctorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty</Label>
                  <Select value={settings.specialty} onValueChange={(v) => setSettings({ ...settings, specialty: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Neurology">Neurology</SelectItem>
                      <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                      <SelectItem value="Geriatrics">Geriatrics</SelectItem>
                      <SelectItem value="General Medicine">General Medicine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospital">Hospital/Clinic Name</Label>
                  <Input
                    id="hospital"
                    value={settings.hospitalName}
                    onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">EMR Integration</h2>
                <p className="text-sm text-muted-foreground">Connect to your Electronic Medical Records system</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emrEndpoint">EMR API Endpoint</Label>
                  <Input
                    id="emrEndpoint"
                    value={settings.emrEndpoint}
                    onChange={(e) => setSettings({ ...settings, emrEndpoint: e.target.value })}
                    placeholder="https://your-emr.com/api"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.emrApiKey}
                      onChange={(e) => setSettings({ ...settings, emrApiKey: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-medium text-foreground">Connection Status</p>
                  <p className="text-sm text-muted-foreground">Last synced: Never</p>
                </div>
                <Button variant="outline">Test Connection</Button>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Integration
              </Button>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Data Export Controls</h2>
                <p className="text-sm text-muted-foreground">Configure report export preferences</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto-export to EMR</p>
                    <p className="text-sm text-muted-foreground">Automatically send reports to connected EMR</p>
                  </div>
                  <Switch
                    checked={settings.autoExportPdf}
                    onCheckedChange={(v) => setSettings({ ...settings, autoExportPdf: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Include graphs in exports</p>
                    <p className="text-sm text-muted-foreground">Add trend charts to PDF reports</p>
                  </div>
                  <Switch
                    checked={settings.includeGraphsInExport}
                    onCheckedChange={(v) => setSettings({ ...settings, includeGraphsInExport: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Export Format</Label>
                  <Select value={settings.exportFormat} onValueChange={(v) => setSettings({ ...settings, exportFormat: v })}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="hl7">HL7 FHIR</SelectItem>
                      <SelectItem value="csv">CSV (Data Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Consent & Privacy</h2>
                <p className="text-sm text-muted-foreground">Manage consent templates and data policies</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="consent">Default Consent Template</Label>
                  <Textarea
                    id="consent"
                    value={settings.consentTemplate}
                    onChange={(e) => setSettings({ ...settings, consentTemplate: e.target.value })}
                    rows={4}
                    placeholder="Enter your default patient consent text..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select value={settings.dataRetentionDays} onValueChange={(v) => setSettings({ ...settings, dataRetentionDays: v })}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Anonymize external exports</p>
                    <p className="text-sm text-muted-foreground">Remove patient identifiers when sharing data</p>
                  </div>
                  <Switch
                    checked={settings.anonymizeExports}
                    onCheckedChange={(v) => setSettings({ ...settings, anonymizeExports: v })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Privacy Settings
              </Button>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Role-Based Access</h2>
                <p className="text-sm text-muted-foreground">Manage user permissions and access levels</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Administrator</p>
                      <p className="text-sm text-muted-foreground">Full access to all features and settings</p>
                    </div>
                    <Switch checked={settings.adminAccess} onCheckedChange={(v) => setSettings({ ...settings, adminAccess: v })} />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Clinician</p>
                      <p className="text-sm text-muted-foreground">Can upload EEGs, view reports, and export data</p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Viewer Only</p>
                      <p className="text-sm text-muted-foreground">Can only view existing reports</p>
                    </div>
                    <Switch checked={settings.viewerAccess} onCheckedChange={(v) => setSettings({ ...settings, viewerAccess: v })} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline">Manage Team Members</Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Roles
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
