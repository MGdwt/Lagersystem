"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PEOPLE, type Person } from "@/lib/scanner-types";

interface OperatorSelectorProps {
  operator: string;
  onOperatorChange: (operator: string) => void;
}

export function OperatorSelector({
  operator,
  onOperatorChange,
}: OperatorSelectorProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">Wer bucht?</div>
      <Select value={operator} onValueChange={onOperatorChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Name auswählen" />
        </SelectTrigger>
        <SelectContent>
          {PEOPLE.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
