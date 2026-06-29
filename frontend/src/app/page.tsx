"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { MapPin, Calendar, Star, Search, ArrowRight, Trophy, Camera, Award } from "lucide-react";
import { format } from "date-fns";

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getFeaturedEvents().then(setFeatured).catch(() => {});
    api.getCities().then(setCities).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#E84621] via-[#C03518] to-[#1A2B4A] py-16 px-4 relative overflow-hidden">
        <div className="absolute right-[-60px] top-[-60px] w-[380px] h-[380px] bg-[#FF8C42]/10 rounded-full" />
        <div className="max-w-5xl mx-auto relative">
          <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            India&apos;s Running Community
          </span>
          <h1 className="font-[family-name:var(--font-sora)] text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
            Find Your Next <span className="text-[#FF8C42]">Race</span>
          </h1>
          <p className="text-white/75 text-lg max-w-lg mb-8">
            Discover running events across India. From 5K fun runs to ultra marathons — register, track results, and celebrate your achievements.
          </p>

          {/* Search Bar */}
          <div className="bg-white/95 rounded-xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl shadow-lg">
            <div className="flex items-center flex-1 px-3 gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, cities..."
                className="flex-1 outline-none text-sm py-2 bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Link href={search ? `/events?search=${encodeURIComponent(search)}` : "/events"}>
              <Button className="bg-[#E84621] hover:bg-[#C03518] text-white w-full sm:w-auto px-6">
                Search Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Distance Filter Chips */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap">
          {["All Events", "5K", "10K", "HM", "FM", "Ultra"].map((cat) => (
            <Link key={cat} href={cat === "All Events" ? "/events" : `/events?category=${cat}`}>
              <Badge
                variant={cat === "All Events" ? "default" : "secondary"}
                className={`px-4 py-1.5 text-sm cursor-pointer transition-colors ${
                  cat === "All Events"
                    ? "bg-[#E84621] hover:bg-[#C03518] text-white"
                    : "bg-[#F4F2EE] hover:bg-[#E8E4DE] text-[#6B6560]"
                }`}
              >
                {cat === "HM" ? "Half Marathon" : cat === "FM" ? "Full Marathon" : cat}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-[family-name:var(--font-sora)] text-xl font-bold">Featured Events</h2>
          <Link href="/events" className="text-[#E84621] text-sm font-medium flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-[#E8E4DE]">
                <div
                  className="h-40 bg-gradient-to-br from-[#E84621] to-[#FF8C42] relative"
                  style={event.coverImageUrl ? { backgroundImage: `url(${event.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                >
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {event.categories?.map((cat: string) => (
                      <span key={cat} className="bg-white/90 text-[#E84621] text-xs font-semibold px-2 py-0.5 rounded-full">
                        {cat}
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
                  <div className="flex items-center justify-between">
                    <span className="text-[#E84621] text-sm font-semibold">
                      {event.minPrice > 0 ? `₹${event.minPrice.toLocaleString()} onwards` : "Free"}
                    </span>
                    {event.avgRating > 0 && (
                      <span className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {event.avgRating}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by City */}
      {cities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <h2 className="font-[family-name:var(--font-sora)] text-xl font-bold mb-6">Browse by City</h2>
          <div className="flex flex-wrap gap-3">
            {cities.map((city) => (
              <Link key={city} href={`/events?city=${encodeURIComponent(city)}`}>
                <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-[#E84621] hover:text-white hover:border-[#E84621] transition-colors">
                  <MapPin className="w-3 h-3 mr-1" /> {city}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-[family-name:var(--font-sora)] text-xl font-bold mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: <Search className="w-6 h-6" />, title: "Discover", desc: "Find running events near you filtered by city, distance, and date" },
              { icon: <Trophy className="w-6 h-6" />, title: "Register", desc: "Choose your category, fill details, and pay securely via Razorpay" },
              { icon: <Camera className="w-6 h-6" />, title: "Race Day", desc: "Get your bib, run your race, and have your photos captured" },
              { icon: <Award className="w-6 h-6" />, title: "Celebrate", desc: "View results, download certificates, and share your achievement" },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#FEF0EC] text-[#E84621] flex items-center justify-center mx-auto mb-3">
                  {step.icon}
                </div>
                <h3 className="font-[family-name:var(--font-sora)] font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-[#6B6560]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
