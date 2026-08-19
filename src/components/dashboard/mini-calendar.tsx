"use client";

import { enUS } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";

export function MiniCalendar() {
  const today = new Date();

  return (
    <Calendar
      mode="single"
      selected={today}
      defaultMonth={today}
      locale={enUS}
      className="mx-auto w-fit p-0 [--cell-size:--spacing(9)]"
    />
  );
}
