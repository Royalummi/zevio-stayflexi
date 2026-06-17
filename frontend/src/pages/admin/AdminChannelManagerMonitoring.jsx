import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../../lib/api";
import { formatDateTime } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";

const statusClass = {
  processed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  received: "bg-blue-50 text-blue-700 border-blue-200",
  ignored: "bg-muted text-muted-foreground border-border",
};

const StatCard = ({ label, value, tone = "default", icon: Icon }) => {
  const toneClass =
    tone === "success"
      ? "text-green-700"
      : tone === "danger"
        ? "text-red-700"
        : "text-foreground";

  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-3xl font-semibold tracking-tight ${toneClass}`}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="rounded-lg bg-muted p-2.5 text-muted-foreground">
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminChannelManagerMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [integrations, setIntegrations] = useState([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState("all");
  const [windowDays, setWindowDays] = useState("7");
  const [runningOp, setRunningOp] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testOpen, setTestOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, integrationsRes] = await Promise.all([
        api.get("/admin/channel-manager/monitoring/overview", {
          params: {
            provider_key: "stayflexi",
            integration_id:
              selectedIntegrationId === "all" ? undefined : selectedIntegrationId,
            days: windowDays,
          },
        }),
        api.get("/admin/channel-manager/monitoring/integrations"),
      ]);

      setOverview(overviewRes.data?.data || overviewRes.data);
      const intData = integrationsRes.data?.data || integrationsRes.data;
      setIntegrations(intData?.integrations || []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load monitoring data",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedIntegrationId, windowDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runTest = async (operationKey) => {
    if (selectedIntegrationId === "all") {
      toast.error("Select an integration before running a test");
      return;
    }

    try {
      setRunningOp(operationKey);
      const res = await api.post("/admin/channel-manager/monitoring/run-test", {
        integration_id: selectedIntegrationId,
        operation_key: operationKey,
        rate_plan_code: "RP01",
      });
      const data = res.data?.data || res.data;
      setTestResult(data);
      setTestOpen(true);
      if (data.ok) toast.success(`${operationKey} test passed`);
      else toast.error(data.logError || "Test completed with errors");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Test failed");
    } finally {
      setRunningOp(null);
    }
  };

  const totals = overview?.totals || { total: 0, processed: 0, failed: 0 };
  const activeIntegrations = integrations.filter((i) => i.status === "active")
    .length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Channel Manager Monitoring
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Track Stayflexi API health — inbound inventory, rates, restrictions,
          hotel detail, and outbound booking push — in one place.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">View controls</CardTitle>
          <CardDescription>
            Choose a time window and integration to scope stats and tests.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time window
              </p>
              <Select value={windowDays} onValueChange={setWindowDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Integration
              </p>
              <Select
                value={selectedIntegrationId}
                onValueChange={setSelectedIntegrationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All integrations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All integrations</SelectItem>
                  {integrations.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.external_hotel_id} — {item.vendor_name || "Vendor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/channel-manager/sync-logs">
                <ExternalLink className="mr-2 h-4 w-4" />
                Full logs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {integrations.length === 0 && (
        <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
          <CardContent className="py-5">
            <p className="text-sm text-amber-900">
              No channel manager integrations found.{" "}
              <Link
                to="/admin/channel-manager/mappings"
                className="font-medium underline underline-offset-2"
              >
                Create an integration and property mapping
              </Link>{" "}
              before running live API tests.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={totals.total} icon={Activity} />
        <StatCard
          label="Processed"
          value={totals.processed}
          tone="success"
          icon={CheckCircle2}
        />
        <StatCard
          label="Failed"
          value={totals.failed}
          tone="danger"
          icon={XCircle}
        />
        <StatCard
          label="Active integrations"
          value={activeIntegrations}
          icon={Building2}
        />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">API operations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Per-endpoint volume, last result, and quick actions.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {(overview?.operations || []).map((op) => (
            <Card key={op.key} className="flex flex-col shadow-sm">
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base leading-snug">
                      {op.label}
                    </CardTitle>
                    <CardDescription className="font-mono text-[11px] break-all">
                      {op.path
                        ? `/api/channel-manager/stayflexi/${op.path}`
                        : "Outbound — Zevio → Stayflexi"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      op.direction === "inbound"
                        ? "shrink-0 border-blue-200 bg-blue-50 text-blue-700"
                        : "shrink-0 border-purple-200 bg-purple-50 text-purple-700"
                    }
                  >
                    {op.direction === "inbound" ? (
                      <ArrowDownLeft className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="mr-1 h-3 w-3" />
                    )}
                    {op.direction}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border bg-muted/40 px-2 py-3">
                    <div className="text-lg font-semibold">{op.stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="rounded-lg border border-green-100 bg-green-50/60 px-2 py-3">
                    <div className="text-lg font-semibold text-green-700">
                      {op.stats.processed}
                    </div>
                    <div className="text-xs text-muted-foreground">OK</div>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50/60 px-2 py-3">
                    <div className="text-lg font-semibold text-red-700">
                      {op.stats.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>

                {op.last ? (
                  <div className="rounded-lg border bg-muted/20 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={
                          statusClass[op.last.processing_status] ||
                          statusClass.ignored
                        }
                      >
                        {op.last.processing_status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatDateTime(op.last.received_at)}
                      </span>
                    </div>
                    {op.last.error_message && (
                      <p className="text-red-600 line-clamp-2">
                        {op.last.error_message}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No events yet</p>
                )}

                <div className="mt-auto flex gap-2 pt-1">
                  {op.direction === "inbound" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      disabled={
                        runningOp === op.key || selectedIntegrationId === "all"
                      }
                      onClick={() => runTest(op.key)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {runningOp === op.key ? "Running…" : "Run test"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link
                      to={`/admin/channel-manager/sync-logs?event_type=${op.eventType}`}
                    >
                      View logs
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent communication
          </CardTitle>
          <CardDescription>
            Latest channel manager requests and responses in the selected window.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[160px]">Time</TableHead>
                  <TableHead>API</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right w-[90px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview?.recent || []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No recent events in this window
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.recent.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(row.received_at)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {row.event_type}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.external_hotel_id || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusClass[row.processing_status] ||
                            statusClass.ignored
                          }
                        >
                          {row.processing_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-red-600">
                        {row.error_message || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/admin/channel-manager/sync-logs">Open</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Test result — {testResult?.operation || "API"}
            </DialogTitle>
          </DialogHeader>
          {testResult && (
            <div className="space-y-5 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={
                    testResult.ok
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }
                >
                  {testResult.ok ? "PASS" : "FAIL"}
                </Badge>
                <Badge variant="outline">HTTP {testResult.responseStatus}</Badge>
                <Badge variant="outline">{testResult.durationMs}ms</Badge>
                {testResult.logId && (
                  <Badge variant="outline">
                    Log: {testResult.logId.slice(0, 8)}…
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <p className="font-medium">URL</p>
                <p className="break-all rounded-lg bg-muted p-3 font-mono text-xs">
                  {testResult.url}
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Request XML</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                  {testResult.requestXml}
                </pre>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Response</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs">
                  {testResult.responseBody}
                </pre>
              </div>
              {testResult.logError && (
                <p className="text-red-600">Log error: {testResult.logError}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminChannelManagerMonitoring;
