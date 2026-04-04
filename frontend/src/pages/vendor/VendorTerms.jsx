import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import api from "../../lib/api";

const VendorTerms = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const response = await api.get("/public/vendor-terms");
      if (response.data.success) {
        setContent(response.data.data?.content || "");
      }
    } catch (error) {
      console.error("Error fetching vendor terms:", error);
      toast.error("Failed to load Terms & Conditions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Terms & Conditions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Review Zevio's vendor terms and conditions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Vendor Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No terms & conditions have been published yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorTerms;
