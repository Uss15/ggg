import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getUserNotifications, markNotificationAsRead, type Notification } from "@/lib/supabase-enhanced";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getUserNotifications();
      const notifications = data || [];
      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      custody_change: "🔄",
      overdue_review: "⏰",
      suspicious_event: "⚠️",
      case_update: "📋",
      general: "📢"
    };
    return icons[type] || "📢";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="px-4 py-3 border-b">
          <p className="font-semibold">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-4 cursor-pointer ${
                !notification.read ? 'bg-accent/50' : ''
              }`}
              onClick={() => handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-2 w-full">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <Badge variant="default" className="ml-2">New</Badge>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
