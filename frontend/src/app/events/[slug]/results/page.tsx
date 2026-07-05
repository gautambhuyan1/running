"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { ArrowLeft, Trophy, Clock, MapPin } from "lucide-react";

export default function EventResultsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const ev = await api.getEvent(slug);
        setEvent(ev);
        const data = await api.getEventResults(ev.id);
        setResults(data.leaderboard ?? []);
        setCategories(data.categories?.map((c: any) => c.name) ?? []);
      } catch {
        setError("Results not available for this event.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const filtered = selectedCategory === "all"
    ? results
    : results.filter((r) => r.category === selectedCategory);

  const medalColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-amber-600";
    return "text-[#6B6560]";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href={`/events/${slug}`} className="flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#E84621] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </Link>

      {loading && <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}

      {!loading && error && (
        <div className="text-center py-20 text-[#6B6560]">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-[#E84621]/40" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mb-6">
            <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold">{event?.title}</h1>
            <p className="text-sm text-[#6B6560] mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {event?.city}
            </p>
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCategory === "all" ? "bg-[#E84621] text-white border-[#E84621]" : "border-[#E8E4DE] text-[#6B6560] hover:border-[#E84621]"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedCategory === cat ? "bg-[#E84621] text-white border-[#E84621]" : "border-[#E8E4DE] text-[#6B6560] hover:border-[#E84621]"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20 text-[#6B6560]">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-[#E84621]/40" />
              <p className="font-medium">No results published yet.</p>
            </div>
          ) : (
            <Card className="border-[#E8E4DE] overflow-hidden">
              <div className="grid grid-cols-[3rem_1fr_auto_auto_auto] text-xs font-semibold text-[#6B6560] uppercase tracking-wide px-4 py-3 bg-[#F9F7F5] border-b border-[#E8E4DE]">
                <span>Rank</span>
                <span>Runner</span>
                <span className="text-center hidden sm:block">Category</span>
                <span className="text-center hidden sm:block">Bib</span>
                <span className="text-right">Finish Time</span>
              </div>
              {filtered.map((r) => (
                <div key={r.id} className="grid grid-cols-[3rem_1fr_auto_auto_auto] items-center px-4 py-3 border-b border-[#F4F2EE] last:border-0 hover:bg-[#F9F7F5] transition-colors">
                  <div className={`font-bold text-lg ${medalColor(r.overallRank)}`}>
                    {r.overallRank <= 3 ? <Trophy className="w-5 h-5" /> : r.overallRank}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.runnerName}</p>
                    {r.runnerCity && <p className="text-xs text-[#6B6560] flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.runnerCity}</p>}
                  </div>
                  <Badge className="text-xs bg-[#F4F2EE] text-[#6B6560] hidden sm:flex">{r.category}</Badge>
                  <span className="text-xs text-center text-[#6B6560] hidden sm:block w-12">#{r.bibNumber}</span>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold flex items-center gap-1 justify-end"><Clock className="w-3 h-3 text-[#E84621]" />{r.finishTime}</p>
                    {r.gunTime && r.gunTime !== r.finishTime && <p className="text-xs text-[#9E9894]">Gun: {r.gunTime}</p>}
                  </div>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
