import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  User,
  Camera,
  Loader2,
  Phone,
  MapPin,
  Building2,
  Save,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Briefcase,
  Pencil,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import api from "../../lib/api";
import { useAuthStore } from "../../store/authStore";
import { formatDate } from "../../lib/utils";

const VendorProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Edit-mode toggles (read-only by default)
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBank, setEditingBank] = useState(false);

  // Profile form
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gst_number: "",
    is_gst_registered: false,
    pan_number: "",
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Bank details form
  const [bankData, setBankData] = useState({
    bank_name: "",
    account_holder_name: "",
    account_number: "",
    confirm_account_number: "",
    ifsc_code: "",
    branch_name: "",
  });

  // Snapshots for cancel (restore on cancel)
  const [profileSnapshot, setProfileSnapshot] = useState(null);
  const [bankSnapshot, setBankSnapshot] = useState(null);

  const currentAvatar = avatarPreview || user?.avatar || null;

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      if (response.data.success) {
        const u = response.data.data;
        setProfileData({
          full_name: u.full_name || u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          company_name: u.company_name || "",
          address: u.address || "",
          city: u.city || "",
          state: u.state || "",
          pincode: u.pincode || "",
          gst_number: u.gst_number || "",
          is_gst_registered: !!u.is_gst_registered,
          pan_number: u.pan_number || "",
        });
        if (u.bank_details) {
          const bd =
            typeof u.bank_details === "object"
              ? u.bank_details
              : JSON.parse(u.bank_details);
          setBankData({
            bank_name: bd.bank_name || "",
            account_holder_name:
              bd.account_holder_name || bd.account_holder || "",
            account_number: bd.account_number || "",
            confirm_account_number: bd.account_number || "",
            ifsc_code: bd.ifsc_code || bd.ifsc || "",
            branch_name: bd.branch_name || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Fallback to auth store data
      if (user) {
        setProfileData({
          full_name: user.full_name || user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          company_name: user.company_name || "",
          address: user.address || "",
          city: user.city || "",
          state: user.state || "",
          pincode: user.pincode || "",
          gst_number: user.gst_number || "",
          is_gst_registered: !!user.is_gst_registered,
          pan_number: user.pan_number || "",
        });
      }
      toast.error("Failed to load profile");
    }
  };

  const handleEditProfile = () => {
    setProfileSnapshot({ ...profileData });
    setEditingProfile(true);
  };

  const handleCancelProfile = () => {
    if (profileSnapshot) setProfileData(profileSnapshot);
    setEditingProfile(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!profileData.full_name) {
        toast.error("Name is required");
        return;
      }

      const response = await api.put("/auth/profile", {
        name: profileData.full_name,
        phone: profileData.phone,
        company_name: profileData.company_name,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        gst_number: profileData.gst_number,
        is_gst_registered: profileData.is_gst_registered ? 1 : 0,
        pan_number: profileData.pan_number,
      });

      if (response.data.success) {
        updateUser({
          ...user,
          name: profileData.full_name,
          phone: profileData.phone,
        });
        setEditingProfile(false);
        setProfileSnapshot(null);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setPasswordLoading(true);

      // Validate passwords
      if (
        !passwordData.current_password ||
        !passwordData.new_password ||
        !passwordData.confirm_password
      ) {
        toast.error("All password fields are required");
        return;
      }

      if (passwordData.new_password !== passwordData.confirm_password) {
        toast.error("New passwords do not match");
        return;
      }

      if (passwordData.new_password.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }

      await api.put("/auth/change-password", {
        currentPassword: passwordData.current_password,
        newPassword: passwordData.new_password,
      });

      toast.success("Password changed successfully");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEditBank = () => {
    setBankSnapshot({ ...bankData });
    setEditingBank(true);
  };

  const handleCancelBank = () => {
    if (bankSnapshot) setBankData(bankSnapshot);
    setEditingBank(false);
  };

  const handleBankDetailsUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (
        !bankData.account_number ||
        !bankData.ifsc_code ||
        !bankData.account_holder_name
      ) {
        toast.error("Please fill all required bank details");
        return;
      }

      if (bankData.account_number !== bankData.confirm_account_number) {
        toast.error("Account numbers do not match");
        return;
      }

      const { confirm_account_number, ...payload } = bankData;
      await api.put("/vendor/bank-details", payload);

      setEditingBank(false);
      setBankSnapshot(null);
      toast.success("Bank details updated successfully");
    } catch (error) {
      console.error("Error updating bank details:", error);
      toast.error(
        error.response?.data?.message || "Failed to update bank details",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (!avatarUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await api.post("/auth/upload-avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedUser = response?.data?.data?.user;
      if (response?.data?.success && updatedUser) {
        updateUser({ ...user, ...updatedUser });
        setAvatarPreview(null);
        toast.success("Profile image updated successfully");
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      setAvatarPreview(null);
      toast.error(
        error.response?.data?.message || "Failed to upload profile image",
      );
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(previewUrl);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Profile & Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Account Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-blue-200 bg-blue-100 flex items-center justify-center">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Vendor avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={avatarUploading}
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
                title="Upload profile image"
              >
                {avatarUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.full_name || user?.name || "Vendor"}
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-blue-100 text-blue-800">
                  Vendor Account
                </Badge>
                {user?.created_at && (
                  <Badge variant="outline" className="text-gray-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    Joined {formatDate(user.created_at)}
                  </Badge>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </span>
                {!editingProfile && (
                  <button
                    type="button"
                    onClick={handleEditProfile}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit profile"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!editingProfile ? (
                /* ── READ-ONLY VIEW ── */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.full_name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.phone || "—"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">
                        Email Address
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.email || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Email cannot be changed. Contact admin to update.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Business Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.company_name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">GST Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.gst_number || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">PAN Number</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.pan_number || "—"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Street Address
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.address || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">City</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.city || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">State</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.state || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Pincode</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profileData.pincode || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── EDIT FORM ── */
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            full_name: e.target.value,
                          })
                        }
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed. Contact admin to update.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Business Information
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={profileData.company_name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            company_name: e.target.value,
                          })
                        }
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gst_number">GST Number</Label>
                      <Input
                        id="gst_number"
                        value={profileData.gst_number}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            gst_number: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Enter GST number"
                      />
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                      <input
                        type="checkbox"
                        id="is_gst_registered"
                        checked={profileData.is_gst_registered}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            is_gst_registered: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <Label
                        htmlFor="is_gst_registered"
                        className="mb-0 cursor-pointer"
                      >
                        I am a GST registered property owner
                      </Label>
                    </div>

                    <div>
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        id="pan_number"
                        value={profileData.pan_number}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            pan_number: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Enter PAN number"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <Separator />

                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Details
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        value={profileData.address}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profileData.city}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              city: e.target.value,
                            })
                          }
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={profileData.state}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              state: e.target.value,
                            })
                          }
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={profileData.pincode}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              pincode: e.target.value,
                            })
                          }
                          placeholder="Pincode"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelProfile}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Bank Details
                </span>
                {!editingBank && (
                  <button
                    type="button"
                    onClick={handleEditBank}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit bank details"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!editingBank ? (
                /* ── READ-ONLY VIEW ── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bankData.bank_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Account Holder Name
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bankData.account_holder_name || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bankData.account_number
                        ? "••••" + bankData.account_number.slice(-4)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bankData.ifsc_code || "—"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Branch Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bankData.branch_name || "—"}
                    </p>
                  </div>
                </div>
              ) : (
                /* ── EDIT FORM ── */
                <form onSubmit={handleBankDetailsUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={bankData.bank_name}
                        onChange={(e) =>
                          setBankData({
                            ...bankData,
                            bank_name: e.target.value,
                          })
                        }
                        placeholder="Enter bank name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="account_holder_name">
                        Account Holder Name *
                      </Label>
                      <Input
                        id="account_holder_name"
                        value={bankData.account_holder_name}
                        onChange={(e) =>
                          setBankData({
                            ...bankData,
                            account_holder_name: e.target.value,
                          })
                        }
                        placeholder="Enter account holder name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="account_number">Account Number *</Label>
                      <Input
                        id="account_number"
                        value={bankData.account_number}
                        onChange={(e) =>
                          setBankData({
                            ...bankData,
                            account_number: e.target.value,
                          })
                        }
                        placeholder="Enter account number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm_account_number">
                        Confirm Account Number *
                      </Label>
                      <Input
                        id="confirm_account_number"
                        value={bankData.confirm_account_number}
                        onChange={(e) =>
                          setBankData({
                            ...bankData,
                            confirm_account_number: e.target.value,
                          })
                        }
                        placeholder="Re-enter account number"
                      />
                      {bankData.confirm_account_number &&
                        bankData.account_number !==
                          bankData.confirm_account_number && (
                          <p className="text-xs text-red-500 mt-1">
                            Account numbers do not match
                          </p>
                        )}
                    </div>

                    <div>
                      <Label htmlFor="ifsc_code">IFSC Code *</Label>
                      <Input
                        id="ifsc_code"
                        value={bankData.ifsc_code}
                        onChange={(e) =>
                          setBankData({
                            ...bankData,
                            ifsc_code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Enter IFSC code"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="branch_name">Branch Name</Label>
                      <Input
                        id="branch_name"
                        value={bankData.branch_name}
                        onChange={(e) =>
                          setBankData({
                            ...bankData,
                            branch_name: e.target.value,
                          })
                        }
                        placeholder="Enter branch name"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelBank}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Saving..." : "Update Bank Details"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Security */}
        <div className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          current_password: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={passwordLoading}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {passwordLoading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card className="bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-sm">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Account Status</p>
                <Badge className="bg-green-100 text-green-800 mt-1">
                  Active
                </Badge>
              </div>
              {user?.created_at && (
                <div>
                  <p className="text-gray-500">Member Since</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Account Type</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  Vendor Account
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
