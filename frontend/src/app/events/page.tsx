"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { MapPin, Calendar, Star, Search, SlidersHorizontal, X } from "lucide-react";
import { format } from "date-fns";

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-center">Loading events...</div>}>
      <EventsContent />
    </Suspense>
  );
}

function EventsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    city: searchParams.get("city") || "",
    category: searchParams.get("category") || "",
    dateFrom: "",
    dateTo: "",
    page: "1",
  });

  useEffect(() => {
    api.getCities().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.city) params.city = filters.city;
    if (filters.category) params.category = filters.category;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    params.page = filters.page;

    api.getEvents(params)
      .then((data) => {
        setEvents(data.events);
        setPagination(data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const categories = ["5K", "10K", "HM", "FM", "Ultra"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center flex-1 bg-white border border-[#E8E4DE] rounded-lg px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            className="border-0 focus-visible:ring-0 shadow-none"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: "1" })}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {(filters.city || filters.category || filters.dateFrom) && (
            <Badge className="bg-[#E84621] text-white text-xs ml-1">Active</Badge>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4 mb-6 border-[#E8E4DE]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs font-medium mb-1 block">City</Label>
              <select
                className="w-full border border-[#E8E4DE] rounded-md px-3 py-2 text-sm bg-white"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value, page: "1" })}
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">Distance</Label>
              <select
                className="w-full border border-[#E8E4DE] rounded-md px-3 py-2 text-sm bg-white"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value, page: "1" })}
              >
                <option value="">All Distances</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">From Date</Label>
              <Input
                type="date"
                className="text-sm"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, page: "1" })}
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1 block">To Date</Label>
              <Input
                type="date"
                className="text-sm"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value, page: "1" })}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ search: "", city: "", category: "", dateFrom: "", dateTo: "", page: "1" })}
              className="text-[#E84621]"
            >
              <X className="w-4 h-4 mr-1" /> Clear All
            </Button>
          </div>
        </Card>
      )}

      {/* Active Filters */}
      {(filters.city || filters.category) && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {filters.city && (
            <Badge variant="secondary" className="gap-1">
              {filters.city}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, city: "", page: "1" })} />
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {filters.category}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ ...filters, category: "", page: "1" })} />
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mb-4 text-sm text-[#6B6560]">
        {pagination.total} events found
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-gray-100 border-[#E8E4DE]" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-[#6B6560]">
          <p className="text-lg font-medium mb-2">No events found</p>
          <p className="text-sm">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-[#E8E4DE] h-full">
                <div
                  className="h-40 bg-gradient-to-br from-[#E84621] to-[#FF8C42] relative"
                  style={event.coverImageUrl ? { backgroundImage: `url(${event.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {event.categories?.map((cat: any) => (
                      <span key={cat.id || cat.name} className="bg-white/90 text-[#E84621] text-xs font-semibold px-2 py-0.5 rounded-full">
                        {cat.name || cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-[family-name:var(--font-sora)] font-semibold text-sm mb-1 line-clamp-1">{event.title}</h3>
                  <div className="text-xs text-[#6B6560] mb-2 flex items-center gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.city}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(event.eventDate), "dd MMM yyyy")}</span>
                  </div>
                  <div className="text-xs text-[#A09890] mb-3 line-clamp-2">{event.description}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#E84621] text-sm font-semibold">
                      {event.minPrice > 0 ? `₹${event.minPrice.toLocaleString()} onwards` : "Free"}
                    </span>
                    <div className="flex items-center gap-2">
                      {event.avgRating > 0 && (
                        <span className="flex items-center gap-1 text-xs">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {event.avgRating}
                        </span>
                      )}
                      <Button size="sm" className="bg-[#E84621] hover:bg-[#C03518] text-white text-xs h-7 px-3">
                        Register
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => (
            <Button
              key={i}
              size="sm"
              variant={pagination.page === i + 1 ? "default" : "outline"}
              className={pagination.page === i + 1 ? "bg-[#E84621]" : ""}
              onClick={() => setFilters({ ...filters, page: String(i + 1) })}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
