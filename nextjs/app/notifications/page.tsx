"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { FiBell, FiCheck, FiCheckCircle, FiTrash2 } from "react-icons/fi";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications");
      // Backend wraps response: { success, data: { notifications: [...], total: N } }
      setNotifications(response.data.data?.notifications || []);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true })),
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return "🏠";
      case "payment":
        return "💳";
      case "refund":
        return "💰";
      case "system":
        return "⚙️";
      default:
        return "📢";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "4px solid var(--gray-200)",
                borderTopColor: "var(--primary)",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "var(--gray-600)" }}>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FiBell size={24} color="white" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "var(--gray-900)",
                  marginBottom: "4px",
                }}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p style={{ fontSize: "14px", color: "var(--gray-600)" }}>
                  {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {notifications.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              {/* Filter Buttons */}
              <button
                onClick={() => setFilter("all")}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: filter === "all" ? "white" : "var(--gray-700)",
                  background:
                    filter === "all" ? "var(--primary)" : "var(--gray-100)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: filter === "unread" ? "white" : "var(--gray-700)",
                  background:
                    filter === "unread" ? "var(--primary)" : "var(--gray-100)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Unread ({unreadCount})
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--primary)",
                    background: "transparent",
                    border: "1px solid var(--primary)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FiCheckCircle size={16} />
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "8px",
              color: "#721c24",
              marginBottom: "24px",
            }}
          >
            {error}
          </div>
        )}

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "64px 32px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                background: "var(--gray-100)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <FiBell size={40} color="var(--gray-400)" />
            </div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "var(--gray-900)",
                marginBottom: "8px",
              }}
            >
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications yet"}
            </h3>
            <p style={{ color: "var(--gray-600)" }}>
              {filter === "unread"
                ? "You're all caught up! Check back later for updates."
                : "We'll notify you when there's something new."}
            </p>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="card"
                style={{
                  padding: "20px",
                  background: notification.is_read ? "white" : "#f0f7ff",
                  borderLeft: notification.is_read
                    ? "4px solid transparent"
                    : "4px solid var(--primary)",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                onClick={() =>
                  !notification.is_read && markAsRead(notification.id)
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      fontSize: "32px",
                      flexShrink: 0,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        gap: "16px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "var(--gray-900)",
                        }}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            background: "var(--primary)",
                            borderRadius: "50%",
                            flexShrink: 0,
                            marginTop: "6px",
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "var(--gray-600)",
                        lineHeight: "1.5",
                        marginBottom: "12px",
                      }}
                    >
                      {notification.message}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--gray-500)",
                        }}
                      >
                        {formatDate(notification.created_at)}
                      </span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            style={{
                              padding: "4px 12px",
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "var(--primary)",
                              background: "transparent",
                              border: "1px solid var(--primary)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <FiCheck size={14} />
                            Mark read
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            color: "var(--gray-600)",
                            background: "transparent",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = "#dc3545";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = "var(--gray-600)";
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
