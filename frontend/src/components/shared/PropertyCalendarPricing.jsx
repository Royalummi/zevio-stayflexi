/**
 * PropertyCalendarPricing – SESSION 70
 * Calendar-based day-wise pricing manager.
 * Used by both admin and vendor property forms.
 *
 * Props:
 *   propertyId  {string}  – required to call API (null = hide component / edit-mode only)
 *   basePrice   {number}  – property's base price_per_night (for reference display)
 *   canEdit     {boolean} – false = read-only display
 */

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Trash2,
  Save,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toKey = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const today = () => {
  const now = new Date();
  return toKey(now.getFullYear(), now.getMonth(), now.getDate());
};
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // string date compare (YYYY-MM-DD)

// ──────────────────────────────────────────────────────────
export default function PropertyCalendarPricing({
  propertyId,
  basePrice = 0,
  canEdit = true,
  role = "auto",
  onPendingChange = null,
}) {
  // role: "admin" | "vendor" | "auto" (tries admin first, falls back to vendor)
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  // priceMap: { "YYYY-MM-DD": { price, note, id } }
  const [priceMap, setPriceMap] = useState({});
  // pendingMap: staged prices when propertyId is null (pre-creation mode)
  const [pendingMap, setPendingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selection state
  const [selectStart, setSelectStart] = useState(null); // "YYYY-MM-DD"
  const [selectEnd, setSelectEnd] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);

  // Set-price form
  const [priceInput, setPriceInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [stayflexiManaged, setStayflexiManaged] = useState(false);

  const effectiveCanEdit = canEdit && !stayflexiManaged;

  // ── Fetch calendar prices for current view ──
  // role="vendor"  → only use vendor endpoint, no fallback
  // role="admin"   → only use admin endpoint, no fallback
  // role="auto"    → try admin first, fall back to vendor (legacy/unknown contexts)
  const apiBase = role === "vendor" ? "vendor" : "admin";
  const apiFallback = role === "auto" ? "vendor" : null;

  const callApi = async (fn) => {
    try {
      return await fn(apiBase);
    } catch (err) {
      // Only fall back on auth-related errors (401/403), never on server errors (5xx)
      if (
        apiFallback &&
        (err?.response?.status === 401 || err?.response?.status === 403)
      ) {
        return await fn(apiFallback);
      }
      throw err;
    }
  };

  const fetchPrices = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const res = await callApi((base) =>
        api.get(`/${base}/properties/${propertyId}/calendar-pricing`, {
          params: { year: viewYear },
        }),
      );
      if (res.data.success) {
        const payload = res.data.data;
        const entries = Array.isArray(payload)
          ? payload
          : payload?.prices || [];
        setStayflexiManaged(Boolean(payload?.stayflexi_managed));
        const map = {};
        entries.forEach((entry) => {
          map[entry.price_date] = {
            price: parseFloat(entry.price),
            note: entry.note || "",
          };
        });
        setPriceMap(map);
      }
    } catch {
      // silently fail – base price will be used for all days
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, viewYear, role]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // ── Navigation ──
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  // ── Build calendar grid ──
  const buildDays = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  // ── Selection logic ──
  const isInRange = (dateKey) => {
    if (!selectStart) return false;
    const end = selectEnd || hoverDate || selectStart;
    const [lo, hi] =
      cmp(selectStart, end) <= 0 ? [selectStart, end] : [end, selectStart];
    return cmp(dateKey, lo) >= 0 && cmp(dateKey, hi) <= 0;
  };

  const handleDayClick = (d) => {
    if (!effectiveCanEdit) return;
    const key = toKey(viewYear, viewMonth, d);
    if (!selectStart || (selectStart && selectEnd)) {
      // Start new selection
      setSelectStart(key);
      setSelectEnd(null);
      setPriceInput(
        activeMap[key]?.price
          ? String(activeMap[key].price)
          : String(basePrice || ""),
      );
      setNoteInput(activeMap[key]?.note || "");
    } else {
      // End selection
      setSelectEnd(key);
    }
  };

  const clearSelection = () => {
    setSelectStart(null);
    setSelectEnd(null);
    setPriceInput("");
    setNoteInput("");
  };

  // ── Save bulk range ──
  const handleSave = async () => {
    if (!selectStart)
      return toast.error("Please select one or more dates first");
    const p = parseFloat(priceInput);
    if (!p || p <= 0) return toast.error("Enter a valid price greater than 0");

    const end = selectEnd || selectStart;
    const [lo, hi] =
      cmp(selectStart, end) <= 0 ? [selectStart, end] : [end, selectStart];

    // Build array of all dates in range
    const dates = [];
    const cursor = new Date(lo);
    const endDate = new Date(hi);
    while (cursor <= endDate) {
      dates.push({
        date: cursor.toISOString().split("T")[0],
        price: p,
        note: noteInput.trim() || null,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (dates.length > 366)
      return toast.error("Range too large. Maximum 366 days at once.");

    // ── Staging mode: no propertyId yet (pre-creation) ──
    if (!propertyId) {
      const newPending = { ...pendingMap };
      dates.forEach((d) => {
        newPending[d.date] = { price: d.price, note: d.note };
      });
      setPendingMap(newPending);
      const flatList = Object.entries(newPending).map(([date, v]) => ({
        date,
        price: v.price,
        note: v.note || null,
      }));
      onPendingChange?.(flatList);
      clearSelection();
      toast.success(
        `Staged ${dates.length} date price${dates.length > 1 ? "s" : ""} — saves when property is created`,
      );
      return;
    }

    try {
      setSaving(true);
      let success = false;
      await callApi((base) =>
        api.post(`/${base}/properties/${propertyId}/calendar-pricing`, {
          dates,
        }),
      );
      success = true;
      if (success) {
        toast.success(
          `Price set for ${dates.length} date${dates.length > 1 ? "s" : ""}`,
        );
        clearSelection();
        fetchPrices();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  // ── Clear single date ──
  const handleClearDate = async (dateKey) => {
    if (!effectiveCanEdit) return;
    // Staging mode
    if (!propertyId) {
      const newPending = { ...pendingMap };
      delete newPending[dateKey];
      setPendingMap(newPending);
      onPendingChange?.(
        Object.entries(newPending).map(([date, v]) => ({
          date,
          price: v.price,
          note: v.note || null,
        })),
      );
      if (selectStart === dateKey) clearSelection();
      return;
    }
    try {
      await callApi((base) =>
        api.delete(
          `/${base}/properties/${propertyId}/calendar-pricing/${dateKey}`,
        ),
      );
      setPriceMap((prev) => {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });
      if (selectStart === dateKey) clearSelection();
      toast.success("Custom price removed");
    } catch {
      toast.error("Failed to remove price");
    }
  };

  // ── Clear entire month ──
  const handleClearMonth = async () => {
    if (!effectiveCanEdit) return;
    // Staging mode
    if (!propertyId) {
      const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
      const newPending = Object.fromEntries(
        Object.entries(pendingMap).filter(([k]) => !k.startsWith(prefix)),
      );
      setPendingMap(newPending);
      onPendingChange?.(
        Object.entries(newPending).map(([date, v]) => ({
          date,
          price: v.price,
          note: v.note || null,
        })),
      );
      toast.success(`Staged prices cleared for ${MONTHS[viewMonth]}`);
      clearSelection();
      return;
    }
    const lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
    const start = toKey(viewYear, viewMonth, 1);
    const end = toKey(viewYear, viewMonth, lastDay);
    try {
      setSaving(true);
      await callApi((base) =>
        api.delete(`/${base}/properties/${propertyId}/calendar-pricing`, {
          data: { start_date: start, end_date: end },
        }),
      );
      toast.success(`All custom prices cleared for ${MONTHS[viewMonth]}`);
      fetchPrices();
      clearSelection();
    } catch {
      toast.error("Failed to clear month prices");
    } finally {
      setSaving(false);
    }
  };

  const todayKey = today();
  const cells = buildDays();

  // Active map: pending (pre-creation) vs saved (edit mode)
  const activeMap = propertyId ? priceMap : pendingMap;

  const customDatesInMonth = Object.keys(activeMap).filter((k) =>
    k.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`),
  );

  return (
    <div className="space-y-4">
      {/* Staging mode banner (pre-creation) */}
      {!propertyId && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          <Info className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Preview mode:</strong> Set prices now — they'll be saved
            automatically when the property is created.
          </span>
        </div>
      )}
      {propertyId && stayflexiManaged && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-2.5 text-sm text-blue-800 dark:text-blue-300">
          <Info className="h-4 w-4 shrink-0 text-blue-500" />
          <span>
            <strong>Stayflexi managed:</strong> Calendar pricing is synced from
            Stayflexi and cannot be edited here. Deactivate the channel manager
            mapping to edit manually.
          </span>
        </div>
      )}
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-base font-semibold min-w-[160px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {customDatesInMonth.length > 0 && effectiveCanEdit && (
            <button
              type="button"
              onClick={handleClearMonth}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Clear {MONTHS[viewMonth]}
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            {customDatesInMonth.length} custom{" "}
            {customDatesInMonth.length === 1 ? "price" : "prices"}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-muted border border-border" />
          Base ₹{basePrice?.toLocaleString("en-IN") || "—"}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-500/20 border border-blue-400" />
          Custom price
        </span>
        {effectiveCanEdit && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-primary/20 border border-primary/60" />
            Selected
          </span>
        )}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAYS.map((day) => (
            <div
              key={day}
              className="h-7 flex items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Day cells */}
          {cells.map((d, idx) => {
            if (!d) return <div key={`empty-${idx}`} />;
            const key = toKey(viewYear, viewMonth, d);
            const isCustom = Boolean(activeMap[key]);
            const isSelected = isInRange(key);
            const isToday = key === todayKey;
            const isPast = key < todayKey;
            const rowPrice = activeMap[key]?.price;

            let cellClass =
              "relative h-14 rounded-md border cursor-pointer transition-colors flex flex-col items-center justify-center gap-0.5 text-xs select-none ";

            if (isPast) {
              cellClass +=
                "bg-muted/40 border-border text-muted-foreground/50 cursor-default ";
            } else if (isSelected) {
              cellClass += "bg-primary/15 border-primary/60 text-foreground ";
            } else if (isCustom) {
              cellClass +=
                "bg-blue-500/10 border-blue-300 dark:border-blue-700 text-foreground hover:bg-blue-500/20 ";
            } else {
              cellClass +=
                "bg-background border-border text-foreground hover:bg-muted/50 ";
            }

            if (isToday) cellClass += "ring-1 ring-primary ring-offset-0 ";

            return (
              <div
                key={key}
                className={`group ${cellClass}`}
                onClick={() => !isPast && handleDayClick(d)}
                onMouseEnter={() =>
                  effectiveCanEdit && selectStart && !selectEnd && setHoverDate(key)
                }
                onMouseLeave={() => setHoverDate(null)}
                title={
                  isCustom
                    ? `₹${rowPrice?.toLocaleString("en-IN")}${activeMap[key].note ? ` — ${activeMap[key].note}` : ""}`
                    : `₹${basePrice?.toLocaleString("en-IN")} (base)`
                }
              >
                <span className="font-medium leading-none">{d}</span>
                {isCustom ? (
                  <span className="text-[10px] leading-none text-blue-700 dark:text-blue-300 font-semibold">
                    ₹
                    {rowPrice >= 1000
                      ? `${(rowPrice / 1000).toFixed(1)}k`
                      : rowPrice}
                  </span>
                ) : (
                  <span className="text-[10px] leading-none text-muted-foreground">
                    ₹
                    {basePrice >= 1000
                      ? `${(basePrice / 1000).toFixed(1)}k`
                      : basePrice || "—"}
                  </span>
                )}
                {/* Remove button for custom dates */}
                {isCustom && effectiveCanEdit && !isPast && (
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDate(key);
                    }}
                    title="Remove custom price"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Set Price Panel */}
      {effectiveCanEdit && (
        <div
          className={`rounded-lg border transition-all ${selectStart ? "border-primary/40 bg-primary/5 p-4" : "border-dashed border-border bg-muted/20 p-3"}`}
        >
          {!selectStart ? (
            <p className="text-xs text-muted-foreground text-center">
              <CalendarDays className="h-3.5 w-3.5 inline mr-1.5" />
              Click a date to select, then drag or click another to set a range
              price
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-foreground">
                  {selectStart === (selectEnd || selectStart)
                    ? `Setting price for ${selectStart}`
                    : `Setting price: ${[selectStart, selectEnd || selectStart].sort()[0]} → ${[selectStart, selectEnd || selectStart].sort()[1]}`}
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Price per Night (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      min="1"
                      step="0.01"
                      placeholder={String(basePrice || "")}
                      className="w-full pl-7 pr-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="e.g. Weekend rate, Holiday surcharge…"
                    maxLength={100}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors font-medium"
                >
                  <Save className="h-3 w-3" />
                  {saving ? "Saving…" : "Set Price"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
