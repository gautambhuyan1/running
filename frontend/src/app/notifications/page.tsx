"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Bell, CheckCheck } from "lucide-react";
import { format } from "date-fns";

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    api.getNotifications().then((d) => setNotifications(d.notifications)).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    window.dispatchEvent(new CustomEvent("notificationsRead", { detail: { unreadCount: 0 } }));
  };

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(notifications.map((n) => n.id === id ? { ...n, isRead: true } : n));
    const newUnread = notifications.filter((n) => !n.isRead && n.id !== id).length;
    window.dispatchEvent(new CustomEvent("notificationsRead", { detail: { unreadCount: newUnread } }));
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10"><Card className="h-96 animate-pulse bg-gray-100" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#E84621]" />
          <h1 className="font-[family-name:var(--font-sora)] text-xl font-bold">Notifications</h1>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="ghost" size="sm" className="text-[#E84621] gap-1" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 text-[#6B6560]">No notifications yet</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 border-[#E8E4DE] cursor-pointer transition-colors ${!n.isRead ? "bg-[#FEF0EC] border-l-4 border-l-[#E84621]" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-sm">{n.title}</div>
                  <div className="text-sm text-[#6B6560] mt-1">{n.body}</div>
                </div>
                <div className="text-xs text-[#A09890] shrink-0 ml-4">
                  {format(new Date(n.createdAt), "dd MMM")}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
