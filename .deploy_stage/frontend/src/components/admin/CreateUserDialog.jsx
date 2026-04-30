import { useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2, Copy, CheckCircle2, UserPlus, Store } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

const CreateUserDialog = ({ open, onOpenChange, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "customer",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/admin/users", formData);

      setCreatedUser(response.data.data);
      toast.success(response.data.message || "User created successfully");

      // Don't close dialog yet - show temp password
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  // Copy temp password to clipboard
  const handleCopyPassword = async () => {
    if (createdUser?.tempPassword) {
      try {
        await navigator.clipboard.writeText(createdUser.tempPassword);
        setCopiedPassword(true);
        toast.success("Password copied to clipboard");
        setTimeout(() => setCopiedPassword(false), 2000);
      } catch (error) {
        toast.error("Failed to copy password");
      }
    }
  };

  // Handle close
  const handleClose = () => {
    if (createdUser) {
      // User was created, refresh list
      onSuccess?.();
    }

    // Reset form
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      role: "customer",
    });
    setErrors({});
    setCreatedUser(null);
    setCopiedPassword(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create New User Account
          </DialogTitle>
          <DialogDescription>
            {createdUser
              ? "User account created successfully. Share these credentials with the user."
              : "Create a customer or vendor account. A welcome email with temporary password will be sent automatically."}
          </DialogDescription>
        </DialogHeader>

        {createdUser ? (
          // Success state - show credentials
          <div className="space-y-4 py-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Account created successfully!</strong> Welcome email
                sent to {createdUser.email}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Full Name
                  </Label>
                  <p className="text-sm font-medium">{createdUser.full_name}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium">{createdUser.email}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <p className="text-sm font-medium capitalize">
                    {createdUser.role}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">
                    Temporary Password
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-base font-mono font-bold bg-white border rounded px-3 py-2 text-purple-600">
                      {createdUser.tempPassword}
                    </code>
                    <Button
                      onClick={handleCopyPassword}
                      size="sm"
                      variant={copiedPassword ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {copiedPassword ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ User must change this password on first login
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* User Type */}
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-1">
                User Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange("role", value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      <span>Customer</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="vendor">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>Vendor</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="Enter full name"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className={errors.full_name ? "border-red-500" : ""}
              />
              {errors.full_name && (
                <p className="text-xs text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit phone number"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                maxLength={10}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                📧 A welcome email with temporary password will be sent to the
                user. They must change the password on first login.
              </AlertDescription>
            </Alert>
          </form>
        )}

        <DialogFooter>
          {createdUser ? (
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
