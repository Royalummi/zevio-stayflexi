import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Loader2, Trash2, CalendarOff, Lock, Info } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import api from "../../lib/api";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYMD(str) {
  // mysql2 returns DATE columns as JS Date objects — handle both
  if (str instanceof Date) {
    return new Date(str.getFullYear(), str.getMonth(), str.getDate());
  }
  // Take only the first 10 chars to handle ISO strings like "2026-03-19T00:00:00.000Z"
  const [y, m, d] = String(str).substring(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDatesInRange(startStr, endStr) {
  const dates = [];
  const cur = parseYMD(startStr);
  const end = parseYMD(endStr);
  while (cur <= end) {
    dates.push(toYMD(new Date(cur)));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function formatDateRange(start, end) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  const s = parseYMD(start).toLocaleDateString("en-IN", opts);
  if (!end || start === end) return s;
  const e = parseYMD(end).toLocaleDateString("en-IN", opts);
  return `${s} → ${e}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const PropertyBlockoutCalendar = ({
  propertyId,
  propertyTitle,
  onClose,
  apiBase = "vendor",
  isAdmin = false,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [blackouts, setBlackouts] = useState([]);
  const [bookedDates, setBookedDates] = useState([]);
  const [blockedVendorDates, setBlockedVendorDates] = useState([]);
  const [blockedAdminDates, setBlockedAdminDates] = useState([]);
  const [blackoutMap, setBlackoutMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // DayPicker range selection
  const [range, setRange] = useState(undefined);
  const [reason, setReason] = useState("");

  // Delete candidate
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get(
        `/${apiBase}/properties/${propertyId}/blackouts`,
      );
      if (!resp.data.success) return;

      const { blackouts: bls = [], bookings: bks = [] } = resp.data.data;
      setBlackouts(
        bls.map((bl) => ({
          ...bl,
          start_date: toYMD(parseYMD(bl.start_date)),
          end_date: toYMD(parseYMD(bl.end_date)),
        })),
      );

      const booked = [];
      const vendorBlocked = [];
      const adminBlocked = [];
      const bMap = {};

      for (const bk of bks) {
        const days = getDatesInRange(
          toYMD(parseYMD(bk.start_date)),
          toYMD(parseYMD(bk.end_date)),
        );
        days.forEach((d) => booked.push(parseYMD(d)));
      }

      for (const bl of bls) {
        const start = toYMD(parseYMD(bl.start_date));
        const end = toYMD(parseYMD(bl.end_date));
        const days = getDatesInRange(start, end);
        const normalizedBl = { ...bl, start_date: start, end_date: end };
        days.forEach((d) => {
          bMap[d] = normalizedBl;
          if (bl.created_by === "admin") adminBlocked.push(parseYMD(d));
          else vendorBlocked.push(parseYMD(d));
        });
      }

      setBookedDates(booked);
      setBlockedVendorDates(vendorBlocked);
      setBlockedAdminDates(adminBlocked);
      setBlackoutMap(bMap);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // ── Range change handler ───────────────────────────────────────────────────
  const handleRangeSelect = (newRange) => {
    if (!newRange) {
      setRange(undefined);
      return;
    }
    const from = newRange.from;
    const to = newRange.to || newRange.from;
    const days = getDatesInRange(toYMD(from), toYMD(to));
    const hasBooked = days.some((d) =>
      bookedDates.some((bd) => toYMD(bd) === d),
    );
    if (hasBooked) {
      toast.error("Selection overlaps with a confirmed booking");
      return;
    }
    setRange(newRange);
    setDeleteCandidate(null);
  };

  // ── Day click — clicking a vendor-blocked date offers delete ───────────────
  const handleDayClick = (date) => {
    const ds = toYMD(date);
    const entry = blackoutMap[ds];
    if (!entry) return;
    if (entry.created_by === "admin" && !isAdmin) {
      toast.info("This block was set by admin and cannot be removed here");
      return;
    }
    if (!range?.from || (range.from && range.to)) {
      setDeleteCandidate({
        blackoutId: entry.id,
        start: entry.start_date,
        end: entry.end_date,
        reason: entry.reason,
      });
      setRange(undefined);
    }
  };

  // ── Save block ─────────────────────────────────────────────────────────────
  const handleSaveBlock = async () => {
    if (!range?.from || !range?.to) return;
    try {
      setSaving(true);
      await api.post(`/${apiBase}/properties/${propertyId}/blackouts`, {
        start_date: toYMD(range.from),
        end_date: toYMD(range.to),
        reason: reason.trim() || null,
      });
      toast.success("Dates blocked successfully");
      setRange(undefined);
      setReason("");
      fetchCalendarData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to block dates");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete block ───────────────────────────────────────────────────────────
  const handleDeleteBlackout = async () => {
    if (!deleteCandidate) return;
    try {
      setSaving(true);
      await api.delete(
        `/${apiBase}/properties/${propertyId}/blackouts/${deleteCandidate.blackoutId}`,
      );
      toast.success("Block removed successfully");
      setDeleteCandidate(null);
      fetchCalendarData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove block");
    } finally {
      setSaving(false);
    }
  };

  // Admin can click on admin-blocked dates to delete them; vendors cannot
  const disabledDates = isAdmin
    ? [{ before: today }, ...bookedDates]
    : [{ before: today }, ...bookedDates, ...blockedAdminDates];

  const modifiers = {
    booked: bookedDates,
    vendorBlocked: blockedVendorDates,
    adminBlocked: blockedAdminDates,
  };

  const modifiersClassNames = {
    booked:
      "!bg-amber-100 !text-amber-800 dark:!bg-amber-900/40 dark:!text-amber-300 !rounded-md cursor-not-allowed",
    vendorBlocked:
      "!bg-red-100 !text-red-800 dark:!bg-red-900/30 dark:!text-red-300 !rounded-md",
    adminBlocked:
      "!bg-red-200 !text-red-900 dark:!bg-red-900/50 dark:!text-red-300 !rounded-md cursor-not-allowed",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">
          Loading calendar...
        </span>
      </div>
    );
  }

  const selectionComplete = range?.from && range?.to;
  const selectionStarted = range?.from && !range?.to;

  return (
    <div className="flex gap-6 min-h-0">
      {/* ── Left: Calendar ── */}
      <div className="flex-shrink-0">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={handleRangeSelect}
          onDayClick={handleDayClick}
          disabled={disabledDates}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          numberOfMonths={2}
          fromDate={today}
          showOutsideDays={false}
          classNames={{
            months: "flex gap-6",
            month: "flex flex-col gap-3",
            month_caption:
              "flex justify-center pt-1 relative items-center w-full",
            caption_label: "text-sm font-semibold",
            nav: "flex items-center gap-1",
            button_previous:
              "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 absolute left-1 top-0 flex items-center justify-center rounded-md border border-input hover:bg-accent transition-opacity",
            button_next:
              "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 absolute right-1 top-0 flex items-center justify-center rounded-md border border-input hover:bg-accent transition-opacity",
            month_grid: "w-full border-collapse",
            weekdays: "flex",
            weekday:
              "text-muted-foreground w-9 font-medium text-[0.75rem] text-center pb-1",
            week: "flex w-full mt-1",
            day: "relative p-0 text-center text-sm [&:has([aria-selected])]:bg-primary/10 [&:has([aria-selected].day-range-end)]:rounded-r-md",
            day_button:
              "h-9 w-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            range_start:
              "day-range-start [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground rounded-l-md",
            range_end:
              "day-range-end [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground rounded-r-md",
            selected:
              "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
            today:
              "[&>button]:border [&>button]:border-primary [&>button]:font-bold",
            outside: "text-muted-foreground opacity-30",
            disabled: "text-muted-foreground opacity-25 cursor-not-allowed",
            range_middle:
              "aria-selected:bg-primary/15 aria-selected:text-foreground rounded-none",
            hidden: "invisible",
          }}
        />
      </div>

      {/* ── Divider ── */}
      <Separator orientation="vertical" className="self-stretch" />

      {/* ── Right: Controls + Active Blocks ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto max-h-[420px] pr-1">
        {/* Property name */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
            Property
          </p>
          <p className="font-semibold text-foreground text-sm truncate">
            {propertyTitle}
          </p>
        </div>

        {/* Legend */}
        <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Legend
          </p>
          {[
            {
              color: "bg-amber-100 border-amber-300",
              label: "Guest booking (read-only)",
            },
            {
              color: "bg-red-100 border-red-300",
              label: isAdmin ? "Blocked by vendor" : "Blocked by you",
            },
            {
              color: "bg-red-200 border-red-400",
              label: isAdmin ? "Blocked by admin (you)" : "Blocked by admin",
            },
            { color: "bg-primary border-primary", label: "Selected range" },
          ].map(({ color, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 text-xs text-foreground"
            >
              <span
                className={`inline-block w-3 h-3 rounded shrink-0 border ${color}`}
              />
              {label}
            </span>
          ))}
        </div>

        <Separator />

        {/* Instruction / State panel */}
        {!selectionStarted && !selectionComplete && !deleteCandidate && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Click a start date on the calendar, then click an end date to
              select a range to block.
            </span>
          </div>
        )}

        {/* Partial selection hint */}
        {selectionStarted && (
          <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Started from <strong>{toYMD(range.from)}</strong> — now click an
              end date to complete the range.
            </span>
          </div>
        )}

        {/* Delete candidate panel */}
        {deleteCandidate && !selectionStarted && !selectionComplete && (
          <div className="border border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Remove Block
            </p>
            <p className="text-sm text-foreground font-medium">
              {formatDateRange(deleteCandidate.start, deleteCandidate.end)}
            </p>
            {deleteCandidate.reason && (
              <p className="text-xs text-muted-foreground">
                Reason: {deleteCandidate.reason}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteBlackout}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Remove
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteCandidate(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Confirm block panel */}
        {selectionComplete && (
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarOff className="h-4 w-4 text-primary" />
              Confirm Block
            </p>
            <p className="text-sm text-foreground">
              {formatDateRange(toYMD(range.from), toYMD(range.to))}
            </p>
            <div>
              <Label
                htmlFor="block-reason"
                className="text-xs text-muted-foreground"
              >
                Reason (optional)
              </Label>
              <Input
                id="block-reason"
                className="mt-1 h-8 text-sm"
                placeholder="e.g. Maintenance, personal use..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveBlock} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Lock className="h-4 w-4 mr-1" />
                )}
                Block Dates
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRange(undefined);
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Blocks list */}
        {blackouts.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Active Blocks ({blackouts.length})
            </p>
            <div className="space-y-2">
              {blackouts.map((bl) => (
                <div
                  key={bl.id}
                  className="flex items-center justify-between text-sm bg-muted/50 border rounded-md px-3 py-2 gap-2"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-foreground text-xs">
                      {formatDateRange(bl.start_date, bl.end_date)}
                    </span>
                    {bl.reason && (
                      <span className="text-xs text-muted-foreground truncate">
                        {bl.reason}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs px-1.5 ${
                        bl.created_by === "admin"
                          ? "border-red-400 text-red-600"
                          : "border-orange-400 text-orange-600"
                      }`}
                    >
                      {bl.created_by}
                    </Badge>
                    {(bl.created_by === "vendor" || isAdmin) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          setDeleteCandidate({
                            blackoutId: bl.id,
                            start: bl.start_date,
                            end: bl.end_date,
                            reason: bl.reason,
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-muted-foreground text-center">
              No blocks set yet.
              <br />
              Select a date range to block availability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyBlockoutCalendar;
