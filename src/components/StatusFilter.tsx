import { Button } from "@/components/ui/button";
import { EvidenceStatus } from "@/lib/supabase";

interface StatusFilterProps {
  activeStatus: EvidenceStatus | "all";
  onStatusChange: (status: EvidenceStatus | "all") => void;
  counts: Record<EvidenceStatus | "all", number>;
}

export function StatusFilter({ activeStatus, onStatusChange, counts }: StatusFilterProps) {
  const statuses: Array<{ value: EvidenceStatus | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "collected", label: "Collected" },
    { value: "in_transport", label: "In Transport" },
    { value: "in_lab", label: "In Lab" },
    { value: "analyzed", label: "Analyzed" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Button
          key={status.value}
          variant={activeStatus === status.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(status.value)}
          className="relative"
        >
          {status.label}
          <span className="ml-2 text-xs opacity-70">
            ({counts[status.value] || 0})
          </span>
        </Button>
      ))}
    </div>
  );
}
