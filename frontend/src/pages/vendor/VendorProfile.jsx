import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  Briefcase,
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
    ifsc_code: "",
    branch_name: "",
  });

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
          pan_number: u.pan_number || "",
        });
        // Load bank details from vendor record
        if (u.bank_details) {
          const bd =
            typeof u.bank_details === "object"
              ? u.bank_details
              : JSON.parse(u.bank_details);
          setBankData({
            bank_name: bd.bank_name || "",
            account_holder_name: bd.account_holder_name || "",
            account_number: bd.account_number || "",
            ifsc_code: bd.ifsc_code || "",
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
          pan_number: user.pan_number || "",
        });
      }
      toast.error("Failed to load profile");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!profileData.full_name || !profileData.email) {
        toast.error("Name and email are required");
        return;
      }

      const response = await api.put("/auth/profile", {
        name: profileData.full_name,
        full_name: profileData.full_name,
        phone: profileData.phone,
        company_name: profileData.company_name,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        gst_number: profileData.gst_number,
        pan_number: profileData.pan_number,
      });

      if (response.data.success) {
        updateUser({
          ...user,
          full_name: profileData.full_name,
          name: profileData.full_name,
          phone: profileData.phone,
        });
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

      if (passwordData.new_password.length < 6) {
        toast.error("New password must be at least 6 characters");
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

  const handleBankDetailsUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (
        !bankData.account_number ||
        !bankData.ifsc_code ||
        !bankData.account_holder_name
      ) {
        toast.error("Please fill all required bank details");
        return;
      }

      await api.put("/vendor/bank-details", bankData);

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
            <div className="bg-blue-100 p-4 rounded-full">
              <User className="h-8 w-8 text-blue-600" />
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
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter email address"
                      required
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact admin to update.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
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
                </div>

                <Separator />

                <div className="space-y-4">
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
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankDetailsUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={bankData.bank_name}
                      onChange={(e) =>
                        setBankData({ ...bankData, bank_name: e.target.value })
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

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Saving..." : "Update Bank Details"}
                  </Button>
                </div>
              </form>
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
                    Minimum 6 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
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
