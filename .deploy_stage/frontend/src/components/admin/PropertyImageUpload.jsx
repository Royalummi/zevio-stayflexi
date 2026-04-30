import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import api from "../../lib/api";
import { toast } from "sonner";

const PropertyImageUpload = ({
  propertyId,
  onImagesChange,
  allowPreUpload = false,
  apiBasePath = "/admin/properties",
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const MAX_IMAGES = 40;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  // Track which propertyId we've already fetched to avoid duplicate calls
  // (React strict mode unmounts/remounts in dev, causing double fetches).
  const fetchedForRef = useRef(null);

  // Fetch existing images
  useEffect(() => {
    if (propertyId) {
      if (typeof propertyId !== "string") {
        console.error(
          "❌ PropertyImageUpload received non-string propertyId:",
          propertyId,
        );
        setLoading(false);
        return;
      }
      // Skip if we already fetched for this exact propertyId
      if (fetchedForRef.current === propertyId) return;
      fetchedForRef.current = propertyId;
      fetchImages();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const fetchImages = async () => {
    try {
      const response = await api.get(`${apiBasePath}/${propertyId}/images`);
      // Filter out images with undefined/null image_url to prevent rendering errors
      const validImages = (response.data.data || []).filter(
        (img) => img && img.image_url,
      );
      setUploadedImages(validImages);
    } catch (error) {
      // Silently handle 401 errors - token refresh will handle it
      if (error.response?.status !== 401) {
        console.error("Error fetching images:", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`${file.name} is not a supported image format`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`${file.name} exceeds 5MB size limit`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    // Reset input so the same files can be re-selected if removed
    e.target.value = "";
  };

  const addFiles = useCallback(
    (files) => {
      setSelectedFiles((prev) => {
        const slotsAvailable = MAX_IMAGES - uploadedImages.length - prev.length;

        if (slotsAvailable <= 0) {
          toast.error(
            `Maximum ${MAX_IMAGES} images allowed. Remove some images to upload new ones.`,
          );
          return prev;
        }

        const validFiles = files.filter(validateFile);
        if (validFiles.length === 0) return prev;

        // Accept as many files as will fit instead of rejecting the entire batch
        const filesToAdd = validFiles.slice(0, slotsAvailable);
        if (filesToAdd.length < validFiles.length) {
          toast.warning(
            `Only ${filesToAdd.length} of ${validFiles.length} images added. Maximum ${MAX_IMAGES} images allowed.`,
          );
        }

        const filesWithPreview = filesToAdd.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9),
        }));
        return [...prev, ...filesWithPreview];
      });
    },
    [uploadedImages.length],
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        addFiles(files);
      }
    },
    [addFiles],
  );

  const removeSelectedFile = (id) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Expose upload function via callback when images are ready
  useEffect(() => {
    if (onImagesChange) {
      // Always notify parent of current state — including when files are cleared
      onImagesChange({
        selectedFiles,
        uploadedImages,
        uploadPending: handleUpload,
        hasPendingUploads: selectedFiles.length > 0,
      });
    }
  }, [selectedFiles, uploadedImages]);

  const handleUpload = async (overridePropertyId = null) => {
    const targetPropertyId = overridePropertyId || propertyId;

    // Validate propertyId is a string
    if (targetPropertyId && typeof targetPropertyId !== "string") {
      console.error(
        "❌ Invalid propertyId type:",
        typeof targetPropertyId,
        targetPropertyId,
      );
      toast.error("Invalid property ID format");
      return { success: false, error: "Invalid property ID" };
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select images to upload");
      return;
    }

    if (!targetPropertyId) {
      if (allowPreUpload) {
        // Just keep images selected, they'll be uploaded after property is saved
        toast.info(
          "Images selected. They'll be uploaded after you save the property.",
        );
        return { success: true, pending: true };
      } else {
        toast.error("Please save the property first before uploading images");
        return { success: false };
      }
    }

    const formData = new FormData();
    selectedFiles.forEach((fileObj) => {
      formData.append("images", fileObj.file);
    });

    try {
      setUploading(true);
      setUploadProgress(0);

      console.log("📤 Uploading images to property:", targetPropertyId);
      const response = await api.post(
        `${apiBasePath}/${targetPropertyId}/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(progress);
          },
        },
      );

      console.log("✅ Upload successful, response:", response.data);
      toast.success("Images uploaded successfully!");

      // Clear selected files and their previews
      selectedFiles.forEach((fileObj) => {
        URL.revokeObjectURL(fileObj.preview);
      });
      setSelectedFiles([]);
      setUploadProgress(0);

      // Refresh uploaded images (reset guard so fetchImages runs again)
      fetchedForRef.current = null;
      await fetchImages();

      if (onImagesChange) {
        onImagesChange({
          uploadedImages: response.data.data,
          hasPendingUploads: false,
        });
      }

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("❌ Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload images");
      return { success: false, error };
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      await api.delete(`${apiBasePath}/${propertyId}/images/${imageId}`);
      toast.success("Image deleted successfully");
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));

      if (onImagesChange) {
        onImagesChange(uploadedImages.filter((img) => img.id !== imageId));
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    }
  };

  const canUploadMore =
    uploadedImages.length + selectedFiles.length < MAX_IMAGES;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area — hidden when max images reached */}
      {canUploadMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="image-upload"
            className="hidden"
            multiple
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileSelect}
            disabled={uploading || !canUploadMore}
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500 mt-1">
                JPG, PNG, GIF, WEBP (max 5MB per image)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {uploadedImages.length + selectedFiles.length} / {MAX_IMAGES}{" "}
                images
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Selected Files Preview — always visible when files are selected */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              Selected Images ({selectedFiles.length})
            </h3>
            <Button
              type="button"
              onClick={() => handleUpload()}
              disabled={uploading}
              size="sm"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : propertyId ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} Image
                  {selectedFiles.length > 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Ready
                </>
              )}
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((fileObj) => (
              <div
                key={fileObj.id}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
              >
                <img
                  src={fileObj.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Failed to load preview:", fileObj);
                    e.target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeSelectedFile(fileObj.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                  {fileObj.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Uploaded Images ({uploadedImages.length})
            </h3>
            {uploadedImages.length >= MAX_IMAGES && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Maximum images reached
              </p>
            )}
          </div>
          {/* R2 CORS Propagation Notice */}
          {uploadedImages.some((img) => img.image_url?.includes("r2.dev")) && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
              💡 Images stored on Cloudflare R2 CDN. If images show
              "Loading...", wait 1-2 minutes for CORS propagation, then clear
              browser cache (Ctrl+Shift+Delete) and refresh.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {uploadedImages.map((image, index) =>
              image && image.image_url ? (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border-2 border-green-200"
                >
                  <img
                    src={
                      image.image_url.startsWith("http://") ||
                      image.image_url.startsWith("https://")
                        ? image.image_url
                        : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${image.image_url}`
                    }
                    alt={`Property ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Silently handle image load errors with fallback
                      // CORS errors are expected during R2 propagation (takes 1-5 minutes)
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3ELoading...%3C/text%3E%3Ctext x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12" fill="%23ccc"%3ECORS propagating%3C/text%3E%3C/svg%3E';
                      // Set error flag to prevent repeated logs
                      e.target.dataset.errorHandled = "true";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                    Image {index + 1}
                  </div>
                  {image.is_primary && (
                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                      Primary
                    </div>
                  )}
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {uploadedImages.length === 0 && selectedFiles.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default PropertyImageUpload;
