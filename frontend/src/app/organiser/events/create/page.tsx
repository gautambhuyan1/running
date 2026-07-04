"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

const CATEGORY_NAMES = ["3K", "5K", "10K", "HM", "FM", "50K", "Ultra"] as const;

type Category = { name: string; price: string; maxParticipants: string };
type Faq = { question: string; answer: string };

export default function CreateEventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    city: "",
    venue: "",
    eventDate: "",
    regDeadline: "",
    description: "",
    coverImageUrl: "",
    routeMapUrl: "",
  });

  const [categories, setCategories] = useState<Category[]>([
    { name: "10K", price: "", maxParticipants: "" },
  ]);

  const [faqs, setFaqs] = useState<Faq[]>([]);

  if (!user || (user.role !== "organiser" && user.role !== "admin")) {
    router.push("/");
    return null;
  }

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addCategory() {
    setCategories((c) => [...c, { name: "5K", price: "", maxParticipants: "" }]);
  }

  function removeCategory(i: number) {
    setCategories((c) => c.filter((_, idx) => idx !== i));
  }

  function updateCategory(i: number, key: keyof Category, value: string) {
    setCategories((c) => c.map((cat, idx) => idx === i ? { ...cat, [key]: value } : cat));
  }

  function addFaq() {
    setFaqs((f) => [...f, { question: "", answer: "" }]);
  }

  function removeFaq(i: number) {
    setFaqs((f) => f.filter((_, idx) => idx !== i));
  }

  function updateFaq(i: number, key: keyof Faq, value: string) {
    setFaqs((f) => f.map((faq, idx) => idx === i ? { ...faq, [key]: value } : faq));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (categories.length === 0) { setError("Add at least one category"); return; }
    for (const cat of categories) {
      if (!cat.price || parseFloat(cat.price) < 0) { setError("All categories need a valid price"); return; }
    }
    if (new Date(form.regDeadline) >= new Date(form.eventDate)) {
      setError("Registration deadline must be before the event date"); return;
    }

    setSubmitting(true);
    try {
      const event = await api.createEvent({
        ...form,
        coverImageUrl: form.coverImageUrl || undefined,
        routeMapUrl: form.routeMapUrl || undefined,
        categories: categories.map((c) => ({
          name: c.name,
          price: parseFloat(c.price),
          maxParticipants: c.maxParticipants ? parseInt(c.maxParticipants) : undefined,
        })),
        faqs: faqs.filter((f) => f.question && f.answer),
      });
      router.push(`/events/${event.slug}`);
    } catch (err: any) {
      setError(err.message ?? "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/organiser" className="flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#E84621] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold">Create Event</h1>
        <p className="text-sm text-[#6B6560] mt-1">Your event will be submitted for admin approval before going live.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card className="p-5 border-[#E8E4DE] space-y-4">
          <h2 className="font-[family-name:var(--font-sora)] font-semibold text-sm text-[#6B6560] uppercase tracking-wide">Basic Info</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input id="title" placeholder="e.g. Mumbai Marathon 2027" value={form.title} onChange={(e) => setField("title", e.target.value)} required minLength={3} maxLength={200} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" placeholder="e.g. Mumbai" value={form.city} onChange={(e) => setField("city", e.target.value)} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input id="venue" placeholder="e.g. Azad Maidan" value={form.venue} onChange={(e) => setField("venue", e.target.value)} required minLength={3} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" placeholder="Describe your event…" value={form.description} onChange={(e) => setField("description", e.target.value)} required minLength={10} rows={4} />
          </div>
        </Card>

        {/* Dates */}
        <Card className="p-5 border-[#E8E4DE] space-y-4">
          <h2 className="font-[family-name:var(--font-sora)] font-semibold text-sm text-[#6B6560] uppercase tracking-wide">Dates</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date *</Label>
              <Input id="eventDate" type="date" value={form.eventDate} onChange={(e) => setField("eventDate", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regDeadline">Registration Deadline *</Label>
              <Input id="regDeadline" type="date" value={form.regDeadline} onChange={(e) => setField("regDeadline", e.target.value)} required />
            </div>
          </div>
        </Card>

        {/* Images */}
        <Card className="p-5 border-[#E8E4DE] space-y-4">
          <h2 className="font-[family-name:var(--font-sora)] font-semibold text-sm text-[#6B6560] uppercase tracking-wide">Images & Links</h2>
          <div className="space-y-2">
            <Label htmlFor="coverImageUrl">Cover Image URL</Label>
            <Input id="coverImageUrl" type="url" placeholder="https://..." value={form.coverImageUrl} onChange={(e) => setField("coverImageUrl", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="routeMapUrl">Route Map URL</Label>
            <Input id="routeMapUrl" type="url" placeholder="https://maps.google.com/..." value={form.routeMapUrl} onChange={(e) => setField("routeMapUrl", e.target.value)} />
          </div>
        </Card>

        {/* Categories */}
        <Card className="p-5 border-[#E8E4DE] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-sora)] font-semibold text-sm text-[#6B6560] uppercase tracking-wide">Race Categories *</h2>
            <Button type="button" size="sm" variant="outline" onClick={addCategory} className="gap-1 text-xs">
              <Plus className="w-3 h-3" /> Add
            </Button>
          </div>

          {categories.map((cat, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Distance</Label>
                <select
                  value={cat.name}
                  onChange={(e) => updateCategory(i, "name", e.target.value)}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background outline-none focus:border-[#E84621]"
                >
                  {CATEGORY_NAMES.map((n) => <option key={n} value={n}>{n === "HM" ? "Half Marathon" : n === "FM" ? "Full Marathon" : n}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price (₹) *</Label>
                <Input type="number" min={0} placeholder="e.g. 1200" value={cat.price} onChange={(e) => updateCategory(i, "price", e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Slots</Label>
                <Input type="number" min={1} placeholder="Unlimited" value={cat.maxParticipants} onChange={(e) => updateCategory(i, "maxParticipants", e.target.value)} />
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => removeCategory(i)} disabled={categories.length === 1} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </Card>

        {/* FAQs */}
        <Card className="p-5 border-[#E8E4DE] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-sora)] font-semibold text-sm text-[#6B6560] uppercase tracking-wide">FAQs (optional)</h2>
            <Button type="button" size="sm" variant="outline" onClick={addFaq} className="gap-1 text-xs">
              <Plus className="w-3 h-3" /> Add FAQ
            </Button>
          </div>

          {faqs.length === 0 && <p className="text-xs text-[#9E9894]">No FAQs added yet.</p>}

          {faqs.map((faq, i) => (
            <div key={i} className="space-y-2 pb-4 border-b border-[#F4F2EE] last:border-0">
              <div className="flex items-center justify-between">
                <Label className="text-xs">FAQ {i + 1}</Label>
                <button type="button" onClick={() => removeFaq(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <Input placeholder="Question" value={faq.question} onChange={(e) => updateFaq(i, "question", e.target.value)} />
              <Textarea placeholder="Answer" value={faq.answer} onChange={(e) => updateFaq(i, "answer", e.target.value)} rows={2} />
            </div>
          ))}
        </Card>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting} className="bg-[#E84621] hover:bg-[#C03518] text-white px-8">
            {submitting ? "Submitting…" : "Submit for Approval"}
          </Button>
          <Link href="/organiser">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
