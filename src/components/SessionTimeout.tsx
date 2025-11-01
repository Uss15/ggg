import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Clock } from 'lucide-react';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const WARNING_DURATION = 2 * 60 * 1000; // Show warning 2 minutes before timeout

export const SessionTimeout = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Reset activity timer on user interaction
    const resetTimer = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Check session timeout
    const interval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      const remaining = TIMEOUT_DURATION - timeSinceLastActivity;

      setTimeRemaining(Math.max(0, remaining));

      // Show warning 2 minutes before timeout
      if (remaining <= WARNING_DURATION && remaining > 0) {
        setShowWarning(true);
      }

      // Timeout reached
      if (remaining <= 0) {
        handleTimeout();
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      clearInterval(interval);
    };
  }, [lastActivity]);

  const handleTimeout = async () => {
    await supabase.auth.signOut();
    toast.error('Session expired due to inactivity');
    navigate('/');
  };

  const handleExtendSession = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
    toast.success('Session extended');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Session About to Expire
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session will expire in <strong>{formatTime(timeRemaining)}</strong> due to inactivity.
            <br />
            <br />
            Would you like to continue your session?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleTimeout}>
            Logout Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleExtendSession}>
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
