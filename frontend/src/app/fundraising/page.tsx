"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { MapPin, Calendar, Heart, Users, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function FundraisingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const eventsRes = await api.getEvents({ status: "live", limit: "50" });
        const events = eventsRes.events ?? eventsRes;
        const results = await Promise.allSettled(
          events.map((e: any) => api.getEventCampaign(e.id).then((c) => ({ ...c, event: e })))
        );
        const active = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
          .map((r) => r.value)
          .filter((c) => c.isActive);
        setCampaigns(active);
      } catch {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1A2B4A] via-[#1A3A6A] to-[#E84621] py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/15 text-white/90 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Run for a cause
          </span>
          <h1 className="font-[family-name:var(--font-sora)] text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
            Fund <span className="text-[#FF8C42]">Raising</span>
          </h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto">
            Turn your kilometres into change. Create a fundraiser for your race and rally your supporters for a cause you believe in.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-10 px-4 border-b border-[#E8E4DE]">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { icon: "🏃", step: "1", title: "Pick your race", desc: "Choose a live event that has fundraising enabled by the organiser" },
            { icon: "❤️", step: "2", title: "Create your page", desc: "Pick an NGO, write your story, set a goal, and publish" },
            { icon: "💰", step: "3", title: "Collect donations", desc: "Share your page and receive donations via Razorpay" },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="font-[family-name:var(--font-sora)] font-semibold text-sm">{s.title}</h3>
              <p className="text-xs text-[#6B6560]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active campaigns */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="font-[family-name:var(--font-sora)] text-xl font-bold mb-6">Active Campaigns</h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 text-[#6B6560]">
            <Heart className="w-12 h-12 mx-auto mb-3 text-[#E84621]/40" />
            <p className="font-medium">No active fundraising campaigns yet.</p>
            <p className="text-sm mt-1">Organisers can enable fundraising for their events from the dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((campaign) => {
              const pct = campaign.goalAmount > 0 ? Math.min(100, Math.round((campaign.totalRaised / campaign.goalAmount) * 100)) : 0;
              return (
                <Link key={campaign.id} href={`/fundraising/${campaign.event.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-[#E8E4DE] group">
                    <div
                      className="h-36 bg-gradient-to-br from-[#1A2B4A] to-[#E84621] relative"
                      style={campaign.event.coverImageUrl ? { backgroundImage: `url(${campaign.event.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                    >
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-[#FF8C42] text-white text-xs">Active Campaign</Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-[family-name:var(--font-sora)] font-semibold text-sm mb-1 line-clamp-1">{campaign.event.title}</h3>
                      <div className="text-xs text-[#6B6560] flex items-center gap-3 mb-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {campaign.event.city}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(campaign.event.eventDate), "dd MMM yyyy")}</span>
                      </div>

                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="flex items-center gap-1 font-medium text-[#E84621]"><IndianRupee className="w-3 h-3" />{campaign.totalRaised.toLocaleString("en-IN")} raised</span>
                          <span className="text-[#6B6560]">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#F4F2EE] rounded-full overflow-hidden">
                          <div className="h-full bg-[#E84621] rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-[#6B6560] mt-1">of ₹{campaign.goalAmount.toLocaleString("en-IN")} goal</p>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-[#6B6560]">
                        <Users className="w-3 h-3" /> {campaign._count?.fundraisers ?? 0} fundraisers
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
