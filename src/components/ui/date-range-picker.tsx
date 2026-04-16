import * as React from "react";
import type { DateRange as DayPickerDateRange } from "react-day-picker";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DateRange = DayPickerDateRange | undefined;

interface DateRangePickerProps {
  label?: string;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  placeholder?: string;
  clearable?: boolean;
  onClear?: () => void;
  className?: string;
}

const formatLabel = (value?: Date) => {
  if (!value) return "";
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRangeLabel = (range: DateRange, placeholder = "Select date range") => {
  if (!range || (!range.from && !range.to)) return placeholder;
  if (range.from && !range.to) return `From ${formatLabel(range.from)}`;
  if (range.from && range.to) return `${formatLabel(range.from)} — ${formatLabel(range.to)}`;
  return placeholder;
};

export function DateRangePicker({
  label,
  range,
  onRangeChange,
  placeholder = "Select date range",
  clearable = true,
  onClear,
  className,
}: DateRangePickerProps) {
  const handleSelect = (selected: any) => {
    if (!selected) {
      onRangeChange(undefined);
      return;
    }

    if (selected instanceof Date) {
      onRangeChange({ from: selected, to: selected });
      return;
    }

    onRangeChange(selected as DayPickerDateRange);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs font-semibold text-muted-foreground block">{label}</label>}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-foreground"
            >
              <span className="truncate">{formatRangeLabel(range, placeholder)}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              className="rounded-lg"
            />
            {clearable && onClear ? (
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="ghost" onClick={onClear}>
                  Clear
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
        {clearable && onClear ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
