import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Package, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SearchResult {
  type: "bag" | "case" | "disposal";
  id: string;
  title: string;
  subtitle: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchTimer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search evidence bags
      const { data: bags } = await supabase
        .from("evidence_bags")
        .select("id, bag_id, description, location")
        .or(`bag_id.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
        .limit(5);

      if (bags) {
        searchResults.push(...bags.map(bag => ({
          type: "bag" as const,
          id: bag.bag_id,
          title: bag.bag_id,
          subtitle: `${bag.description} - ${bag.location}`
        })));
      }

      // Search cases
      const { data: cases } = await supabase
        .from("cases")
        .select("id, case_number, description, offense_type")
        .or(`case_number.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,offense_type.ilike.%${searchQuery}%`)
        .limit(5);

      if (cases) {
        searchResults.push(...cases.map(c => ({
          type: "case" as const,
          id: c.case_number,
          title: c.case_number,
          subtitle: `${c.offense_type} - ${c.description || "No description"}`
        })));
      }

      // Search disposal requests
      const { data: disposals } = await supabase
        .from("disposal_requests")
        .select(`
          id,
          reason,
          disposal_type,
          evidence_bags!inner(bag_id)
        `)
        .or(`reason.ilike.%${searchQuery}%`)
        .limit(5);

      if (disposals) {
        searchResults.push(...disposals.map((d: any) => ({
          type: "disposal" as const,
          id: d.id,
          title: `Disposal: ${d.evidence_bags.bag_id}`,
          subtitle: `${d.disposal_type} - ${d.reason.substring(0, 50)}...`
        })));
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onClose();
    setQuery("");
    
    switch (result.type) {
      case "bag":
        navigate(`/bag/${result.id}`);
        break;
      case "case":
        navigate(`/case/${result.id}`);
        break;
      case "disposal":
        navigate(`/disposal-requests`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "bag": return <Package className="h-4 w-4" />;
      case "case": return <FileText className="h-4 w-4" />;
      case "disposal": return <Trash2 className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0">
        <Command>
          <CommandInput 
            placeholder="Search evidence bags, cases, or disposal requests..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Searching..." : query.length < 2 ? "Type at least 2 characters to search" : "No results found"}
            </CommandEmpty>
            {results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getIcon(result.type)}
                      <div className="flex-1">
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">{result.subtitle}</div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
