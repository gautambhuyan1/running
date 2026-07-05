"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Heart, ArrowLeft } from "lucide-react";

export default function StartFundraiserPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [ngos, setNgos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    ngoId: "",
    title: "",
    story: "",
    goalAmount: "",
    imageUrl: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    async function load() {
      try {
        const ev = await api.getEvent(eventSlug);
        setEvent(ev);
        const [c, ngoList] = await Promise.all([api.getEventCampaign(ev.id), api.getNgos()]);
        setCampaign(c);
        setNgos(ngoList);
      } catch {
        router.push(`/fundraising/${eventSlug}`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, authLoading, eventSlug, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.ngoId) { setError("Please select an NGO"); return; }
    const goal = parseFloat(form.goalAmount);
    if (!goal || goal < 1000) { setError("Goal must be at least ₹1,000"); return; }
    if (form.story.length < 20) { setError("Please write a longer story (min 20 characters)"); return; }

    setSubmitting(true);
    try {
      const fundraiser = await api.createFundraiser(event.id, {
        ngoId: form.ngoId,
        title: form.title,
        story: form.story,
        goalAmount: goal,
        imageUrl: form.imageUrl || undefined,
      });
      router.push(`/fundraising/${eventSlug}/${fundraiser.id}`);
    } catch (err: any) {
      setError(err.message ?? "Failed to create fundraiser");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="max-w-xl mx-auto px-4 py-20 text-center text-[#6B6560]">Loading…</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/fundraising/${eventSlug}`} className="flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#E84621] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to {event?.title}
      </Link>

      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold mb-1">Start Fundraising</h1>
        <p className="text-sm text-[#6B6560]">Create your personal fundraising page for <span className="font-medium text-black">{event?.title}</span></p>
      </div>

      <Card className="p-6 border-[#E8E4DE]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NGO selection */}
          <div className="space-y-2">
            <Label>Choose an NGO to support *</Label>
            <div className="grid grid-cols-1 gap-2">
              {ngos.map((ngo) => (
                <label
                  key={ngo.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.ngoId === ngo.id ? "border-[#E84621] bg-[#FEF0EC]" : "border-[#E8E4DE] hover:border-[#E84621]/50"
                  }`}
                >
                  <input type="radio" name="ngo" value={ngo.id} checked={form.ngoId === ngo.id} onChange={() => setForm((f) => ({ ...f, ngoId: ngo.id }))} className="mt-1 accent-[#E84621]" />
                  <div>
                    <p className="font-medium text-sm">{ngo.name}</p>
                    <p className="text-xs text-[#6B6560]">{ngo.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Fundraiser Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Running 21km for education"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              minLength={5}
              maxLength={120}
            />
          </div>

          {/* Story */}
          <div className="space-y-2">
            <Label htmlFor="story">Your Story *</Label>
            <Textarea
              id="story"
              placeholder="Tell donors why you're running for this cause…"
              value={form.story}
              onChange={(e) => setForm((f) => ({ ...f, story: e.target.value }))}
              required
              minLength={20}
              rows={5}
            />
          </div>

          {/* Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal">Fundraising Goal (₹) *</Label>
            <Input
              id="goal"
              type="number"
              placeholder="e.g. 25000"
              min={1000}
              value={form.goalAmount}
              onChange={(e) => setForm((f) => ({ ...f, goalAmount: e.target.value }))}
              required
            />
            <p className="text-xs text-[#6B6560]">Minimum ₹1,000</p>
          </div>

          {/* Image URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Cover Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full bg-[#E84621] hover:bg-[#C03518] text-white gap-2">
            <Heart className="w-4 h-4" />
            {submitting ? "Creating…" : "Publish My Fundraiser"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
