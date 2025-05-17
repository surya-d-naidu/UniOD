import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = "draft" | "pending" | "approved" | "rejected" | "confirmed";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants: Record<StatusType, { className: string; label: string }> = {
    draft: {
      className: "bg-neutral-100 text-neutral-800",
      label: "Draft"
    },
    pending: {
      className: "bg-primary-100 text-primary-800",
      label: "Pending"
    },
    approved: {
      className: "bg-[hsl(142,70%,90%)] text-[hsl(142,70%,30%)]",
      label: "Approved"
    },
    rejected: {
      className: "bg-[hsl(0,84%,90%)] text-[hsl(0,84%,30%)]",
      label: "Rejected"
    },
    confirmed: {
      className: "bg-[hsl(142,70%,90%)] text-[hsl(142,70%,30%)]",
      label: "Confirmed"
    }
  };

  const { className: variantClassName, label } = variants[status];

  return (
    <Badge 
      className={cn(
        "font-medium text-xs",
        variantClassName,
        className
      )}
    >
      {label}
    </Badge>
  );
}
