import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, Save } from "lucide-react";
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
import api from "../../lib/api";

const VendorSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    email_notifications: true,
    email_promotions: false,
    email_reminders: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put("/auth/settings", settings);
      if (response.data.success) {
        toast.success("Settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your notification preferences
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Control which emails you receive from the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">
                Booking Notifications
              </Label>
              <p className="text-xs text-gray-500">
                New bookings, cancellations, and booking updates
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
              <Label className="text-sm font-medium">Promotional Emails</Label>
              <p className="text-xs text-gray-500">
                Tips, promotions, and marketing from Zevio
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
                Check-in/check-out reminders and upcoming bookings
              </p>
            </div>
            <Switch
              checked={settings.email_reminders}
              onCheckedChange={() => toggleSetting("email_reminders")}
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSettings;
