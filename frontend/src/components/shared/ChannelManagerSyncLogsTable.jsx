import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";
import { formatDateTime, formatDisplayValue } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Eye,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  RotateCcw,
} from "lucide-react";

const FilterField = ({ label, children }) => (
  <div className="space-y-2">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    {children}
  </div>
);

const SummaryStat = ({ label, value, tone = "default" }) => {
  const toneClass =
    tone === "success"
      ? "text-green-700"
      : tone === "danger"
        ? "text-red-700"
        : tone === "info"
          ? "text-blue-700"
          : "text-foreground";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>
        {value}
      </p>
    </div>
  );
};

const statusBadgeClass = {
  received: "bg-blue-100 text-blue-800 border-blue-200",
  processed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  ignored: "bg-gray-100 text-gray-800 border-gray-200",
};

const getDirectionLabel = (eventType) => {
  if (String(eventType || "").startsWith("push_booking_")) return "Outbound";
  return "Inbound";
};

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateNDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return toDateInputValue(date);
};

const isReplayableOutboundLog = (row) =>
  row?.processing_status === "failed" &&
  String(row?.event_type || "").startsWith("push_booking_");

const ChannelManagerSyncLogsTable = ({
  title,
  description,
  listEndpoint,
  detailEndpointBuilder,
  replayEndpointBuilder,
  defaultProvider = "stayflexi",
}) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    total: 0,
  });
  const [summary, setSummary] = useState({
    total: 0,
    received: 0,
    processed: 0,
    failed: 0,
    ignored: 0,
    inbound: 0,
    outbound: 0,
    lastReceivedAt: null,
    lastProcessedAt: null,
  });

  const [providerKey, setProviderKey] = useState(defaultProvider);
  const [statusFilter, setStatusFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [hasErrorFilter, setHasErrorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("received_at");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedLog, setSelectedLog] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replayingLogId, setReplayingLogId] = useState(null);

  const fetchLogs = async (page = pagination.page, overrides = {}) => {
    try {
      setLoading(true);
      const filters = {
        providerKey,
        statusFilter,
        directionFilter,
        eventTypeFilter,
        searchFilter,
        fromDate,
        toDate,
        hasErrorFilter,
        sortBy,
        sortOrder,
        ...overrides,
      };

      const params = {
        page,
        limit: pagination.limit,
      };

      if (filters.providerKey) params.provider_key = filters.providerKey;
      if (filters.statusFilter !== "all") {
        params.processing_status = filters.statusFilter;
      }
      if (filters.directionFilter !== "all") {
        params.direction = filters.directionFilter;
      }
      if (filters.eventTypeFilter.trim()) {
        params.event_type = filters.eventTypeFilter.trim();
      }
      if (filters.searchFilter.trim()) {
        params.search = filters.searchFilter.trim();
      }
      if (filters.fromDate) params.from_date = filters.fromDate;
      if (filters.toDate) params.to_date = filters.toDate;
      if (filters.hasErrorFilter !== "all") {
        params.has_error = filters.hasErrorFilter;
      }
      params.sort_by = filters.sortBy;
      params.sort_order = filters.sortOrder;

      const response = await api.get(listEndpoint, { params });
      const payload = response.data?.data || {};

      setLogs(payload.logs || []);
      setSummary({
        total: Number(payload.summary?.total || 0),
        received: Number(payload.summary?.received || 0),
        processed: Number(payload.summary?.processed || 0),
        failed: Number(payload.summary?.failed || 0),
        ignored: Number(payload.summary?.ignored || 0),
        inbound: Number(payload.summary?.inbound || 0),
        outbound: Number(payload.summary?.outbound || 0),
        lastReceivedAt: payload.summary?.last_received_at || null,
        lastProcessedAt: payload.summary?.last_processed_at || null,
      });
      const pageMeta = payload.pagination || {};
      setPagination((prev) => ({
        ...prev,
        page: pageMeta.page || page,
        limit: pageMeta.limit || prev.limit,
        totalPages: pageMeta.totalPages || 1,
        total: pageMeta.total || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch sync logs:", error);
      toast.error("Failed to load sync logs");
    } finally {
      setLoading(false);
    }
  };

  const handleReplayLog = async (row) => {
    if (!replayEndpointBuilder) return;
    if (!isReplayableOutboundLog(row)) {
      toast.error("Only failed outbound booking push logs can be replayed");
      return;
    }

    try {
      setReplayingLogId(row.id);
      const response = await api.post(replayEndpointBuilder(row.id), {
        provider_key: providerKey || defaultProvider,
      });
      const data = response.data?.data;
      if (data?.skipped) {
        toast.warning(data.reason || "Replay skipped");
      } else if (data?.ok) {
        toast.success("Outbound push replayed successfully");
      } else {
        toast.error(
          data?.errorCode
            ? `Provider error ${data.errorCode}`
            : data?.error || "Replay failed at provider",
        );
      }
      await fetchLogs(pagination.page);
      if (detailOpen && selectedLog?.id === row.id) {
        await fetchLogDetail(row.id);
      }
    } catch (error) {
      console.error("Failed to replay sync log:", error);
      toast.error(
        error.response?.data?.message || "Failed to replay outbound sync log",
      );
    } finally {
      setReplayingLogId(null);
    }
  };

  const fetchLogDetail = async (id) => {
    try {
      setDetailLoading(true);
      const response = await api.get(detailEndpointBuilder(id), {
        params: {
          provider_key: providerKey || defaultProvider,
        },
      });
      setSelectedLog(response.data?.data || null);
      setDetailOpen(true);
    } catch (error) {
      console.error("Failed to fetch sync log detail:", error);
      toast.error("Failed to load sync log detail");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [
    providerKey,
    statusFilter,
    directionFilter,
    hasErrorFilter,
    sortBy,
    sortOrder,
  ]);

  const handleSearchEventType = () => {
    fetchLogs(1);
  };

  const handleExportCsv = () => {
    if (!logs.length) {
      toast.error("No logs available to export");
      return;
    }

    const escapeCell = (value) => {
      const safe = String(value ?? "");
      return `"${safe.replace(/"/g, '""')}"`;
    };

    const rows = logs.map((row) => [
      row.id,
      row.provider_key,
      row.event_type,
      getDirectionLabel(row.event_type),
      row.processing_status,
      row.external_event_id || "",
      row.external_hotel_id || "",
      row.received_at || "",
      row.processed_at || "",
      row.error_message || "",
    ]);

    const header = [
      "id",
      "provider_key",
      "event_type",
      "direction",
      "processing_status",
      "external_event_id",
      "external_hotel_id",
      "received_at",
      "processed_at",
      "error_message",
    ];

    const csv = [
      header.map(escapeCell).join(","),
      ...rows.map((cols) => cols.map(escapeCell).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stayflexi-sync-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      statusFilter: "all",
      directionFilter: "all",
      eventTypeFilter: "",
      searchFilter: "",
      fromDate: "",
      toDate: "",
      hasErrorFilter: "all",
      sortBy: "received_at",
      sortOrder: "desc",
    };

    setStatusFilter(defaultFilters.statusFilter);
    setDirectionFilter(defaultFilters.directionFilter);
    setEventTypeFilter(defaultFilters.eventTypeFilter);
    setSearchFilter(defaultFilters.searchFilter);
    setFromDate(defaultFilters.fromDate);
    setToDate(defaultFilters.toDate);
    setHasErrorFilter(defaultFilters.hasErrorFilter);
    setSortBy(defaultFilters.sortBy);
    setSortOrder(defaultFilters.sortOrder);

    fetchLogs(1, defaultFilters);
  };

  const applyQuickPreset = (preset) => {
    if (preset === "today") {
      const today = getDateNDaysAgo(0);
      setFromDate(today);
      setToDate(today);
      fetchLogs(1, { fromDate: today, toDate: today });
      return;
    }

    if (preset === "last_7_days") {
      const from = getDateNDaysAgo(6);
      const to = getDateNDaysAgo(0);
      setFromDate(from);
      setToDate(to);
      fetchLogs(1, { fromDate: from, toDate: to });
      return;
    }

    if (preset === "failed_only") {
      setStatusFilter("failed");
      setHasErrorFilter("true");
      setSortBy("received_at");
      setSortOrder("desc");
      fetchLogs(1, {
        statusFilter: "failed",
        hasErrorFilter: "true",
        sortBy: "received_at",
        sortOrder: "desc",
      });
      return;
    }

    if (preset === "outbound_only") {
      setDirectionFilter("outbound");
      fetchLogs(1, { directionFilter: "outbound" });
    }
  };

  const handledCount = summary.processed + summary.failed;
  const successRate =
    handledCount > 0
      ? ((summary.processed / handledCount) * 100).toFixed(1)
      : "0.0";
  const failureRate =
    handledCount > 0
      ? ((summary.failed / handledCount) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat label="Total logs" value={summary.total} />
        <SummaryStat
          label="Processed"
          value={summary.processed}
          tone="success"
        />
        <SummaryStat label="Failed" value={summary.failed} tone="danger" />
        <SummaryStat label="Inbound" value={summary.inbound} tone="info" />
      </div>

      <Card className="shadow-sm">
        <CardContent className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Outbound</p>
            <p className="mt-1 font-medium">{summary.outbound}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ignored</p>
            <p className="mt-1 font-medium">{summary.ignored}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Success rate</p>
            <p className="mt-1 font-medium text-green-700">{successRate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failure rate</p>
            <p className="mt-1 font-medium text-red-700">{failureRate}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Filters</CardTitle>
          <CardDescription>
            Narrow the log stream by status, direction, dates, and search terms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Provider">
              <Input value={providerKey} readOnly />
            </FilterField>

            <FilterField label="Status">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Direction">
              <Select
                value={directionFilter}
                onValueChange={setDirectionFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All directions</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Error filter">
              <Select value={hasErrorFilter} onValueChange={setHasErrorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Error filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All logs</SelectItem>
                  <SelectItem value="true">With errors</SelectItem>
                  <SelectItem value="false">Without errors</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Event type">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchEventType();
                  }}
                  placeholder="e.g. update_rates"
                  className="pl-9"
                />
              </div>
            </FilterField>

            <FilterField label="Search">
              <Input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchEventType();
                }}
                placeholder="Event ID or error text"
              />
            </FilterField>

            <FilterField label="From date">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </FilterField>

            <FilterField label="To date">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </FilterField>

            <FilterField label="Sort by">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="received_at">Received time</SelectItem>
                  <SelectItem value="processed_at">Processed time</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>

            <FilterField label="Sort order">
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </div>

          <Separator />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSearchEventType}>Apply filters</Button>
              <Button variant="outline" onClick={() => fetchLogs(1)}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExportCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="ghost" onClick={handleResetFilters}>
                Reset
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyQuickPreset("today")}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyQuickPreset("last_7_days")}
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyQuickPreset("failed_only")}
              >
                Failed only
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyQuickPreset("outbound_only")}
              >
                Outbound only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Logs ({pagination.total})
              </CardTitle>
              <CardDescription className="mt-1">
                {summary.lastReceivedAt
                  ? `Last received ${formatDateTime(summary.lastReceivedAt)}`
                  : "No sync activity yet"}
                {summary.lastProcessedAt
                  ? ` · Last processed ${formatDateTime(summary.lastProcessedAt)}`
                  : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-[170px]">Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Loading logs…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No sync logs found for selected filters
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  logs.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(row.received_at)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {row.event_type}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getDirectionLabel(row.event_type)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusBadgeClass[row.processing_status] ||
                            statusBadgeClass.ignored
                          }
                        >
                          {row.processing_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.external_hotel_id || "—"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-xs text-red-600">
                        {row.error_message || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {replayEndpointBuilder &&
                            isReplayableOutboundLog(row) && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleReplayLog(row)}
                                disabled={replayingLogId === row.id}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                {replayingLogId === row.id
                                  ? "Replaying…"
                                  : "Replay"}
                              </Button>
                            )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchLogDetail(row.id)}
                            disabled={detailLoading}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchLogs(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchLogs(pagination.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sync log detail</DialogTitle>
          </DialogHeader>

          {!selectedLog ? (
            <p className="text-sm text-muted-foreground">No detail loaded</p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">ID</span>
                  <p className="font-medium break-all">{selectedLog.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider</span>
                  <p className="font-medium">{selectedLog.provider_key}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Event</span>
                  <p className="font-medium">{selectedLog.event_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="font-medium">{selectedLog.processing_status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">External event ID</span>
                  <p className="font-medium break-all">
                    {selectedLog.external_event_id || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Hotel</span>
                  <p className="font-medium">
                    {selectedLog.external_hotel_id || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Received</span>
                  <p className="font-medium">
                    {formatDateTime(selectedLog.received_at)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Processed</span>
                  <p className="font-medium">
                    {selectedLog.processed_at
                      ? formatDateTime(selectedLog.processed_at)
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Error message</h3>
                <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted p-3 text-xs">
                  {selectedLog.error_message || "—"}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">XML payload</h3>
                <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted p-3 text-xs">
                  {formatDisplayValue(selectedLog.xml_payload)}
                </pre>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Parsed payload</h3>
                <pre className="whitespace-pre-wrap break-words rounded-lg border bg-muted p-3 text-xs">
                  {formatDisplayValue(selectedLog.parsed_payload)}
                </pre>
              </div>

              {replayEndpointBuilder && isReplayableOutboundLog(selectedLog) && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleReplayLog(selectedLog)}
                    disabled={replayingLogId === selectedLog.id}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {replayingLogId === selectedLog.id
                      ? "Replaying…"
                      : "Replay outbound push"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelManagerSyncLogsTable;
