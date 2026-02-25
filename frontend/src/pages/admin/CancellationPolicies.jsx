/**
 * SESSION 70: ADMIN CANCELLATION POLICIES
 * CRUD for cancellation policy templates.
 * One policy can be "active" per property type (Villa / Service Apartment).
 */

import { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { toast } from "sonner";
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
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
  X,
  GripVertical,
} from "lucide-react";

const PROPERTY_TYPES = [
  { id: "pt-001", label: "Villa" },
  { id: "pt-002", label: "Service Apartment" },
];

const blankTier = () => ({
  label: "",
  days_before_checkin: "",
  refund_percent: "",
});
const blankForm = () => ({
  policy_name: "",
  property_type_id: "pt-001",
  description: "",
  is_active: false,
  tiers: [
    { label: "Full Refund", days_before_checkin: 30, refund_percent: 100 },
    { label: "Partial Refund", days_before_checkin: 7, refund_percent: 50 },
    { label: "No Refund", days_before_checkin: 0, refund_percent: 0 },
  ],
});

export default function CancellationPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // all | pt-001 | pt-002

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [formErrors, setFormErrors] = useState({});

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Fetch all policies ──
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/cancellation-policies");
      if (res.data.success) {
        setPolicies(res.data.data || []);
      }
    } catch {
      toast.error("Failed to load cancellation policies");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // ── Form helpers ──
  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm());
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (policy) => {
    setEditingId(policy.id);
    setForm({
      policy_name: policy.policy_name || "",
      property_type_id: policy.property_type_id || "pt-001",
      description: policy.description || "",
      is_active: Boolean(policy.is_active),
      tiers:
        Array.isArray(policy.tiers) && policy.tiers.length > 0
          ? policy.tiers.map((t) => ({
              label: t.label || "",
              days_before_checkin: t.days_before_checkin ?? "",
              refund_percent: t.refund_percent ?? "",
            }))
          : [blankTier()],
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors((e) => ({ ...e, [field]: null }));
  };

  // ── Tier management ──
  const addTier = () =>
    setForm((f) => ({ ...f, tiers: [...f.tiers, blankTier()] }));
  const removeTier = (i) =>
    setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }));
  const updateTier = (i, field, value) => {
    setForm((f) => {
      const tiers = [...f.tiers];
      tiers[i] = { ...tiers[i], [field]: value };
      return { ...f, tiers };
    });
  };
  const moveTier = (i, dir) => {
    setForm((f) => {
      const tiers = [...f.tiers];
      const j = i + dir;
      if (j < 0 || j >= tiers.length) return f;
      [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
      return { ...f, tiers };
    });
  };

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!form.policy_name.trim()) errs.policy_name = "Policy name is required";
    if (!form.property_type_id)
      errs.property_type_id = "Property type is required";
    if (form.tiers.length === 0) errs.tiers = "At least one tier is required";
    form.tiers.forEach((t, i) => {
      if (t.days_before_checkin === "" || t.days_before_checkin === undefined)
        errs[`tier_${i}_days`] = "Required";
      if (t.refund_percent === "" || t.refund_percent === undefined)
        errs[`tier_${i}_pct`] = "Required";
    });
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save ──
  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      ...form,
      tiers: form.tiers.map((t) => ({
        label: t.label || "",
        days_before_checkin: Number(t.days_before_checkin),
        refund_percent: Number(t.refund_percent),
      })),
    };
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/admin/cancellation-policies/${editingId}`, payload);
        toast.success("Policy updated");
      } else {
        await api.post("/admin/cancellation-policies", payload);
        toast.success("Policy created");
      }
      setDialogOpen(false);
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/cancellation-policies/${deleteTarget.id}`);
      toast.success("Policy deleted");
      setDeleteTarget(null);
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete policy");
    }
  };

  // ── Toggle active ──
  const toggleActive = async (policy) => {
    if (policy.is_active) return; // can't deactivate via toggle – delete or set another as active
    try {
      await api.put(`/admin/cancellation-policies/${policy.id}`, {
        ...policy,
        tiers: policy.tiers,
        is_active: true,
      });
      toast.success(`"${policy.policy_name}" set as active`);
      fetchPolicies();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to activate");
    }
  };

  // ── Filter ──
  const displayed =
    activeFilter === "all"
      ? policies
      : policies.filter((p) => p.property_type_id === activeFilter);

  const grouped = PROPERTY_TYPES.reduce((acc, pt) => {
    acc[pt.id] = displayed.filter((p) => p.property_type_id === pt.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Cancellation Policies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cancellation rules per property type. One policy per type can
            be marked active and will apply at checkout.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Policy
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[{ id: "all", label: "All Types" }, ...PROPERTY_TYPES].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${activeFilter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Policy Groups */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {PROPERTY_TYPES.filter(
            (pt) => activeFilter === "all" || activeFilter === pt.id,
          ).map((pt) => (
            <div key={pt.id}>
              <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                {pt.label}
                <Badge variant="outline" className="text-xs">
                  {grouped[pt.id]?.length || 0}{" "}
                  {grouped[pt.id]?.length === 1 ? "policy" : "policies"}
                </Badge>
              </h2>

              {(grouped[pt.id]?.length || 0) === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  No cancellation policies for {pt.label}. Create one using the
                  button above.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {grouped[pt.id].map((policy) => (
                    <Card
                      key={policy.id}
                      className={
                        policy.is_active
                          ? "border-green-500/60 dark:border-green-600/60"
                          : ""
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">
                              {policy.policy_name}
                            </CardTitle>
                            {policy.description && (
                              <CardDescription className="mt-1 text-xs line-clamp-2">
                                {policy.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {policy.is_active ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300 text-xs gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Active
                              </Badge>
                            ) : (
                              <button
                                onClick={() => toggleActive(policy)}
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                title="Set as active policy"
                              >
                                <Circle className="h-3 w-3" /> Set Active
                              </button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {/* Tier table */}
                        {Array.isArray(policy.tiers) &&
                          policy.tiers.length > 0 && (
                            <div className="rounded-md border border-border overflow-hidden text-xs">
                              <table className="w-full">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">
                                      Scenario
                                    </th>
                                    <th className="text-center px-3 py-2 font-medium text-muted-foreground">
                                      Days Before
                                    </th>
                                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">
                                      Refund %
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {policy.tiers.map((tier, i) => (
                                    <tr
                                      key={i}
                                      className={
                                        i % 2 === 0
                                          ? "bg-background"
                                          : "bg-muted/30"
                                      }
                                    >
                                      <td className="px-3 py-2">
                                        {tier.label || "—"}
                                      </td>
                                      <td className="text-center px-3 py-2">
                                        {tier.days_before_checkin}d
                                      </td>
                                      <td className="text-right px-3 py-2 font-semibold text-foreground">
                                        {tier.refund_percent}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(policy)}
                            className="gap-1.5 flex-1"
                          >
                            <Edit className="h-3 w-3" /> Edit
                          </Button>
                          {!policy.is_active && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteTarget(policy)}
                              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          {policy.is_active && (
                            <span className="text-[10px] text-muted-foreground ml-auto italic">
                              Active policy cannot be deleted
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? "Edit Cancellation Policy"
                : "New Cancellation Policy"}
            </DialogTitle>
            <DialogDescription>
              Define the refund tiers. The policy marked active will be shown to
              guests at booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Name + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="policy_name">Policy Name *</Label>
                <Input
                  id="policy_name"
                  value={form.policy_name}
                  onChange={(e) =>
                    handleFormChange("policy_name", e.target.value)
                  }
                  placeholder="e.g. Flexible, Strict"
                />
                {formErrors.policy_name && (
                  <p className="text-xs text-destructive">
                    {formErrors.policy_name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Property Type *</Label>
                <div className="flex gap-2">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      disabled={!!editingId}
                      onClick={() =>
                        handleFormChange("property_type_id", pt.id)
                      }
                      className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors
                        ${form.property_type_id === pt.id ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-muted"}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
                {formErrors.property_type_id && (
                  <p className="text-xs text-destructive">
                    {formErrors.property_type_id}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                rows={2}
                placeholder="Brief explanation shown to guests…"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() => handleFormChange("is_active", !form.is_active)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                  ${form.is_active ? "bg-green-500" : "bg-muted-foreground/30"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
              <Label
                className="cursor-pointer"
                onClick={() => handleFormChange("is_active", !form.is_active)}
              >
                Set as active policy for{" "}
                {PROPERTY_TYPES.find((p) => p.id === form.property_type_id)
                  ?.label || "this type"}
              </Label>
            </div>
            {form.is_active && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Setting this as active will deactivate the current active policy
                for this property type.
              </p>
            )}

            {/* Refund Tiers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Refund Tiers *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTier}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Tier
                </Button>
              </div>

              {formErrors.tiers && (
                <p className="text-xs text-destructive mb-2">
                  {formErrors.tiers}
                </p>
              )}

              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_100px_32px] gap-2 px-2 text-xs font-medium text-muted-foreground">
                  <span>Scenario label</span>
                  <span className="text-center">Days before check-in</span>
                  <span className="text-center">Refund %</span>
                  <span />
                </div>

                {form.tiers.map((tier, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_100px_100px_32px] gap-2 items-center rounded-md border border-border bg-muted/20 px-2 py-1.5"
                  >
                    <Input
                      value={tier.label}
                      onChange={(e) => updateTier(i, "label", e.target.value)}
                      placeholder="e.g. Full Refund"
                      className="h-8 text-sm"
                    />
                    <div>
                      <Input
                        type="number"
                        value={tier.days_before_checkin}
                        onChange={(e) =>
                          updateTier(i, "days_before_checkin", e.target.value)
                        }
                        min="0"
                        placeholder="30"
                        className={`h-8 text-sm text-center ${formErrors[`tier_${i}_days`] ? "border-destructive" : ""}`}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={tier.refund_percent}
                        onChange={(e) =>
                          updateTier(i, "refund_percent", e.target.value)
                        }
                        min="0"
                        max="100"
                        placeholder="100"
                        className={`h-8 text-sm text-center ${formErrors[`tier_${i}_pct`] ? "border-destructive" : ""}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      disabled={form.tiers.length <= 1}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Tiers are evaluated from top to bottom. "Days before check-in"
                sets the minimum days for that tier to apply.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving…"
                : editingId
                  ? "Update Policy"
                  : "Create Policy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Policy
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>&ldquo;{deleteTarget?.policy_name}&rdquo;</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
