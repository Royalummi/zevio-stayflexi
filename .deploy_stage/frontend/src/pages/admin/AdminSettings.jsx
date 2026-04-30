import { useState, useEffect } from "react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../components/admin/AdminPropertyFormQuill.css";
import { Mail, Save, FileText, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Switch } from "../../components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import api from "../../lib/api";

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "link",
];

const AdminSettings = () => {
  // --- Notification settings state ---
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settings, setSettings] = useState({
    email_notifications: true,
    email_promotions: false,
    email_reminders: true,
  });

  // --- Vendor T&C state ---
  const [tcContent, setTcContent] = useState("");
  const [tcVersion, setTcVersion] = useState(null);
  const [tcUpdatedAt, setTcUpdatedAt] = useState(null);
  const [tcLoading, setTcLoading] = useState(true);
  const [tcSaving, setTcSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchTerms();
  }, []);

  // --- Notification methods ---
  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await api.get("/auth/settings");
      if (response.data.success) {
        const d = response.data.data;
        setSettings({
          email_notifications: d.email_notifications,
          email_promotions: d.email_promotions,
          email_reminders: d.email_reminders,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsSaving(true);
      const response = await api.put("/auth/settings", settings);
      if (response.data.success) {
        toast.success("Notification settings saved");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Vendor T&C methods ---
  const fetchTerms = async () => {
    try {
      setTcLoading(true);
      const response = await api.get("/admin/vendor-terms");
      if (response.data.success) {
        const data = response.data.data;
        setTcContent(data.content || "");
        setTcVersion(data.version);
        setTcUpdatedAt(data.updated_at);
      }
    } catch (error) {
      console.error("Error fetching vendor terms:", error);
      toast.error("Failed to load Terms & Conditions");
    } finally {
      setTcLoading(false);
    }
  };

  const handleSaveTerms = async () => {
    if (!tcContent || !tcContent.trim() || tcContent === "<p><br></p>") {
      toast.error("Content cannot be empty");
      return;
    }
    try {
      setTcSaving(true);
      const response = await api.put("/admin/vendor-terms", {
        content: tcContent,
      });
      if (response.data.success) {
        setTcVersion(
          response.data.data?.version || (tcVersion ? tcVersion + 1 : 1),
        );
        toast.success("Terms & Conditions updated successfully!");
        fetchTerms();
      } else {
        toast.error(response.data.message || "Failed to update");
      }
    } catch (error) {
      console.error("Error saving vendor terms:", error);
      toast.error("Failed to save Terms & Conditions");
    } finally {
      setTcSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage notifications and platform configuration
        </p>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Mail className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="vendor-tc" className="gap-2">
            <FileText className="h-4 w-4" />
            Vendor T&C
          </TabsTrigger>
        </TabsList>

        {/* ────── Notifications Tab ────── */}
        <TabsContent value="notifications" className="mt-6">
          {settingsLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <Card className="max-w-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    Email Notifications
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Control which emails you receive from the platform
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {settingsSaving ? "Saving..." : "Save"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      General Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Booking updates, user activity, system alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={() => toggleSetting("email_notifications")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Promotional Emails
                    </Label>
                    <p className="text-xs text-gray-500">
                      Platform promotions and marketing updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_promotions}
                    onCheckedChange={() => toggleSetting("email_promotions")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Reminders</Label>
                    <p className="text-xs text-gray-500">
                      Task reminders and scheduled notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_reminders}
                    onCheckedChange={() => toggleSetting("email_reminders")}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────── Vendor T&C Tab ────── */}
        <TabsContent value="vendor-tc" className="mt-6">
          <div className="max-w-5xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Vendor Terms &amp; Conditions
                  </h2>
                  <p className="text-sm text-gray-500">
                    Edit the T&amp;C that vendors must accept before submitting
                    a property.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSaveTerms}
                disabled={tcSaving || tcLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {tcSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {tcVersion && (
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Version {tcVersion}
                </span>
                {tcUpdatedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Last updated:{" "}
                    {new Date(tcUpdatedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
            )}

            <Card>
              <CardContent className="p-6">
                {tcLoading ? (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <ReactQuill
                    value={tcContent}
                    onChange={setTcContent}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter the vendor Terms and Conditions here..."
                    style={{ minHeight: "400px" }}
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
              <FileText className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                These terms are shown to vendors as a modal before they click{" "}
                <strong>Submit for Approval</strong>. Vendors must check &quot;I
                agree&quot; before the submission proceeds.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
