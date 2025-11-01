import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import { getAllTags, createTag } from "@/lib/supabase-enhanced";
import { toast } from "sonner";
import { logError, sanitizeError } from "@/lib/errors";

export function TagManager() {
  const [tags, setTags] = useState<any[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      const data = await getAllTags();
      setTags(data || []);
    } catch (error) {
      logError('LoadTags', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    try {
      setIsCreating(true);
      await createTag(newTagName.trim());
      toast.success(`Tag "${newTagName}" created`);
      setNewTagName("");
      loadTags();
    } catch (error) {
      logError('CreateTag', error);
      toast.error(sanitizeError(error));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TagIcon className="h-5 w-5" />
          Tag Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New tag name (e.g., Arson, DNA, Cybercrime)"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
          />
          <Button onClick={handleCreateTag} disabled={isCreating || !newTagName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading tags...</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tags yet. Create your first tag above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="px-3 py-1 text-sm"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>Tags can be used to categorize cases and evidence for easier searching and organization.</p>
        </div>
      </CardContent>
    </Card>
  );
}