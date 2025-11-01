import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createCase, getAllOffices, type Office } from "@/lib/supabase-enhanced";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";

export default function CreateCase() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [formData, setFormData] = useState({
    offense_type: "",
    location: "",
    description: "",
    notes: "",
    office_id: "",
  });

  useEffect(() => {
    loadOffices();
    setCurrentUserAsLeadOfficer();
  }, []);

  const loadOffices = async () => {
    try {
      const data = await getAllOffices();
      setOffices(data || []);
    } catch (error) {
      logError('LoadOffices', error);
      toast.error("Failed to load offices");
    }
  };

  const setCurrentUserAsLeadOfficer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({ ...prev, lead_officer: user.id }));
      }
    } catch (error) {
      logError('GetCurrentUser', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.offense_type || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newCase = await createCase({
        offense_type: formData.offense_type,
        location: formData.location,
        description: formData.description || undefined,
        notes: formData.notes || undefined,
        office_id: formData.office_id || undefined,
        lead_officer: user.id,
        status: 'open'
      });

      toast.success(`Case ${newCase.case_number} created successfully`);
      navigate(`/cases/${newCase.id}`);
    } catch (error) {
      logError('CreateCase', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate("/cases")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cases
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Case</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="offense_type">
                  Offense Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="offense_type"
                  placeholder="e.g., Armed Robbery, Cybercrime, Arson"
                  value={formData.offense_type}
                  onChange={(e) =>
                    setFormData({ ...formData, offense_type: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Al-Rusafa District, Baghdad"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="office_id">Office</Label>
                <Select
                  value={formData.office_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, office_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name} - {office.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the case..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for internal use..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/cases")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Case"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
