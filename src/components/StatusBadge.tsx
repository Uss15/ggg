import { Badge } from "@/components/ui/badge";
import { EvidenceStatus } from "@/lib/supabase";

interface StatusBadgeProps {
  status: EvidenceStatus;
}

const statusConfig = {
  collected: {
    label: "Collected",
    className: "bg-status-collected text-white",
  },
  in_transport: {
    label: "In Transport",
    className: "bg-status-inTransport text-white",
  },
  in_lab: {
    label: "In Lab",
    className: "bg-status-inLab text-white",
  },
  analyzed: {
    label: "Analyzed",
    className: "bg-status-analyzed text-white",
  },
  archived: {
    label: "Archived",
    className: "bg-status-archived text-white",
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};