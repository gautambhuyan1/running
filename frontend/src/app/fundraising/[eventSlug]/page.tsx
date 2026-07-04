"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Heart, Trophy, Users, IndianRupee, ArrowRight, Medal } from "lucide-react";
import { format } from "date-fns";

const BADGE_COLORS: Record<string, string> = {
  Champion: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Trailblazer: "bg-purple-100 text-purple-800 border-purple-300",
  "Change Maker": "bg-blue-100 text-blue-800 border-blue-300",
  "Rising Star": "bg-green-100 text-green-800 border-green-300",
  Starter: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function EventFundraisingPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"fundraisers" | "leaderboard">("fundraisers");

  useEffect(() => {
    async function load() {
      try {
        const event = await api.getEvent(eventSlug);
        const [c, fs] = await Promise.all([
          api.getEventCampaign(event.id),
          api.getEventFundraisers(event.id),
        ]);
        setCampaign({ ...c, event });
        setFundraisers(fs);
      } catch {
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventSlug]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[#6B6560]">Loading…</div>;
  if (!campaign) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <Heart className="w-12 h-12 mx-auto mb-3 text-[#E84621]/40" />
      <p className="font-medium text-lg">No fundraising campaign for this event.</p>
      <Link href="/fundraising" className="text-[#E84621] text-sm mt-2 inline-block hover:underline">← Back to Fund Raising</Link>
    </div>
  );

  const pct = campaign.goalAmount > 0 ? Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100)) : 0;
  const userHasFundraiser = user && fundraisers.some((f) => f.user?.id === user.id);

  return (
    <div>
      {/* Hero */}
      <div
        className="h-56 bg-gradient-to-br from-[#1A2B4A] to-[#E84621] relative"
        style={campaign.event.coverImageUrl ? { backgroundImage: `url(${campaign.event.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 max-w-5xl mx-auto">
          <Badge className="bg-[#FF8C42] text-white w-fit mb-2">Fundraising Campaign</Badge>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl md:text-3xl font-bold text-white">{campaign.event.title}</h1>
          <p className="text-white/70 text-sm mt-1">{campaign.event.city} · {format(new Date(campaign.event.eventDate), "dd MMM yyyy")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Campaign stats */}
        <Card className="p-5 mb-6 border-[#E8E4DE]">
          {campaign.description && <p className="text-sm text-[#6B6560] mb-4">{campaign.description}</p>}
          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <p className="text-xs text-[#6B6560]">Total Raised</p>
              <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621]">₹{campaign.totalRaised.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B6560]">Campaign Goal</p>
              <p className="font-[family-name:var(--font-sora)] text-2xl font-bold">₹{campaign.goalAmount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B6560]">Fundraisers</p>
              <p className="font-[family-name:var(--font-sora)] text-2xl font-bold">{fundraisers.length}</p>
            </div>
          </div>
          <div className="h-2 bg-[#F4F2EE] rounded-full overflow-hidden mb-1">
            <div className="h-full bg-[#E84621] rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-[#6B6560]">{pct}% of goal reached</p>
        </Card>

        {/* CTA */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button onClick={() => setTab("fundraisers")} className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${tab === "fundraisers" ? "bg-[#E84621] text-white" : "text-[#6B6560] hover:bg-[#F4F2EE]"}`}>
              <Users className="w-4 h-4 inline mr-1" /> Fundraisers
            </button>
            <button onClick={() => setTab("leaderboard")} className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${tab === "leaderboard" ? "bg-[#E84621] text-white" : "text-[#6B6560] hover:bg-[#F4F2EE]"}`}>
              <Trophy className="w-4 h-4 inline mr-1" /> Leaderboard
            </button>
          </div>
          {!userHasFundraiser && (
            <Link href={`/fundraising/${eventSlug}/start`}>
              <Button className="bg-[#E84621] hover:bg-[#C03518] text-white gap-2">
                <Heart className="w-4 h-4" /> Start Fundraising
              </Button>
            </Link>
          )}
          {userHasFundraiser && (
            <Badge className="bg-green-100 text-green-700 border-green-300">You have a fundraiser ✓</Badge>
          )}
        </div>

        {/* Fundraisers grid */}
        {tab === "fundraisers" && (
          fundraisers.length === 0 ? (
            <div className="text-center py-16 text-[#6B6560]">
              <Heart className="w-10 h-10 mx-auto mb-3 text-[#E84621]/30" />
              <p className="font-medium">No fundraisers yet. Be the first!</p>
              {user && (
                <Link href={`/fundraising/${eventSlug}/start`}>
                  <Button className="mt-4 bg-[#E84621] text-white">Start Fundraising</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fundraisers.map((f) => {
                const fpct = f.goalAmount > 0 ? Math.min(100, Math.round((f.totalRaised / f.goalAmount) * 100)) : 0;
                return (
                  <Link key={f.id} href={`/fundraising/${eventSlug}/${f.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-[#E8E4DE] h-full flex flex-col">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#FEF0EC] flex items-center justify-center text-sm font-bold text-[#E84621] flex-shrink-0">
                          {f.user?.name?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm line-clamp-1">{f.title}</p>
                          <p className="text-xs text-[#6B6560]">{f.user?.name} · {f.user?.city}</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#6B6560] line-clamp-2 mb-3 flex-1">{f.story}</p>
                      <div className="text-xs text-[#6B6560] mb-2 italic">For: {f.ngo?.name}</div>
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[#E84621]">₹{f.totalRaised.toLocaleString("en-IN")}</span>
                          <span>{fpct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#F4F2EE] rounded-full overflow-hidden">
                          <div className="h-full bg-[#E84621] rounded-full" style={{ width: `${fpct}%` }} />
                        </div>
                        <p className="text-xs text-[#6B6560] mt-1">of ₹{f.goalAmount.toLocaleString("en-IN")}</p>
                      </div>
                      <Badge className={`text-xs w-fit border ${BADGE_COLORS[f.badge] ?? BADGE_COLORS["Starter"]}`}>{f.badge}</Badge>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )
        )}

        {/* Leaderboard */}
        {tab === "leaderboard" && (
          <div className="space-y-3">
            {fundraisers.length === 0 ? (
              <div className="text-center py-16 text-[#6B6560]"><Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No fundraisers yet.</p></div>
            ) : (
              fundraisers.map((f, i) => {
                const fpct = f.goalAmount > 0 ? Math.min(100, Math.round((f.totalRaised / f.goalAmount) * 100)) : 0;
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <Link key={f.id} href={`/fundraising/${eventSlug}/${f.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-[#E8E4DE] flex items-center gap-4">
                      <span className="text-2xl w-8 text-center">{medals[i] ?? `#${i + 1}`}</span>
                      <div className="w-10 h-10 rounded-full bg-[#FEF0EC] flex items-center justify-center text-sm font-bold text-[#E84621] flex-shrink-0">
                        {f.user?.name?.[0] ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm truncate">{f.user?.name}</p>
                          <Badge className={`text-xs border ${BADGE_COLORS[f.badge] ?? BADGE_COLORS["Starter"]}`}>{f.badge}</Badge>
                        </div>
                        <p className="text-xs text-[#6B6560] truncate">{f.title}</p>
                        <div className="mt-1 h-1.5 bg-[#F4F2EE] rounded-full overflow-hidden w-40">
                          <div className="h-full bg-[#E84621] rounded-full" style={{ width: `${fpct}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-[#E84621]">₹{f.totalRaised.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-[#6B6560]">of ₹{f.goalAmount.toLocaleString("en-IN")}</p>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
