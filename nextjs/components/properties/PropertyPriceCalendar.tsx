"use client";

import { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiTag } from "react-icons/fi";

interface PriceEntry {
  price_date: string; // "YYYY-MM-DD"
  price: number;
  note?: string;
}

interface Props {
  propertyId: string;
  basePrice: number; // price per night from the property listing
}

const MONTH_NAMES = [
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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatPrice(amount: number): string {
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}k`;
  return `₹${amount}`;
}

export default function PropertyPriceCalendar({
  propertyId,
  basePrice,
}: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [priceMap, setPriceMap] = useState<Record<string, PriceEntry>>({});
  const [loading, setLoading] = useState(false);
  const [fetchedYears, setFetchedYears] = useState<Set<number>>(new Set());

  // Fetch price data for a given year (cached by year)
  useEffect(() => {
    if (fetchedYears.has(year)) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/properties/${propertyId}/calendar-pricing?year=${year}`,
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPriceMap((prev) => {
            const updated = { ...prev };
            (json.data as PriceEntry[]).forEach((entry) => {
              updated[entry.price_date] = entry;
            });
            return updated;
          });
          setFetchedYears((prev) => new Set(prev).add(year));
        }
      } catch {
        // silently ignore — fall back to showing base price only
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year, propertyId, fetchedYears]);

  // Navigate months
  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Count custom-priced days this month
  const customDaysThisMonth = cells.filter((d) => {
    if (!d) return false;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return !!priceMap[key];
  }).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiTag className="text-blue-600" size={18} />
          <h3 className="text-base font-semibold text-gray-900">
            Pricing Calendar
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100"
          >
            <FiChevronLeft size={18} />
          </button>
          <span className="min-w-[130px] text-center text-sm font-medium text-gray-700">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100"
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Base price note */}
      <p className="mb-3 text-xs text-gray-500">
        Base price:{" "}
        <span className="font-semibold text-gray-700">
          {formatPrice(basePrice)}
        </span>{" "}
        / night
        {customDaysThisMonth > 0 && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {customDaysThisMonth} special{" "}
            {customDaysThisMonth === 1 ? "rate" : "rates"} this month
          </span>
        )}
      </p>

      {/* Loading overlay state */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      ) : (
        <>
          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-xs font-medium text-gray-400"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) => {
              if (!day)
                return <div key={`empty-${idx}`} className="h-14 rounded-lg" />;

              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const entry = priceMap[key];
              const isPast = key < today;
              const isToday = key === today;
              const displayPrice = entry?.price ?? basePrice;
              const isCustom = !!entry;

              return (
                <div
                  key={key}
                  title={
                    entry?.note
                      ? `${formatPrice(entry.price)} — ${entry.note}`
                      : formatPrice(displayPrice)
                  }
                  className={[
                    "flex h-14 flex-col items-center justify-center rounded-lg px-1 select-none",
                    isPast ? "opacity-40" : "",
                    isCustom && !isPast
                      ? "bg-blue-50 ring-1 ring-blue-200"
                      : "bg-gray-50",
                    isToday ? "ring-2 ring-blue-500" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span
                    className={[
                      "text-xs font-semibold leading-none",
                      isCustom && !isPast ? "text-blue-700" : "text-gray-700",
                    ].join(" ")}
                  >
                    {day}
                  </span>
                  <span
                    className={[
                      "mt-0.5 text-[10px] leading-none",
                      isCustom && !isPast
                        ? "font-bold text-blue-600"
                        : "text-gray-400",
                    ].join(" ")}
                  >
                    {formatPrice(displayPrice)}
                  </span>
                  {entry?.note && !isPast && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-3 w-3 rounded bg-gray-50 ring-1 ring-gray-200" />
              Base rate
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-3 w-3 rounded bg-blue-50 ring-1 ring-blue-200" />
              Special rate
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-3 w-3 rounded ring-2 ring-blue-500" />
              Today
            </div>
          </div>
        </>
      )}
    </div>
  );
}
