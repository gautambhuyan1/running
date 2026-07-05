"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Calendar, Users, IndianRupee, TrendingUp, Plus, Eye, Heart } from "lucide-react";
import { format } from "date-fns";

export default function OrganiserDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Record<string, any>>({});
  const [campaignForm, setCampaignForm] = useState<Record<string, { goalAmount: string; description: string }>>({});
  const [campaignSaving, setCampaignSaving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "organiser" && user.role !== "admin")) {
      router.push("/"); return;
    }
    api.getOrganiserDashboard().then((d) => {
      setDashboard(d);
      const campaignMap: Record<string, any> = {};
      (d.events ?? []).forEach((ev: any) => { campaignMap[ev.id] = ev.campaign ?? null; });
      setCampaigns(campaignMap);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending: "bg-yellow-100 text-yellow-700",
    live: "bg-green-100 text-green-700",
    completed: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold">Organiser Dashboard</h1>
          <p className="text-sm text-[#6B6560]">Welcome back, {user?.name}</p>
        </div>
        <Link href="/organiser/events/create">
          <Button className="bg-[#E84621] hover:bg-[#C03518] text-white gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </Button>
        </Link>
      </div>

      {loading && <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}

      {!loading && dashboard && <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Events", value: dashboard.totalEvents, icon: <Calendar className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
          { label: "Live Events", value: dashboard.liveEvents, icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
          { label: "Total Registrations", value: dashboard.totalRegistrations, icon: <Users className="w-5 h-5" />, color: "text-purple-600 bg-purple-50" },
          { label: "Total Revenue", value: `₹${(dashboard.totalRevenue || 0).toLocaleString()}`, icon: <IndianRupee className="w-5 h-5" />, color: "text-[#E84621] bg-[#FEF0EC]" },
        ].map((stat, i) => (
          <Card key={i} className="p-4 border-[#E8E4DE]">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="font-[family-name:var(--font-sora)] text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[#6B6560]">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Events List */}
      <h2 className="font-[family-name:var(--font-sora)] font-semibold text-lg mb-4">My Events</h2>
      <div className="space-y-3">
        {dashboard.events?.map((event: any) => (
          <Card key={event.id} className="p-4 border-[#E8E4DE]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{event.title}</span>
                  <Badge className={statusColors[event.status] || ""}>{event.status}</Badge>
                </div>
                <div className="text-xs text-[#6B6560] flex items-center gap-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(event.eventDate), "dd MMM yyyy")}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.registrations} registrations</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/events/${event.slug}`}>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Eye className="w-3 h-3" /> View
                  </Button>
                </Link>
              </div>
            </div>

            {/* Fundraising toggle */}
            {event.status === "live" && (
              <div className="mt-3 pt-3 border-t border-[#F4F2EE]">
                {campaigns[event.id] ? (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#6B6560] flex items-center gap-2">
                      <Heart className="w-3.5 h-3.5 text-[#E84621]" />
                      <span>Fundraising active · Goal: ₹{campaigns[event.id].goalAmount.toLocaleString()} · Raised: ₹{(campaigns[event.id].totalRaised ?? 0).toLocaleString()}</span>
                    </div>
                    <Link href={`/fundraising/${event.slug}`}>
                      <Button size="sm" variant="outline" className="text-xs gap-1 h-7">
                        <Eye className="w-3 h-3" /> View Campaign
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-[#6B6560] flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> Enable fundraising for this event</p>
                    <div className="flex gap-2 flex-wrap">
                      <input
                        type="number"
                        min={1000}
                        placeholder="Campaign goal (₹)"
                        className="text-xs border border-[#E8E4DE] rounded-md px-2 py-1 w-40 outline-none focus:border-[#E84621]"
                        value={campaignForm[event.id]?.goalAmount ?? ""}
                        onChange={(e) => setCampaignForm((f) => ({ ...f, [event.id]: { ...f[event.id], goalAmount: e.target.value } }))}
                      />
                      <Button
                        size="sm"
                        className="bg-[#E84621] text-white text-xs h-7 gap-1"
                        disabled={campaignSaving === event.id}
                        onClick={async () => {
                          const goal = parseFloat(campaignForm[event.id]?.goalAmount ?? "0");
                          if (!goal || goal < 1000) return;
                          setCampaignSaving(event.id);
                          try {
                            const c = await api.createCampaign(event.id, { goalAmount: goal, description: campaignForm[event.id]?.description });
                            setCampaigns((prev) => ({ ...prev, [event.id]: c }));
                          } catch { /* ignore */ } finally { setCampaignSaving(null); }
                        }}
                      >
                        <Heart className="w-3 h-3" /> {campaignSaving === event.id ? "Saving…" : "Enable Fundraising"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
      </>}
    </div>
  );
}
