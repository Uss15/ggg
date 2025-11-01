import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FolderOpen } from "lucide-react";
import { getAllCases, type Case } from "@/lib/supabase-enhanced";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";

const statusColors = {
  open: "bg-green-500",
  under_investigation: "bg-blue-500",
  closed: "bg-gray-500",
  archived: "bg-yellow-500"
};

const statusLabels = {
  open: "Open",
  under_investigation: "Under Investigation",
  closed: "Closed",
  archived: "Archived"
};

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [filteredCases, setFilteredCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    filterCases();
  }, [searchQuery, cases]);

  const loadCases = async () => {
    try {
      setIsLoading(true);
      const data = await getAllCases();
      setCases(data || []);
    } catch (error) {
      logError('LoadCases', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const filterCases = () => {
    if (!searchQuery.trim()) {
      setFilteredCases(cases);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = cases.filter(
      (c) =>
        c.case_number?.toLowerCase().includes(query) ||
        c.offense_type?.toLowerCase().includes(query) ||
        c.location?.toLowerCase().includes(query) ||
        c.offices?.city?.toLowerCase().includes(query)
    );
    setFilteredCases(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Case Management</h1>
            <p className="text-muted-foreground">
              Manage investigation cases and link evidence
            </p>
          </div>
          <Button onClick={() => navigate("/cases/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Case
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases by number, offense type, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">No cases found</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search criteria" : "Get started by creating your first case"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/cases/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Case
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((caseItem) => (
              <Card
                key={caseItem.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/cases/${caseItem.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {caseItem.case_number}
                      </CardTitle>
                      <Badge className={statusColors[caseItem.status as keyof typeof statusColors]}>
                        {statusLabels[caseItem.status as keyof typeof statusLabels]}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-semibold">Offense:</span>{" "}
                      {caseItem.offense_type}
                    </div>
                    <div>
                      <span className="font-semibold">Location:</span>{" "}
                      {caseItem.location}
                    </div>
                    {caseItem.offices && (
                      <div>
                        <span className="font-semibold">Office:</span>{" "}
                        {caseItem.offices.name} ({caseItem.offices.city})
                      </div>
                    )}
                    {caseItem.profiles && (
                      <div>
                        <span className="font-semibold">Lead Officer:</span>{" "}
                        {caseItem.profiles.full_name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-2">
                      Created {new Date(caseItem.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
