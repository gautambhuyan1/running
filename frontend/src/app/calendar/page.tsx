"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

const categoryColors: Record<string, string> = {
  "5K": "bg-[#FEF0EC] text-[#E84621]",
  "10K": "bg-blue-50 text-blue-700",
  HM: "bg-yellow-50 text-yellow-700",
  FM: "bg-purple-50 text-purple-700",
  Ultra: "bg-green-50 text-green-700",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    api.getEvents({
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      limit: "50",
      status: "live",
    })
      .then((data) => setEvents(data.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const eventsOnDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.eventDate), day));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold mb-6">Race Calendar</h1>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="font-[family-name:var(--font-sora)] font-semibold text-lg">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="border-[#E8E4DE] overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-[#1A2B4A] text-white text-xs font-semibold text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] bg-[#F4F2EE] border-b border-r border-[#E8E4DE]" />
          ))}

          {days.map((day) => {
            const dayEvents = eventsOnDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[80px] p-1 border-b border-r border-[#E8E4DE] ${
                  isToday ? "bg-[#FEF0EC]" : "bg-white"
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? "text-[#E84621] font-bold" : "text-[#6B6560]"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 2).map((event) => (
                    <Link key={event.id} href={`/events/${event.slug}`}>
                      <div className="text-[10px] leading-tight bg-[#E84621] text-white px-1 py-0.5 rounded truncate hover:bg-[#C03518] cursor-pointer">
                        {event.title}
                      </div>
                    </Link>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-[#6B6560]">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Event List for this month */}
      <h3 className="font-[family-name:var(--font-sora)] font-semibold text-lg mt-8 mb-4">
        Events in {format(currentMonth, "MMMM yyyy")}
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-[#6B6560]">No events this month.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="p-3 border-[#E8E4DE] hover:shadow-md transition-shadow flex items-center gap-4">
                <div className="text-center min-w-[50px]">
                  <div className="text-xs text-[#6B6560]">{format(new Date(event.eventDate), "MMM")}</div>
                  <div className="font-[family-name:var(--font-sora)] text-xl font-bold text-[#E84621]">
                    {format(new Date(event.eventDate), "dd")}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{event.title}</div>
                  <div className="text-xs text-[#6B6560] flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {event.city}
                  </div>
                </div>
                <div className="flex gap-1">
                  {event.categories?.map((cat: any) => (
                    <Badge key={cat.id || cat.name} className={`text-xs ${categoryColors[cat.name || cat] || "bg-gray-100 text-gray-700"}`}>
                      {cat.name || cat}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
