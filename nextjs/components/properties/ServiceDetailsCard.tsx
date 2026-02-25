/**
 * ServiceDetailsCard Component
 * Displays service apartment specific details: WiFi, housekeeping, parking, furnishing
 * Phase 2: Service Apartment Enhancements
 */

import { FiWifi, FiHome, FiTruck, FiCalendar } from "react-icons/fi";
import styles from "./service-details.module.css";

interface ServiceDetailsCardProps {
  housekeepingFrequency?: string;
  wifiSpeedMbps?: number;
  wifiProvider?: string;
  furnishingType?: string;
  parkingSlots?: number;
  floorNumber?: number;
  utilitiesIncluded?: boolean;
}

const formatHousekeepingFrequency = (frequency?: string) => {
  if (!frequency) return null;

  const frequencyMap: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    "bi-weekly": "Bi-weekly (Every 2 weeks)",
    "on-demand": "On-demand (Request when needed)",
    twice_weekly: "Twice weekly",
  };

  return frequencyMap[frequency] || frequency;
};

const formatFurnishing = (type?: string) => {
  if (!type) return null;

  const furnishingMap: Record<string, string> = {
    fully_furnished: "Fully Furnished",
    semi_furnished: "Semi Furnished",
    unfurnished: "Unfurnished",
  };

  return furnishingMap[type] || type;
};

export default function ServiceDetailsCard({
  housekeepingFrequency,
  wifiSpeedMbps,
  wifiProvider,
  furnishingType,
  parkingSlots,
  floorNumber,
  utilitiesIncluded,
}: ServiceDetailsCardProps) {
  // Don't render if no service details
  if (
    !housekeepingFrequency &&
    !wifiSpeedMbps &&
    !wifiProvider &&
    !furnishingType &&
    !parkingSlots
  ) {
    return null;
  }

  return (
    <div className={styles.serviceDetailsCard}>
      <h2 className={styles.sectionTitle}>Service Apartment Details</h2>

      <div className={styles.detailsGrid}>
        {/* WiFi Information */}
        {(wifiSpeedMbps || wifiProvider) && (
          <div className={styles.detailItem}>
            <div className={styles.iconWrapper}>
              <FiWifi className={styles.icon} />
            </div>
            <div className={styles.detailContent}>
              <h3 className={styles.detailTitle}>WiFi & Internet</h3>
              {wifiSpeedMbps && (
                <p className={styles.detailValue}>
                  <strong>{wifiSpeedMbps} Mbps</strong>
                  {wifiSpeedMbps >= 100 && (
                    <span className={styles.badge}>High Speed</span>
                  )}
                </p>
              )}
              {wifiProvider && (
                <p className={styles.detailProvider}>
                  Provider: {wifiProvider}
                </p>
              )}
              <p className={styles.detailNote}>
                WiFi credentials provided at check-in
              </p>
            </div>
          </div>
        )}

        {/* Housekeeping Frequency */}
        {housekeepingFrequency && (
          <div className={styles.detailItem}>
            <div className={styles.iconWrapper}>
              <FiCalendar className={styles.icon} />
            </div>
            <div className={styles.detailContent}>
              <h3 className={styles.detailTitle}>Housekeeping Service</h3>
              <p className={styles.detailValue}>
                {formatHousekeepingFrequency(housekeepingFrequency)}
              </p>
              <p className={styles.detailNote}>
                {housekeepingFrequency === "daily"
                  ? "Fresh linens and daily cleaning included"
                  : housekeepingFrequency === "on-demand"
                    ? "Request housekeeping as needed"
                    : "Regular cleaning service included"}
              </p>
            </div>
          </div>
        )}

        {/* Furnishing Type */}
        {furnishingType && (
          <div className={styles.detailItem}>
            <div className={styles.iconWrapper}>
              <FiHome className={styles.icon} />
            </div>
            <div className={styles.detailContent}>
              <h3 className={styles.detailTitle}>Furnishing</h3>
              <p className={styles.detailValue}>
                {formatFurnishing(furnishingType)}
              </p>
              <p className={styles.detailNote}>
                {furnishingType === "fully_furnished"
                  ? "All furniture, appliances, and essentials included"
                  : furnishingType === "semi_furnished"
                    ? "Basic furniture and kitchen appliances included"
                    : "Bring your own furniture and essentials"}
              </p>
            </div>
          </div>
        )}

        {/* Parking Information */}
        {parkingSlots !== undefined && parkingSlots !== null && (
          <div className={styles.detailItem}>
            <div className={styles.iconWrapper}>
              <FiTruck className={styles.icon} />
            </div>
            <div className={styles.detailContent}>
              <h3 className={styles.detailTitle}>Parking</h3>
              <p className={styles.detailValue}>
                {parkingSlots === 0 ? (
                  <>No parking available</>
                ) : (
                  <>
                    {parkingSlots} {parkingSlots === 1 ? "Slot" : "Slots"}
                    {parkingSlots >= 2 && (
                      <span className={styles.badge}>Multiple</span>
                    )}
                  </>
                )}
              </p>
              <p className={styles.detailNote}>
                {parkingSlots === 0
                  ? "Public parking available nearby"
                  : floorNumber
                    ? `Designated parking on premises (Property on Floor ${floorNumber})`
                    : "Designated parking on premises"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Utilities Information */}
      {utilitiesIncluded !== undefined && (
        <div className={styles.utilitiesNote}>
          <strong>Utilities:</strong>{" "}
          {utilitiesIncluded
            ? "Electricity, water, and gas included in rent"
            : "Utilities charged separately based on usage"}
        </div>
      )}
    </div>
  );
}
