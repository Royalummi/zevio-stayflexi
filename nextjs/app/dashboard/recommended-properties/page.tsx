"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/axios";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiStar,
  FiCheck,
  FiX,
  FiSearch,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { TbGripVertical } from "react-icons/tb";
import styles from "./recommended-properties.module.css";

interface Property {
  id: string;
  title: string;
  city: string;
  state: string;
  bedrooms: number;
  max_guests: number;
  price_per_night: number;
  rating: number;
  reviews_count: number;
  property_type_id: string;
  property_type: string;
  is_recommended: boolean;
  recommended_priority: number;
  photos: string[];
  status: string;
}

interface SortablePropertyItemProps {
  property: Property;
  onRemove: (id: string) => void;
}

function SortablePropertyItem({
  property,
  onRemove,
}: SortablePropertyItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.sortableItem} ${isDragging ? styles.dragging : ""}`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <TbGripVertical />
      </div>

      <div className={styles.propertyImage}>
        <Image
          src={property.photos[0]}
          alt={property.title}
          width={120}
          height={100}
          style={{ objectFit: "cover" }}
        />
        <div className={styles.priority}>{property.recommended_priority}</div>
      </div>

      <div className={styles.propertyInfo}>
        <h4>{property.title}</h4>
        <p className={styles.location}>
          {property.city}, {property.state}
        </p>
        <div className={styles.stats}>
          <span>{property.bedrooms} BHK</span>
          <span>·</span>
          <span>{property.max_guests} Guests</span>
          <span>·</span>
          <span>₹{(property.price_per_night || 0).toLocaleString()}/night</span>
        </div>
      </div>

      <button
        onClick={() => onRemove(property.id)}
        className={styles.removeBtn}
        title="Remove from recommended"
      >
        <FiX />
      </button>
    </div>
  );
}

export default function RecommendedPropertiesAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"villa" | "service_apartment">(
    "villa",
  );
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<
    Property[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Fetch properties
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all properties of current type
      const allResponse = await api.get("/admin/properties", {
        params: {
          property_type: activeTab,
          status: "approved",
        },
      });

      const properties = allResponse.data.data?.properties || [];
      setAllProperties(properties);

      // Filter recommended ones and sort by priority
      const recommended = properties
        .filter((p: Property) => p.is_recommended)
        .sort(
          (a: Property, b: Property) =>
            b.recommended_priority - a.recommended_priority,
        );

      setRecommendedProperties(recommended);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to fetch properties",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchProperties();
    }
  }, [isAuthenticated, user, activeTab, fetchProperties]);

  const handleToggleRecommended = async (
    propertyId: string,
    currentStatus: boolean,
  ) => {
    try {
      setSaving(true);

      await api.put(`/admin/properties/${propertyId}/recommended`, {
        is_recommended: !currentStatus,
      });

      setMessage({
        type: "success",
        text: !currentStatus
          ? "Property added to recommended"
          : "Property removed from recommended",
      });

      // Refresh data
      await fetchProperties();
    } catch (error) {
      console.error("Failed to toggle recommended:", error);
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update property",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = recommendedProperties.findIndex(
        (p) => p.id === active.id,
      );
      const newIndex = recommendedProperties.findIndex((p) => p.id === over.id);

      const reorderedProperties = arrayMove(
        recommendedProperties,
        oldIndex,
        newIndex,
      );
      setRecommendedProperties(reorderedProperties);

      // Update priorities on backend
      try {
        setSaving(true);

        const orderedIds = reorderedProperties.map((p) => p.id);
        await api.put("/admin/recommended-properties/reorder", {
          property_type_id: activeTab === "villa" ? "pt-001" : "pt-002",
          ordered_property_ids: orderedIds,
        });

        setMessage({
          type: "success",
          text: "Order updated successfully",
        });

        setTimeout(() => setMessage(null), 3000);
      } catch (error) {
        console.error("Failed to reorder:", error);
        setMessage({
          type: "error",
          text: "Failed to update order",
        });

        // Revert on error
        await fetchProperties();
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRemoveRecommended = async (propertyId: string) => {
    await handleToggleRecommended(propertyId, true);
  };

  const filteredProperties = allProperties.filter((p) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(query) ||
        p.city.toLowerCase().includes(query) ||
        p.state.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const availableProperties = filteredProperties.filter(
    (p) => !p.is_recommended,
  );
  const recommendedCount = recommendedProperties.length;
  const maxRecommended = 12;
  const canAddMore = recommendedCount < maxRecommended;

  if (isLoading || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>
            <FiStar /> Manage Recommended Properties
          </h1>
          <p className={styles.subtitle}>
            Curate up to 12 properties per type to showcase on the homepage
          </p>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.type === "success" ? <FiCheck /> : <FiAlertCircle />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Property Type Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "villa" ? styles.active : ""}`}
          onClick={() => setActiveTab("villa")}
        >
          Villas
          <span className={styles.badge}>
            {
              allProperties.filter(
                (p) => p.property_type_id === "pt-001" && p.is_recommended,
              ).length
            }
            /12
          </span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === "service_apartment" ? styles.active : ""}`}
          onClick={() => setActiveTab("service_apartment")}
        >
          Service Apartments
          <span className={styles.badge}>
            {
              allProperties.filter(
                (p) => p.property_type_id === "pt-002" && p.is_recommended,
              ).length
            }
            /12
          </span>
        </button>
      </div>

      <div className={styles.content}>
        {/* Recommended Properties Section (Left) */}
        <div className={styles.recommendedSection}>
          <div className={styles.sectionHeader}>
            <h2>
              Recommended ({recommendedCount}/{maxRecommended})
            </h2>
            <button
              onClick={fetchProperties}
              className={styles.refreshBtn}
              disabled={saving}
              title="Refresh list"
            >
              <FiRefreshCw />
            </button>
          </div>

          {!canAddMore && (
            <div className={styles.limitWarning}>
              <FiAlertCircle />
              <span>
                Maximum limit reached. Remove a property to add another.
              </span>
            </div>
          )}

          {recommendedProperties.length === 0 ? (
            <div className={styles.emptyState}>
              <FiStar />
              <p>No recommended properties yet</p>
              <span>Select properties from the right panel</span>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={recommendedProperties.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className={styles.sortableList}>
                  {recommendedProperties.map((property) => (
                    <SortablePropertyItem
                      key={property.id}
                      property={property}
                      onRemove={handleRemoveRecommended}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Available Properties Section (Right) */}
        <div className={styles.availableSection}>
          <div className={styles.sectionHeader}>
            <h2>Available Properties ({availableProperties.length})</h2>
            <div className={styles.searchBox}>
              <FiSearch />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.propertyList}>
            {availableProperties.map((property) => (
              <div key={property.id} className={styles.propertyCard}>
                <div className={styles.propertyImage}>
                  <Image
                    src={property.photos[0]}
                    alt={property.title}
                    width={120}
                    height={100}
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div className={styles.propertyInfo}>
                  <h4>{property.title}</h4>
                  <p className={styles.location}>
                    {property.city}, {property.state}
                  </p>
                  <div className={styles.stats}>
                    <span>{property.bedrooms} BHK</span>
                    <span>·</span>
                    <span>
                      ₹{(property.price_per_night || 0).toLocaleString()}/night
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleRecommended(property.id, false)}
                  className={styles.addBtn}
                  disabled={!canAddMore || saving}
                  title={
                    canAddMore ? "Add to recommended" : "Maximum limit reached"
                  }
                >
                  <FiStar />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
