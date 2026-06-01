"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Check, MessageCircle, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export type Notification = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  link: string | null;
  is_read: bool;
  created_at: string;
  metadata: any;
};

export default function NotificationTray({ 
  notifications, 
  onMarkRead, 
  onMarkAllRead 
}: { 
  notifications: Notification[], 
  onMarkRead: (id: string) => void,
  onMarkAllRead: () => void
}) {
  return (
    <div className="w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[500px]">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </h3>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 transition-colors hover:bg-muted/50 relative group ${!notif.is_read ? 'bg-primary/5' : ''}`}
              >
                <Link 
                  href={notif.link || '#'} 
                  onClick={() => !notif.is_read && onMarkRead(notif.id)}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    {notif.type === 'match' ? (
                      <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500">
                        <Heart className="w-5 h-5 fill-current" />
                      </div>
                    ) : notif.type === 'message' ? (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Bell className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground leading-tight ${!notif.is_read ? 'pr-4' : ''}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
                {!notif.is_read && (
                  <button 
                    onClick={() => onMarkRead(notif.id)}
                    className="absolute right-4 top-4 w-2 h-2 rounded-full bg-primary"
                    title="Mark as read"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/10 text-center">
          <Link href="/app/notifications" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
}
