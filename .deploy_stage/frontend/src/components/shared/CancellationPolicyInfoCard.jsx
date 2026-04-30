/**
 * SESSION 70: CancellationPolicyInfoCard
 * Shows the currently active cancellation policy for a given property type.
 * Embedded inside both AdminPropertyForm and VendorPropertyForm as a read-only display.
 *
 * Props:
 *   propertyTypeId  {string}   – "pt-001" (Villa) | "pt-002" (Service Apartment)
 *   isAdmin         {boolean}  – if true, shows a "Manage Policies" link
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { Shield, ExternalLink, Info } from "lucide-react";

export default function CancellationPolicyInfoCard({
  propertyTypeId,
  isAdmin = false,
}) {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!propertyTypeId) {
      setPolicy(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/public/cancellation-policies/active");
        if (!cancelled && res.data.success) {
          const active = (res.data.data || []).find(
            (p) => p.property_type_id === propertyTypeId,
          );
          setPolicy(active || null);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyTypeId]);

  if (!propertyTypeId) return null;

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-muted/20 p-4 animate-pulse h-20" />
    );
  }

  if (!policy) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-900 dark:text-amber-300">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1">
          <strong>No active cancellation policy</strong> for this property type.
          {isAdmin && (
            <>
              {" "}
              &nbsp;
              <Link
                to="/admin/cancellation-policies"
                className="underline underline-offset-2 hover:no-underline font-medium"
              >
                Create one now →
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm font-semibold text-foreground">
            {policy.policy_name}
          </span>
          <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700 font-medium">
            Active
          </span>
        </div>
        {isAdmin && (
          <Link
            to="/admin/cancellation-policies"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Manage <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      {policy.description && (
        <p className="text-xs text-muted-foreground">{policy.description}</p>
      )}

      {Array.isArray(policy.tiers) && policy.tiers.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden text-xs">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">
                  Scenario
                </th>
                <th className="text-center px-3 py-1.5 font-medium text-muted-foreground">
                  Days before check-in
                </th>
                <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">
                  Refund
                </th>
              </tr>
            </thead>
            <tbody>
              {policy.tiers.map((tier, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                >
                  <td className="px-3 py-1.5">{tier.label || "—"}</td>
                  <td className="text-center px-3 py-1.5">
                    {tier.days_before_checkin} days
                  </td>
                  <td className="text-right px-3 py-1.5 font-semibold text-foreground">
                    {tier.refund_percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
