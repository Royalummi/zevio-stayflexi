/**
 * SESSION 70: ADMIN BANNER MANAGEMENT
 * Create, edit, activate/deactivate, and delete promotional pop-banners
 */

import { useState, useEffect } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import {
  Megaphone,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Link2,
  ImageOff,
  ImagePlus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

// Brand color presets for quick selection
const COLOR_PRESETS = [
  { label: "Navy (default)", bg: "#1F3A5F", text: "#FFFFFF" },
  { label: "Teal", bg: "#2FA4A9", text: "#FFFFFF" },
  { label: "White", bg: "#FFFFFF", text: "#1F3A5F" },
  { label: "Dark Charcoal", bg: "#2D2D2D", text: "#FFFFFF" },
  { label: "Soft Gold", bg: "#D4A843", text: "#1F3A5F" },
];

const IMAGE_SIZE_PRESETS = [
  { value: "16:9", label: "Landscape 16:9 (wide)" },
  { value: "4:3", label: "Landscape 4:3 (standard)" },
  { value: "1:1", label: "Square 1:1" },
  { value: "3:4", label: "Portrait 3:4" },
  { value: "9:16", label: "Portrait 9:16 (tall)" },
];

const EMPTY_FORM = {
  title: "",
  description: "",
  button_text: "",
  button_link: "",
  inline_link_text: "",
  inline_link_url: "",
  property_id: "",
  image_url: "",
  image_aspect_ratio: "16:9",
  image_fit_mode: "contain",
  banner_size: "normal",
  background_color: "#1F3A5F",
  text_color: "#FFFFFF",
  banner_type: "popup",
  show_once: false,
  is_active: true,
  valid_from: "",
  valid_until: "",
};

const BannerManagement = () => {
  const { user } = useAuthStore();

  const toCssAspectRatio = (value) =>
    value?.includes(":") ? value.replace(":", " / ") : value || "16 / 9";

  // Data
  const [banners, setBanners] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState(null); // pending File object
  const [imagePreview, setImagePreview] = useState(""); // local object URL
  const [removeImage, setRemoveImage] = useState(false); // flag to delete existing image

  // ------------------------------------------------
  // DATA FETCHING
  // ------------------------------------------------
  const fetchBanners = async () => {
    if (user?.role !== "admin" && user?.role !== "super_admin") {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get("/admin/banners");
      setBanners(res.data.data.banners || []);
      setPermissionDenied(false);
    } catch (error) {
      if (error.response?.status === 403) {
        setPermissionDenied(true);
        toast.error("Access Denied: Admin permission required");
      } else {
        toast.error("Failed to load banners");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get("/admin/properties?limit=200&fields=id,title");
      setProperties(res.data.data?.properties || []);
    } catch {
      // non-critical, property picker is optional
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchBanners();
    fetchProperties();
  }, [user]);

  // ------------------------------------------------
  // FILTERING & PAGINATION
  // ------------------------------------------------
  const today = new Date();

  const filteredBanners = banners.filter((b) => {
    const isExpired = b.valid_until && new Date(b.valid_until) < today;
    const isScheduled = b.valid_from && new Date(b.valid_from) > today;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && b.is_active && !isExpired) ||
      (statusFilter === "inactive" && !b.is_active) ||
      (statusFilter === "expired" && isExpired) ||
      (statusFilter === "scheduled" && isScheduled);

    const matchesType = typeFilter === "all" || b.banner_type === typeFilter;

    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);
  const paginatedBanners = filteredBanners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getBannerStatus = (banner) => {
    if (banner.valid_until && new Date(banner.valid_until) < today)
      return { label: "Expired", variant: "destructive" };
    if (banner.valid_from && new Date(banner.valid_from) > today)
      return { label: "Scheduled", variant: "outline" };
    if (banner.is_active) return { label: "Active", variant: "default" };
    return { label: "Inactive", variant: "secondary" };
  };

  const getBannerTypeLabel = (type) => {
    return (
      { popup: "Popup", top_bar: "Top Bar", slide_in: "Slide-In" }[type] || type
    );
  };

  // ------------------------------------------------
  // DIALOG HANDLERS
  // ------------------------------------------------
  const handleCreate = () => {
    setEditingBanner(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setShowDialog(true);
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      description: banner.description || "",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      inline_link_text: banner.inline_link_text || "",
      inline_link_url: banner.inline_link_url || "",
      property_id: banner.property_id || "",
      image_url: banner.image_url || "",
      image_aspect_ratio: banner.image_aspect_ratio || "16:9",
      image_fit_mode: banner.image_fit_mode || "contain",
      banner_size: banner.banner_size || "normal",
      background_color: banner.background_color || "#1F3A5F",
      text_color: banner.text_color || "#FFFFFF",
      banner_type: banner.banner_type || "popup",
      show_once: !!banner.show_once,
      is_active: !!banner.is_active,
      valid_from: banner.valid_from
        ? new Date(banner.valid_from).toISOString().slice(0, 16)
        : "",
      valid_until: banner.valid_until
        ? new Date(banner.valid_until).toISOString().slice(0, 16)
        : "",
    });
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Banner title is required");
      return;
    }
    try {
      setActionLoading(true);
      const payload = {
        ...formData,
        property_id: formData.property_id || null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        button_text: formData.button_text || null,
        button_link: formData.button_link || null,
        inline_link_text: formData.inline_link_text || null,
        inline_link_url: formData.inline_link_url || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        image_aspect_ratio: formData.image_aspect_ratio || "16:9",
        image_fit_mode: "contain",
        banner_size: formData.banner_size || "normal",
      };

      let savedBannerId;
      if (editingBanner) {
        await api.patch(`/admin/banners/${editingBanner.id}`, payload);
        savedBannerId = editingBanner.id;
        toast.success("Banner updated successfully");
      } else {
        const res = await api.post("/admin/banners", payload);
        savedBannerId = res.data.data?.id;
        toast.success("Banner created successfully");
      }

      // Handle image upload/removal
      if (savedBannerId) {
        if (imageFile) {
          const imgForm = new FormData();
          imgForm.append("image", imageFile);
          await api.post(`/admin/banners/${savedBannerId}/image`, imgForm, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else if (removeImage) {
          await api.delete(`/admin/banners/${savedBannerId}/image`);
        }
      }

      setShowDialog(false);
      fetchBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save banner");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (banner) => {
    try {
      await api.patch(`/admin/banners/${banner.id}/toggle`);
      const next = !banner.is_active;
      toast.success(`Banner ${next ? "activated" : "deactivated"}`);
      fetchBanners();
    } catch {
      toast.error("Failed to update banner status");
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm("Delete this banner? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/banners/${bannerId}`);
      toast.success("Banner deleted");
      fetchBanners();
    } catch {
      toast.error("Failed to delete banner");
    }
  };

  // ------------------------------------------------
  // IMAGE HANDLERS
  // ------------------------------------------------
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
    setField("image_url", "");
    setRemoveImage(true);
  };

  // ------------------------------------------------
  // COLOR PRESET HELPER
  // ------------------------------------------------
  const applyColorPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      background_color: preset.bg,
      text_color: preset.text,
    }));
  };

  // ------------------------------------------------
  // FORM HELPER
  // ------------------------------------------------
  const setField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // ------------------------------------------------
  // STATS
  // ------------------------------------------------
  const activeBanners = banners.filter(
    (b) => b.is_active && !(b.valid_until && new Date(b.valid_until) < today),
  );
  const expiredBanners = banners.filter(
    (b) => b.valid_until && new Date(b.valid_until) < today,
  );
  const popupCount = banners.filter((b) => b.banner_type === "popup").length;
  const topBarCount = banners.filter((b) => b.banner_type === "top_bar").length;

  // ------------------------------------------------
  // PERMISSION GUARD
  // ------------------------------------------------
  if (permissionDenied) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500">
          You need admin permissions to manage banners.
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-blue-600" />
            Banner Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage promotional pop-banners displayed on the user site
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {activeBanners.length}
            </div>
            <div className="text-sm text-gray-500">Active Banners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-700">
              {banners.length}
            </div>
            <div className="text-sm text-gray-500">Total Banners</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{popupCount}</div>
            <div className="text-sm text-gray-500">Popups</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-500">
              {expiredBanners.length}
            </div>
            <div className="text-sm text-gray-500">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search banners..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
                <SelectItem value="top_bar">Top Bar</SelectItem>
                <SelectItem value="slide_in">Slide-In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Banners ({filteredBanners.length})</CardTitle>
          <CardDescription>
            Manage promotional banners shown to users on the site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : paginatedBanners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No banners found</p>
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                Create your first banner
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBanners.map((banner) => {
                  const status = getBannerStatus(banner);
                  return (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {/* Banner thumbnail or color swatch */}
                          {banner.image_url ? (
                            <img
                              src={banner.image_url}
                              alt={banner.title}
                              className="w-10 h-10 rounded object-cover flex-shrink-0 border border-gray-200"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded flex-shrink-0 border border-gray-200"
                              style={{
                                backgroundColor:
                                  banner.background_color || "#1F3A5F",
                              }}
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white line-clamp-1">
                              {banner.title}
                            </div>
                            {banner.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">
                                {banner.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getBannerTypeLabel(banner.banner_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {banner.valid_until
                          ? formatDate(banner.valid_until)
                          : "No expiry"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {banner.button_link && (
                            <span title="Has CTA button">
                              <ExternalLink className="h-3.5 w-3.5 text-blue-500" />
                            </span>
                          )}
                          {banner.inline_link_url && (
                            <span title="Has inline link">
                              <Link2 className="h-3.5 w-3.5 text-teal-500" />
                            </span>
                          )}
                          {banner.property_id && (
                            <span title="Linked to property">
                              <ImageOff className="h-3.5 w-3.5 text-purple-500" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(banner)}
                            title={banner.is_active ? "Deactivate" : "Activate"}
                          >
                            {banner.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(banner.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, filteredBanners.length)}{" "}
                of {filteredBanners.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Edit Banner" : "Create New Banner"}
            </DialogTitle>
            <DialogDescription>
              Configure a promotional banner to be displayed on the user site.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Banner Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. Summer Sale — 20% Off All Villas"
                value={formData.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            {/* Banner Image */}
            <div className="space-y-2">
              <Label>Banner Image (optional)</Label>
              {(imagePreview || formData.image_url) && !removeImage ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Banner preview"
                    className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center gap-1 text-gray-500">
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-sm font-medium">
                      Click to upload image
                    </span>
                    <span className="text-xs">PNG, JPG, WEBP up to 5MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
              )}
              <p className="text-xs text-gray-500">
                Displayed inside the banner. Supports PNG, JPG, WEBP.
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional supporting text shown below the title..."
                rows={2}
                value={formData.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            {/* CTA Button */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="button_text">Button Text</Label>
                <Input
                  id="button_text"
                  placeholder="e.g. Book Now"
                  value={formData.button_text}
                  onChange={(e) => setField("button_text", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_link">Button Link (URL)</Label>
                <Input
                  id="button_link"
                  placeholder="https://..."
                  value={formData.button_link}
                  onChange={(e) => setField("button_link", e.target.value)}
                />
              </div>
            </div>

            {/* Inline Link */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="inline_link_text">Inline Link Text</Label>
                <Input
                  id="inline_link_text"
                  placeholder="e.g. Learn more"
                  value={formData.inline_link_text}
                  onChange={(e) => setField("inline_link_text", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inline_link_url">Inline Link URL</Label>
                <Input
                  id="inline_link_url"
                  placeholder="https://..."
                  value={formData.inline_link_url}
                  onChange={(e) => setField("inline_link_url", e.target.value)}
                />
              </div>
            </div>

            {/* Property Link */}
            <div className="space-y-2">
              <Label htmlFor="property_id">
                Direct Property Link (optional)
              </Label>
              <Select
                value={formData.property_id || "__none__"}
                onValueChange={(v) =>
                  setField("property_id", v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger id="property_id">
                  <SelectValue placeholder="Select a property..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                When set, the CTA button will link directly to this
                property&apos;s page.
              </p>
            </div>

            {/* Banner Type */}
            <div className="space-y-2">
              <Label>Banner Type</Label>
              <Select
                value={formData.banner_type}
                onValueChange={(v) => setField("banner_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popup">
                    Popup — Centered modal overlay
                  </SelectItem>
                  <SelectItem value="top_bar">
                    Top Bar — Fixed strip at top of page
                  </SelectItem>
                  <SelectItem value="slide_in">
                    Slide-In — Card from bottom-right corner
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Size (popup / slide-in only) */}
            {formData.banner_type !== "top_bar" && (
              <div className="space-y-2">
                <Label>Display Size</Label>
                <div className="flex gap-2">
                  {[
                    { value: "normal", label: "Normal", desc: "~480px wide" },
                    { value: "large", label: "Large", desc: "80vw × 80vh" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField("banner_size", opt.value)}
                      className={`flex-1 py-2 px-3 rounded border text-sm font-medium transition-all ${
                        formData.banner_size === opt.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <div>{opt.label}</div>
                      <div className="text-xs opacity-60 font-normal">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Large fills 80% of the screen — ideal for full-image banners.
                </p>
              </div>
            )}

            {/* Image Size / Orientation */}
            <div className="space-y-2">
              <Label>Image Size & Orientation</Label>
              <Select
                value={formData.image_aspect_ratio || "16:9"}
                onValueChange={(v) => setField("image_aspect_ratio", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Image will fit fully inside this ratio (letterbox mode).
              </p>
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <Label>Appearance</Label>
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.bg}
                    type="button"
                    onClick={() => applyColorPreset(preset)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-all hover:shadow-sm"
                    style={{
                      backgroundColor: preset.bg,
                      color: preset.text,
                      borderColor:
                        formData.background_color === preset.bg
                          ? preset.text
                          : "transparent",
                      outline:
                        formData.background_color === preset.bg
                          ? "2px solid " + preset.text
                          : "none",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {/* Custom pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">
                    Background Color
                  </Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) =>
                        setField("background_color", e.target.value)
                      }
                      className="h-9 w-12 rounded cursor-pointer border border-gray-200"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) =>
                        setField("background_color", e.target.value)
                      }
                      className="font-mono text-xs"
                      maxLength={7}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) => setField("text_color", e.target.value)}
                      className="h-9 w-12 rounded cursor-pointer border border-gray-200"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) => setField("text_color", e.target.value)}
                      className="font-mono text-xs"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Live mini-preview */}
              {(imagePreview || formData.image_url) && !removeImage ? (
                /* Image present — overlay text/buttons on top of the image */
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{ color: formData.text_color }}
                >
                  <div
                    className="w-full bg-black/20"
                    style={{
                      aspectRatio: toCssAspectRatio(
                        formData.image_aspect_ratio,
                      ),
                    }}
                  >
                    <img
                      src={imagePreview || formData.image_url}
                      alt="Banner"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Dark gradient at bottom so text is always readable */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-sm font-semibold drop-shadow">
                      {formData.title || "Banner Title"}
                    </div>
                    {formData.description && (
                      <div className="text-xs mt-0.5 opacity-90 drop-shadow">
                        {formData.description}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {formData.button_text && formData.button_link && (
                        <span
                          className="text-xs px-3 py-1 rounded border font-medium backdrop-blur-sm"
                          style={{
                            borderColor: formData.text_color,
                            color: formData.text_color,
                            backgroundColor: "rgba(0,0,0,0.25)",
                          }}
                        >
                          {formData.button_text}
                        </span>
                      )}
                      {formData.inline_link_text &&
                        formData.inline_link_url && (
                          <span className="text-xs underline opacity-90 drop-shadow">
                            {formData.inline_link_text}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                /* No image — solid background with text */
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: formData.background_color,
                    color: formData.text_color,
                  }}
                >
                  <div className="text-sm font-semibold">
                    {formData.title || "Banner Title"}
                  </div>
                  {formData.description && (
                    <div className="text-xs mt-0.5 opacity-80">
                      {formData.description}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {formData.button_text && formData.button_link && (
                      <span
                        className="text-xs px-3 py-1 rounded border"
                        style={{
                          borderColor: formData.text_color,
                          color: formData.text_color,
                        }}
                      >
                        {formData.button_text}
                      </span>
                    )}
                    {formData.inline_link_text && formData.inline_link_url && (
                      <span className="text-xs underline opacity-80">
                        {formData.inline_link_text}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Show from (optional)</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setField("valid_from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Expire on (optional)</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setField("valid_until", e.target.value)}
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Once</Label>
                  <p className="text-xs text-gray-500">
                    Remember dismissed banners in browser via localStorage
                  </p>
                </div>
                <Switch
                  checked={formData.show_once}
                  onCheckedChange={(v) => setField("show_once", v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-gray-500">
                    Display this banner to users immediately
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setField("is_active", v)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={actionLoading}>
              {actionLoading
                ? editingBanner
                  ? "Saving..."
                  : "Creating..."
                : editingBanner
                  ? "Save Changes"
                  : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BannerManagement;
