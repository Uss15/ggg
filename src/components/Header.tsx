import { Shield, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { hasRole } from "@/lib/supabase";

interface HeaderProps {
  userName?: string;
}

export const Header = ({ userName }: HeaderProps) => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const adminStatus = await hasRole(user.id, 'admin');
      setIsAdmin(adminStatus);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Evidence Tracking System</h1>
            <p className="text-sm text-muted-foreground">Chain of Custody Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {userName && (
            <span className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{userName}</span>
            </span>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};