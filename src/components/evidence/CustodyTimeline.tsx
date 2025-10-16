import { Package, Truck, FileCheck, Archive, CheckCircle } from "lucide-react";

interface CustodyEntry {
  id: string;
  action: string;
  performed_by: string;
  timestamp: string;
  location: string;
  notes?: string;
  performed_by_profile?: {
    full_name: string;
    badge_number?: string;
  };
}

interface CustodyTimelineProps {
  entries: CustodyEntry[];
}

const actionIcons = {
  collected: Package,
  packed: Package,
  transferred: Truck,
  received: CheckCircle,
  analyzed: FileCheck,
  archived: Archive,
};

const actionLabels = {
  collected: "Collected",
  packed: "Packed",
  transferred: "Transferred",
  received: "Received",
  analyzed: "Analyzed",
  archived: "Archived",
};

export const CustodyTimeline = ({ entries }: CustodyTimelineProps) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No custody entries yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => {
        const Icon = actionIcons[entry.action as keyof typeof actionIcons] || Package;
        const isLast = index === entries.length - 1;

        return (
          <div key={entry.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-primary p-2">
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
              {!isLast && <div className="flex-1 w-0.5 bg-border mt-2" />}
            </div>
            <div className="flex-1 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">
                  {actionLabels[entry.action as keyof typeof actionLabels] || entry.action}
                </h4>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                By: {entry.performed_by_profile?.full_name || "Unknown"}
                {entry.performed_by_profile?.badge_number && 
                  ` (Badge: ${entry.performed_by_profile.badge_number})`
                }
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                Location: {entry.location}
              </p>
              {entry.notes && (
                <p className="text-sm mt-2">{entry.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
