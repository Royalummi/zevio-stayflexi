"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { cn } from "../../lib/utils";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 top-0 flex items-center justify-center rounded-md border border-input hover:bg-accent",
        button_next:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 top-0 flex items-center justify-center rounded-md border border-input hover:bg-accent",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
        day_button: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
          "hover:bg-accent hover:text-accent-foreground rounded-md",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
          "[&.rdp-day_range_start]:rounded-l-md [&.rdp-day_range_end]:rounded-r-md",
          "[&.rdp-day_range_middle]:rounded-none",
        ),
        range_start:
          "day-range-start [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground rounded-l-md",
        range_end:
          "day-range-end [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground rounded-r-md",
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "[&>button]:bg-accent [&>button]:text-accent-foreground",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
