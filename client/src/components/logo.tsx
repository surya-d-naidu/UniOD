import { cn } from "@/lib/utils";
import { School } from "lucide-react";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  withText?: boolean;
}

export function Logo({ 
  className, 
  iconClassName, 
  textClassName,
  withText = true 
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <School className={cn("text-primary h-6 w-6", iconClassName)} />
      {withText && (
        <span className={cn("ml-2 font-bold text-foreground", textClassName)}>
          Uni OD Manager
        </span>
      )}
    </div>
  );
}
