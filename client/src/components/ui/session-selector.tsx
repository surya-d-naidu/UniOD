import { cn } from "@/lib/utils";
import { Sun, Moon, Calendar } from "lucide-react";

type SessionType = "FN" | "AN" | "BOTH";

interface SessionSelectorProps {
  value: SessionType;
  onChange: (value: SessionType) => void;
  className?: string;
}

export function SessionSelector({ value, onChange, className }: SessionSelectorProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <SessionOption
        id="session-fn"
        value="FN"
        selected={value === "FN"}
        label="FN"
        sublabel="(Morning)"
        icon={<Sun className="text-warning-500 h-5 w-5 mb-2" />}
        onClick={() => onChange("FN")}
      />
      
      <SessionOption
        id="session-an"
        value="AN"
        selected={value === "AN"}
        label="AN"
        sublabel="(Afternoon)"
        icon={<Moon className="text-primary h-5 w-5 mb-2" />}
        onClick={() => onChange("AN")}
      />
      
      <SessionOption
        id="session-both"
        value="BOTH"
        selected={value === "BOTH"}
        label="BOTH"
        sublabel="(Full Day)"
        icon={<Calendar className="text-muted-foreground h-5 w-5 mb-2" />}
        onClick={() => onChange("BOTH")}
      />
    </div>
  );
}

interface SessionOptionProps {
  id: string;
  value: SessionType;
  selected: boolean;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function SessionOption({ id, value, selected, label, sublabel, icon, onClick }: SessionOptionProps) {
  return (
    <div
      className={cn(
        "session-option relative border rounded-lg p-4 cursor-pointer hover:border-primary-500 hover:shadow-sm",
        selected ? "border-primary-500 shadow-sm" : "border-input"
      )}
      onClick={onClick}
    >
      <input
        type="radio"
        id={id}
        name="session"
        value={value}
        className="sr-only"
        checked={selected}
        onChange={() => {}}
      />
      <label htmlFor={id} className="flex flex-col items-center cursor-pointer">
        {icon}
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{sublabel}</span>
      </label>
      <div className={cn(
        "absolute inset-0 border-2 border-primary rounded-lg",
        selected ? "opacity-100" : "opacity-0"
      )} />
    </div>
  );
}
