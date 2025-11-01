import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface OnlineUser {
  user_id: string;
  full_name: string;
  online_at: string;
}

export const UserPresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let channel: any;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Create presence channel
      channel = supabase.channel('online-users');

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: OnlineUser[] = [];

          Object.keys(state).forEach((key) => {
            const presences = state[key] as any[];
            presences.forEach((presence) => {
              if (presence.user_id !== user.id) { // Don't show current user
                users.push({
                  user_id: presence.user_id,
                  full_name: presence.full_name,
                  online_at: presence.online_at,
                });
              }
            });
          });

          setOnlineUsers(users);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track current user's presence
            await channel.track({
              user_id: user.id,
              full_name: profile?.full_name || 'User',
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  if (onlineUsers.length === 0) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative">
          <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
            <Users className="h-3 w-3" />
            <span>{onlineUsers.length + 1}</span>
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold text-sm">Online Now</h4>
            <Badge variant="secondary" className="ml-auto">
              {onlineUsers.length + 1}
            </Badge>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {/* Current user */}
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  You
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">You</p>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>

            {/* Other users */}
            {onlineUsers.map((user) => {
              const initials = user.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={user.user_id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name}</p>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
