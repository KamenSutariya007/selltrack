"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setNotifications);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    fetchNotifications();
  };

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-slate-500 text-sm">
            {notifications.filter((n) => !n.isRead).length} unread
          </p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`rounded-2xl border p-4 cursor-pointer ${
                n.isRead
                  ? "border-slate-200 bg-white"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                </div>
                {!n.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">{formatDate(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
