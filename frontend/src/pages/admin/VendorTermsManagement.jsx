import { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../components/admin/AdminPropertyFormQuill.css";
import api from "../../lib/api";
import { toast } from "sonner";
import { FileText, Save, Clock } from "lucide-react";

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

export default function VendorTermsManagement() {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/vendor-terms");
      if (response.data.success) {
        const data = response.data.data;
        setContent(data.content || "");
        setVersion(data.version);
        setUpdatedAt(data.updated_at);
      }
    } catch (error) {
      console.error("Error fetching vendor terms:", error);
      toast.error("Failed to load Terms & Conditions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content || !content.trim() || content === "<p><br></p>") {
      toast.error("Content cannot be empty");
      return;
    }
    try {
      setSaving(true);
      const response = await api.put("/admin/vendor-terms", { content });
      if (response.data.success) {
        setVersion(response.data.data?.version || (version ? version + 1 : 1));
        toast.success("Terms & Conditions updated successfully!");
        fetchTerms();
      } else {
        toast.error(response.data.message || "Failed to update");
      }
    } catch (error) {
      console.error("Error saving vendor terms:", error);
      toast.error("Failed to save Terms & Conditions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Vendor Terms &amp; Conditions
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Edit the T&amp;C that vendors must accept before submitting a
              property for approval.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Meta info */}
      {version && (
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            Version {version}
          </span>
          {updatedAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Last updated:{" "}
              {new Date(updatedAt).toLocaleDateString("en-IN", {
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

      {/* Editor */}
      <div className="bg-card border border-border rounded-lg p-6">
        <label className="text-sm font-medium text-foreground mb-3 block">
          Terms &amp; Conditions Content
        </label>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <ReactQuill
            value={content}
            onChange={setContent}
            modules={quillModules}
            formats={quillFormats}
            placeholder="Enter the vendor Terms and Conditions here..."
            style={{ minHeight: "400px" }}
          />
        )}
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
        <FileText className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          These terms are shown to vendors as a modal before they click{" "}
          <strong>Submit for Approval</strong>. Vendors must check &quot;I
          agree&quot; before the submission proceeds.
        </p>
      </div>
    </div>
  );
}
