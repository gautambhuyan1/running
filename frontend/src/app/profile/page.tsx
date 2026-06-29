"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Calendar, Trophy, Award, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    api.getProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, [user, router]);

  const handleDownloadCert = async (regId: string) => {
    try {
      const cert = await api.getCertificate(regId);
      toast.info(`Certificate: ${cert.certificate?.certificateId} — PDF generation is stubbed`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading || !profile) {
    return <div className="max-w-5xl mx-auto px-4 py-10"><Card className="h-96 animate-pulse bg-gray-100" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <Card className="p-6 border-[#E8E4DE] mb-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-[#E84621] text-white text-xl font-bold">
              {profile.name?.split(" ").map((n: string) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-sora)] text-xl font-bold">{profile.name}</h1>
            <p className="text-sm text-[#6B6560]">{profile.email}</p>
            {profile.city && <p className="text-sm text-[#6B6560] flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {profile.city}</p>}
            {profile.bio && <p className="text-sm text-[#6B6560] mt-2">{profile.bio}</p>}
          </div>
          <Badge className={profile.role === "admin" ? "bg-red-100 text-red-700" : profile.role === "organiser" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
            {profile.role}
          </Badge>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621]">{profile.stats?.totalEvents || 0}</div>
            <div className="text-xs text-[#6B6560]">Total Events</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621]">{profile.stats?.completedEvents || 0}</div>
            <div className="text-xs text-[#6B6560]">Completed</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621]">{profile.stats?.upcomingCount || 0}</div>
            <div className="text-xs text-[#6B6560]">Upcoming</div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="registrations">
        <TabsList className="mb-4">
          <TabsTrigger value="registrations">My Registrations</TabsTrigger>
          <TabsTrigger value="pbs">Personal Bests</TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
          <div className="space-y-3">
            {profile.registrations?.length === 0 && (
              <div className="text-center py-10 text-[#6B6560]">
                <p className="mb-2">No registrations yet</p>
                <Link href="/events"><Button className="bg-[#E84621] text-white">Find Events</Button></Link>
              </div>
            )}
            {profile.registrations?.map((reg: any) => (
              <Card key={reg.id} className="p-4 border-[#E8E4DE]">
                <div className="flex items-start gap-4">
                  <div
                    className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#E84621] to-[#FF8C42] shrink-0"
                    style={reg.event?.coverImageUrl ? { backgroundImage: `url(${reg.event.coverImageUrl})`, backgroundSize: "cover" } : {}}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/events/${reg.event?.slug}`} className="font-semibold text-sm hover:text-[#E84621] truncate">
                        {reg.event?.title}
                      </Link>
                      <Badge variant="secondary" className="text-xs shrink-0">{reg.category}</Badge>
                    </div>
                    <div className="text-xs text-[#6B6560] flex items-center gap-3 mb-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {reg.event?.city}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {reg.event?.eventDate ? format(new Date(reg.event.eventDate), "dd MMM yyyy") : ""}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {reg.bibNumber && <span className="font-mono bg-[#F4F2EE] px-2 py-0.5 rounded">BIB: {reg.bibNumber}</span>}
                      <Badge className={reg.status === "confirmed" ? "bg-green-100 text-green-700" : reg.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                        {reg.status}
                      </Badge>
                    </div>
                    {reg.result && (
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {reg.result.finishTime}</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> Rank #{reg.result.overallRank}</span>
                        <Button size="sm" variant="ghost" className="h-6 text-xs text-[#E84621]" onClick={() => handleDownloadCert(reg.id)}>
                          <Download className="w-3 h-3 mr-1" /> Certificate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pbs">
          {Object.keys(profile.personalBests || {}).length === 0 ? (
            <div className="text-center py-10 text-[#6B6560]">No personal bests yet. Complete a race to see your times!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(profile.personalBests || {}).map(([distance, pb]: [string, any]) => (
                <Card key={distance} className="p-4 border-[#E8E4DE]">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-8 h-8 text-[#FF8C42]" />
                    <div>
                      <div className="font-[family-name:var(--font-sora)] font-bold text-lg">{distance}</div>
                      <div className="text-xs text-[#6B6560]">Personal Best</div>
                    </div>
                  </div>
                  <div className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621] mb-1">{pb.time}</div>
                  <div className="text-xs text-[#6B6560]">{pb.event} — {format(new Date(pb.date), "MMM yyyy")}</div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
