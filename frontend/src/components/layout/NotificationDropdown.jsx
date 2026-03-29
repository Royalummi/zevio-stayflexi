import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Building2,
  FileEdit,
  CreditCard,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Inbox,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import api from "../../lib/api";

// ─── Map notification titles to routes & icons ─────────────────
function getNotificationMeta(title) {
  const t = (title || "").toLowerCase();

  if (t.includes("property change request") || t.includes("change request"))
    return { icon: FileEdit, path: "/admin/change-requests", color: "text-amber-500" };
  if (t.includes("new property") || t.includes("property submission"))
    return { icon: Building2, path: "/admin/properties", color: "text-blue-500" };
  if (t.includes("property approved") || t.includes("property status"))
    return { icon: Building2, path: "/vendor/properties", color: "text-green-500" };
  if (t.includes("booking") || t.includes("cancellation"))
    return { icon: CreditCard, path: "/admin/bookings", color: "text-purple-500" };
  if (t.includes("settlement") || t.includes("refund"))
    return { icon: CreditCard, path: "/admin/settlements", color: "text-emerald-500" };
  if (t.includes("account"))
    return { icon: AlertTriangle, path: "/admin/users", color: "text-red-500" };

  return { icon: Bell, path: null, color: "text-gray-500" };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  // Fetch unread count (lightweight, polled)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.data?.unreadCount ?? 0);
    } catch {
      // Silent — don't break the UI
    }
  }, []);

  // Fetch recent notifications (when dropdown opens)
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/notifications?limit=15");
      setNotifications(res.data.data?.notifications ?? res.data.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount]);

  // Fetch when opened
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {}
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleNotificationClick = (notif) => {
    // Mark as read
    if (!notif.is_read) {
      api.put(`/notifications/${notif.id}/read`).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    // Navigate
    const meta = getNotificationMeta(notif.title);
    if (meta.path) {
      setOpen(false);
      navigate(meta.path);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-800">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 max-h-[480px] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Inbox className="h-8 w-8 mb-2" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const meta = getNotificationMeta(notif.title);
              const Icon = meta.icon;
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    isUnread
                      ? "bg-blue-50/50 dark:bg-blue-950/20"
                      : ""
                  }`}
                >
                  {/* Icon */}
                  <div className={`mt-0.5 flex-shrink-0 ${meta.color}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-tight ${isUnread ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                        {notif.title}
                      </p>
                      {isUnread && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-0.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-green-600"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
