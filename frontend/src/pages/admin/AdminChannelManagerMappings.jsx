import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Link,
  Building2,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import api from "../../lib/api";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import FieldLabelWithHint from "../../components/admin/FieldLabelWithHint";
import PropertySearchCombobox from "../../components/admin/PropertySearchCombobox";
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

const statusBadge = (status) => {
  const variants = {
    active: "bg-green-100 text-green-800",
    test: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
};

const blankIntegrationForm = {
  vendor_id: "",
  provider_key: "stayflexi",
  external_hotel_id: "",
  sync_mode: "bi_directional",
  status: "test",
  credentials_json: "",
};

const blankMappingForm = {
  property_id: "",
  external_property_id: "",
  external_room_type_id: "",
};

export default function AdminChannelManagerMappings() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [expandedIntegrationId, setExpandedIntegrationId] = useState(null);
  const [mappings, setMappings] = useState({}); // keyed by integrationId
  const [mappingsLoading, setMappingsLoading] = useState({});

  // Integration dialogs
  const [integrationDialog, setIntegrationDialog] = useState({
    open: false,
    mode: "create",
    data: blankIntegrationForm,
    targetId: null,
  });
  const [deleteIntegrationDialog, setDeleteIntegrationDialog] = useState({
    open: false,
    id: null,
    name: "",
  });

  // Mapping dialogs
  const [mappingDialog, setMappingDialog] = useState({
    open: false,
    mode: "create",
    integrationId: null,
    data: blankMappingForm,
    targetId: null,
  });
  const [deleteMappingDialog, setDeleteMappingDialog] = useState({
    open: false,
    integrationId: null,
    mappingId: null,
    propertyTitle: "",
  });
  const [activateDialog, setActivateDialog] = useState({
    open: false,
    integrationId: null,
    mappingId: null,
    dryRunData: null,
    loading: false,
  });

  const [saving, setSaving] = useState(false);

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(
        "/admin/channel-manager/integrations?limit=100",
      );
      const data = res.data?.data || res.data;
      setIntegrations(data?.integrations || []);
    } catch {
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await api.get("/admin/vendors");
      const data = res.data?.data || res.data;
      setVendors(Array.isArray(data) ? data : data?.vendors || []);
    } catch {
      // non-blocking
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await api.get("/admin/properties?limit=500&status=approved");
      const data = res.data?.data || res.data;
      setProperties(data?.properties || []);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
    fetchVendors();
    fetchProperties();
  }, [fetchIntegrations, fetchVendors, fetchProperties]);

  const fetchMappings = async (integrationId) => {
    setMappingsLoading((prev) => ({ ...prev, [integrationId]: true }));
    try {
      const res = await api.get(
        `/admin/channel-manager/integrations/${integrationId}/mappings`,
      );
      const data = res.data?.data || res.data;
      setMappings((prev) => ({
        ...prev,
        [integrationId]: data?.mappings || [],
      }));
    } catch {
      toast.error("Failed to load mappings");
    } finally {
      setMappingsLoading((prev) => ({ ...prev, [integrationId]: false }));
    }
  };

  const toggleExpand = (integrationId) => {
    if (expandedIntegrationId === integrationId) {
      setExpandedIntegrationId(null);
    } else {
      setExpandedIntegrationId(integrationId);
      if (!mappings[integrationId]) {
        fetchMappings(integrationId);
      }
    }
  };

  // ── Integration CRUD ──────────────────────────────────────────────────────

  const openCreateIntegration = () => {
    setIntegrationDialog({
      open: true,
      mode: "create",
      data: { ...blankIntegrationForm },
      targetId: null,
    });
  };

  const openEditIntegration = (integration) => {
    setIntegrationDialog({
      open: true,
      mode: "edit",
      data: {
        vendor_id: integration.vendor_id,
        provider_key: integration.provider_key,
        external_hotel_id: integration.external_hotel_id,
        sync_mode: integration.sync_mode,
        status: integration.status,
        credentials_json: integration.credentials_json
          ? JSON.stringify(integration.credentials_json, null, 2)
          : "",
      },
      targetId: integration.id,
    });
  };

  const saveIntegration = async () => {
    const { mode, data, targetId } = integrationDialog;
    if (!data.external_hotel_id.trim())
      return toast.error("External Hotel ID is required");
    if (mode === "create" && !data.vendor_id)
      return toast.error("Vendor is required");

    let credentialsJson = null;
    if (data.credentials_json.trim()) {
      try {
        credentialsJson = JSON.parse(data.credentials_json);
      } catch {
        return toast.error("Credentials JSON is not valid JSON");
      }
    }

    const payload = {
      vendor_id: data.vendor_id,
      provider_key: data.provider_key,
      external_hotel_id: data.external_hotel_id.trim(),
      sync_mode: data.sync_mode,
      status: data.status,
      credentials_json: credentialsJson,
    };

    setSaving(true);
    try {
      if (mode === "create") {
        await api.post("/admin/channel-manager/integrations", payload);
        toast.success("Integration created");
      } else {
        await api.put(
          `/admin/channel-manager/integrations/${targetId}`,
          payload,
        );
        toast.success("Integration updated");
      }
      setIntegrationDialog((prev) => ({ ...prev, open: false }));
      fetchIntegrations();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save integration");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteIntegration = async () => {
    setSaving(true);
    try {
      await api.delete(
        `/admin/channel-manager/integrations/${deleteIntegrationDialog.id}`,
      );
      toast.success("Integration deleted");
      setDeleteIntegrationDialog({ open: false, id: null, name: "" });
      if (expandedIntegrationId === deleteIntegrationDialog.id) {
        setExpandedIntegrationId(null);
      }
      fetchIntegrations();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete integration");
    } finally {
      setSaving(false);
    }
  };

  // ── Mapping CRUD ──────────────────────────────────────────────────────────

  const openCreateMapping = (integrationId) => {
    setMappingDialog({
      open: true,
      mode: "create",
      integrationId,
      data: { ...blankMappingForm },
      targetId: null,
    });
  };

  const openEditMapping = (integrationId, mapping) => {
    setMappingDialog({
      open: true,
      mode: "edit",
      integrationId,
      data: {
        property_id: mapping.property_id,
        external_property_id: mapping.external_property_id,
        external_room_type_id: mapping.external_room_type_id || "",
      },
      targetId: mapping.id,
    });
  };

  const saveMapping = async () => {
    const { mode, data, integrationId, targetId } = mappingDialog;
    if (mode === "create" && !data.property_id)
      return toast.error("Property is required");
    if (!data.external_property_id.trim())
      return toast.error("External Property ID is required");

    const payload = {
      property_id: data.property_id,
      external_property_id: data.external_property_id.trim(),
      external_room_type_id: data.external_room_type_id.trim() || null,
    };

    setSaving(true);
    try {
      if (mode === "create") {
        await api.post(
          `/admin/channel-manager/integrations/${integrationId}/mappings`,
          payload,
        );
        toast.success("Mapping created (inactive — activate when ready)");
      } else {
        await api.put(
          `/admin/channel-manager/integrations/${integrationId}/mappings/${targetId}`,
          payload,
        );
        toast.success("Mapping updated");
      }
      setMappingDialog((prev) => ({ ...prev, open: false }));
      fetchMappings(integrationId);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to save mapping");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteMapping = async () => {
    const { integrationId, mappingId } = deleteMappingDialog;
    setSaving(true);
    try {
      await api.delete(
        `/admin/channel-manager/integrations/${integrationId}/mappings/${mappingId}`,
      );
      toast.success("Mapping deleted");
      setDeleteMappingDialog({
        open: false,
        integrationId: null,
        mappingId: null,
        propertyTitle: "",
      });
      fetchMappings(integrationId);
      fetchIntegrations();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete mapping");
    } finally {
      setSaving(false);
    }
  };

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  const startActivateFlow = async (integrationId, mappingId) => {
    setActivateDialog({
      open: true,
      integrationId,
      mappingId,
      dryRunData: null,
      loading: true,
    });
    try {
      const res = await api.post(
        `/admin/channel-manager/integrations/${integrationId}/mappings/${mappingId}/activate?dry_run=true`,
      );
      const data = res.data?.data || res.data;
      setActivateDialog((prev) => ({
        ...prev,
        dryRunData: data,
        loading: false,
      }));
    } catch (e) {
      toast.error(
        e?.response?.data?.message || "Failed to run pre-activation check",
      );
      setActivateDialog({
        open: false,
        integrationId: null,
        mappingId: null,
        dryRunData: null,
        loading: false,
      });
    }
  };

  const confirmActivate = async () => {
    const { integrationId, mappingId } = activateDialog;
    setSaving(true);
    try {
      await api.post(
        `/admin/channel-manager/integrations/${integrationId}/mappings/${mappingId}/activate`,
      );
      toast.success(
        "Mapping activated — StayFlexi is now live for this property",
      );
      setActivateDialog({
        open: false,
        integrationId: null,
        mappingId: null,
        dryRunData: null,
        loading: false,
      });
      fetchMappings(integrationId);
      fetchIntegrations();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to activate mapping");
    } finally {
      setSaving(false);
    }
  };

  const deactivateMapping = async (integrationId, mappingId) => {
    setSaving(true);
    try {
      const res = await api.post(
        `/admin/channel-manager/integrations/${integrationId}/mappings/${mappingId}/deactivate`,
      );
      const data = res.data?.data || res.data;
      toast.success(
        `Mapping deactivated. ${data?.stayflexi_blackouts_removed ?? 0} StayFlexi blackout(s) removed.`,
      );
      fetchMappings(integrationId);
      fetchIntegrations();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to deactivate mapping");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Link className="h-6 w-6 text-primary" />
            Channel Manager Integrations
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage StayFlexi integrations and property mappings. Activate
            mappings to go live per vendor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchIntegrations}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreateIntegration}>
            <Plus className="h-4 w-4 mr-1" />
            New Integration
          </Button>
        </div>
      </div>

      {/* Integrations Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading integrations…
            </div>
          ) : integrations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No integrations found.{" "}
              <button
                className="text-primary underline"
                onClick={openCreateIntegration}
              >
                Create one
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-6" />
                  <TableHead>Provider</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Hotel Code</TableHead>
                  <TableHead>Sync Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Mappings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrations.map((integration) => (
                  <>
                    <TableRow
                      key={integration.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => toggleExpand(integration.id)}
                    >
                      <TableCell>
                        {expandedIntegrationId === integration.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium capitalize">
                        {integration.provider_key}
                      </TableCell>
                      <TableCell>
                        {integration.vendor_name || (
                          <span className="text-muted-foreground text-xs">
                            {integration.vendor_id.slice(0, 8)}…
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {integration.external_hotel_id}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {integration.sync_mode.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{statusBadge(integration.status)}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {integration.active_mapping_count ?? 0}/
                          {integration.mapping_count ?? 0}
                          <span className="text-muted-foreground ml-1">
                            active
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Edit integration"
                            onClick={() => openEditIntegration(integration)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            title="Delete integration"
                            onClick={() =>
                              setDeleteIntegrationDialog({
                                open: true,
                                id: integration.id,
                                name:
                                  integration.vendor_name ||
                                  integration.external_hotel_id,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Mappings Panel */}
                    {expandedIntegrationId === integration.id && (
                      <TableRow key={`${integration.id}-mappings`}>
                        <TableCell colSpan={8} className="p-0 bg-muted/20">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Building2 className="h-4 w-4 text-primary" />
                                Property Mappings
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openCreateMapping(integration.id)
                                }
                              >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add Mapping
                              </Button>
                            </div>

                            {mappingsLoading[integration.id] ? (
                              <p className="text-sm text-muted-foreground py-2">
                                Loading mappings…
                              </p>
                            ) : !mappings[integration.id]?.length ? (
                              <p className="text-sm text-muted-foreground py-2">
                                No property mappings yet.
                              </p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Ext Property ID</TableHead>
                                    <TableHead>Ext Room Type ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                      Actions
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {mappings[integration.id].map((m) => (
                                    <TableRow key={m.id}>
                                      <TableCell className="text-sm">
                                        {m.property_title || m.property_id}
                                        {m.property_city && (
                                          <span className="text-muted-foreground ml-1">
                                            ({m.property_city})
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {m.external_property_id}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {m.external_room_type_id || (
                                          <span className="text-muted-foreground">
                                            —
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {m.is_active ? (
                                          <span className="flex items-center gap-1 text-xs text-green-700">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Active
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <X className="h-3.5 w-3.5" />
                                            Inactive
                                          </span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                          {m.is_active ? (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs"
                                              title="Deactivate (removes StayFlexi blackouts)"
                                              onClick={() =>
                                                deactivateMapping(
                                                  integration.id,
                                                  m.id,
                                                )
                                              }
                                              disabled={saving}
                                            >
                                              <PowerOff className="h-3 w-3 mr-1" />
                                              Deactivate
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                              title="Activate (shows pre-activation summary)"
                                              onClick={() =>
                                                startActivateFlow(
                                                  integration.id,
                                                  m.id,
                                                )
                                              }
                                              disabled={saving}
                                            >
                                              <Power className="h-3 w-3 mr-1" />
                                              Activate
                                            </Button>
                                          )}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            title="Edit mapping"
                                            onClick={() =>
                                              openEditMapping(integration.id, m)
                                            }
                                          >
                                            <Edit className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            title="Delete mapping"
                                            onClick={() =>
                                              setDeleteMappingDialog({
                                                open: true,
                                                integrationId: integration.id,
                                                mappingId: m.id,
                                                propertyTitle:
                                                  m.property_title ||
                                                  m.property_id,
                                              })
                                            }
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Integration Create/Edit Dialog ─────────────────────────────────── */}
      <Dialog
        open={integrationDialog.open}
        onOpenChange={(v) =>
          !saving && setIntegrationDialog((prev) => ({ ...prev, open: v }))
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {integrationDialog.mode === "create"
                ? "New Integration"
                : "Edit Integration"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {integrationDialog.mode === "create" && (
              <div>
                <label className="text-sm font-medium mb-1 block">Vendor</label>
                <Select
                  value={integrationDialog.data.vendor_id || undefined}
                  onValueChange={(v) =>
                    setIntegrationDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, vendor_id: v },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name || v.company_name || v.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1 block">Provider</label>
              <Input
                value={integrationDialog.data.provider_key}
                onChange={(e) =>
                  setIntegrationDialog((prev) => ({
                    ...prev,
                    data: { ...prev.data, provider_key: e.target.value },
                  }))
                }
                placeholder="stayflexi"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                External Hotel ID
              </label>
              <Input
                value={integrationDialog.data.external_hotel_id}
                onChange={(e) =>
                  setIntegrationDialog((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      external_hotel_id: e.target.value,
                    },
                  }))
                }
                placeholder="Hotel code from StayFlexi"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Sync Mode
                </label>
                <Select
                  value={integrationDialog.data.sync_mode}
                  onValueChange={(v) =>
                    setIntegrationDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, sync_mode: v },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bi_directional">
                      Bi-directional
                    </SelectItem>
                    <SelectItem value="pull">Pull only</SelectItem>
                    <SelectItem value="push">Push only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={integrationDialog.data.status}
                  onValueChange={(v) =>
                    setIntegrationDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, status: v },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Credentials JSON{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder='{"username": "...", "password": "..."}'
                value={integrationDialog.data.credentials_json}
                onChange={(e) =>
                  setIntegrationDialog((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      credentials_json: e.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setIntegrationDialog((prev) => ({ ...prev, open: false }))
              }
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveIntegration} disabled={saving}>
              {saving
                ? "Saving…"
                : integrationDialog.mode === "create"
                  ? "Create"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Integration Dialog ─────────────────────────────────────── */}
      <Dialog
        open={deleteIntegrationDialog.open}
        onOpenChange={(v) =>
          !saving &&
          setDeleteIntegrationDialog((prev) => ({ ...prev, open: v }))
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Integration?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            This will soft-delete the integration for{" "}
            <span className="font-semibold text-foreground">
              {deleteIntegrationDialog.name}
            </span>{" "}
            and deactivate all its property mappings. This cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteIntegrationDialog({ open: false, id: null, name: "" })
              }
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteIntegration}
              disabled={saving}
            >
              {saving ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Mapping Create/Edit Dialog ────────────────────────────────────── */}
      <Dialog
        open={mappingDialog.open}
        onOpenChange={(v) =>
          !saving && setMappingDialog((prev) => ({ ...prev, open: v }))
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mappingDialog.mode === "create"
                ? "Add Property Mapping"
                : "Edit Property Mapping"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              Link a Zevio listing to Stayflexi so inventory, rates, restrictions,
              and bookings stay in sync. Each field below must match the codes
              Stayflexi uses in their XML messages.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-1">
            {mappingDialog.mode === "create" && (
              <div>
                <FieldLabelWithHint
                  label="Zevio Property"
                  required
                  hint="Choose the Zevio listing that should receive Stayflexi inventory, rates, and restrictions. This is the property guests book on Zevio."
                />
                <PropertySearchCombobox
                  properties={properties}
                  value={mappingDialog.data.property_id}
                  onChange={(propertyId) =>
                    setMappingDialog((prev) => ({
                      ...prev,
                      data: { ...prev.data, property_id: propertyId },
                    }))
                  }
                />
              </div>
            )}
            <div>
              <FieldLabelWithHint
                label="External Property ID"
                required
                hint="The Stayflexi property or hotel code (often the same as HotelCode in their XML). Stayflexi sends this on every inventory, rate, and restriction update so Zevio knows which integration it belongs to."
              />
              <Input
                value={mappingDialog.data.external_property_id}
                onChange={(e) =>
                  setMappingDialog((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      external_property_id: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. ZEVIO_GOA_001"
              />
            </div>
            <div>
              <FieldLabelWithHint
                label="External Room Type ID"
                hint="The RoomTypeCode Stayflexi uses for this room or unit. Required before you can activate the mapping — without it, Stayflexi updates cannot be applied to the correct listing."
              />
              <Input
                value={mappingDialog.data.external_room_type_id}
                onChange={(e) =>
                  setMappingDialog((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      external_room_type_id: e.target.value,
                    },
                  }))
                }
                placeholder="e.g. GOA_VILLA_01"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setMappingDialog((prev) => ({ ...prev, open: false }))
              }
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={saveMapping} disabled={saving}>
              {saving
                ? "Saving…"
                : mappingDialog.mode === "create"
                  ? "Add"
                  : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Mapping Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={deleteMappingDialog.open}
        onOpenChange={(v) =>
          !saving && setDeleteMappingDialog((prev) => ({ ...prev, open: v }))
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Mapping?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            Remove mapping for{" "}
            <span className="font-semibold text-foreground">
              {deleteMappingDialog.propertyTitle}
            </span>
            ? StayFlexi blackouts are not automatically removed — deactivate
            first if needed.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setDeleteMappingDialog({
                  open: false,
                  integrationId: null,
                  mappingId: null,
                  propertyTitle: "",
                })
              }
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMapping}
              disabled={saving}
            >
              {saving ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Activate Mapping Dialog (with dry-run summary) ────────────────── */}
      <Dialog
        open={activateDialog.open}
        onOpenChange={(v) => {
          if (!saving && !activateDialog.loading) {
            setActivateDialog((prev) => ({ ...prev, open: v }));
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Power className="h-5 w-5 text-green-600" />
              Activate Property Mapping
            </DialogTitle>
          </DialogHeader>

          {activateDialog.loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Running pre-activation checks…
            </div>
          ) : activateDialog.dryRunData ? (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Once activated, StayFlexi will manage rates, inventory, and
                restrictions for this property. Review the summary below before
                confirming.
              </p>

              {activateDialog.dryRunData.upcoming_booking_count > 0 ? (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3">
                  <p className="text-sm font-medium text-yellow-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    {activateDialog.dryRunData.upcoming_booking_count} upcoming
                    confirmed booking(s) on this property
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    These will continue unaffected but rates/availability for
                    future dates will be managed by StayFlexi after activation.
                  </p>
                  <div className="mt-2 max-h-28 overflow-auto space-y-1">
                    {activateDialog.dryRunData.upcoming_confirmed_bookings?.map(
                      (b) => (
                        <div
                          key={b.id}
                          className="text-xs text-yellow-900 font-mono"
                        >
                          {b.id.slice(0, 8)}… — {b.check_in} → {b.check_out}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-green-300 bg-green-50 p-3">
                  <p className="text-sm text-green-800 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    No upcoming confirmed bookings — safe to activate
                  </p>
                </div>
              )}

              <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                <div>
                  <span className="font-medium">Provider:</span>{" "}
                  {activateDialog.dryRunData.provider_key}
                </div>
                <div>
                  <span className="font-medium">Hotel Code:</span>{" "}
                  {activateDialog.dryRunData.external_hotel_id}
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setActivateDialog({
                  open: false,
                  integrationId: null,
                  mappingId: null,
                  dryRunData: null,
                  loading: false,
                })
              }
              disabled={saving || activateDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmActivate}
              disabled={
                saving || activateDialog.loading || !activateDialog.dryRunData
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? "Activating…" : "Confirm Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
