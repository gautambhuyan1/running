"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { Heart, ArrowLeft, IndianRupee, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const BADGE_COLORS: Record<string, string> = {
  Champion: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Trailblazer: "bg-purple-100 text-purple-800 border-purple-300",
  "Change Maker": "bg-blue-100 text-blue-800 border-blue-300",
  "Rising Star": "bg-green-100 text-green-800 border-green-300",
  Starter: "bg-gray-100 text-gray-700 border-gray-300",
};

declare global {
  interface Window { Razorpay: any; }
}

export default function FundraiserPage() {
  const { eventSlug, fundraiserId } = useParams<{ eventSlug: string; fundraiserId: string }>();
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", donorName: "", donorEmail: "", message: "", isAnonymous: false });

  async function load() {
    try {
      const f = await api.getFundraiser(fundraiserId);
      setFundraiser(f);
    } catch {
      setFundraiser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [fundraiserId]);

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amount = parseFloat(form.amount);
    if (!amount || amount < 100) { setError("Minimum donation is ₹100"); return; }

    setDonating(true);
    try {
      const order = await api.createDonationOrder(fundraiserId, {
        amount,
        donorName: form.donorName,
        donorEmail: form.donorEmail,
        message: form.message || undefined,
        isAnonymous: form.isAnonymous,
      });

      if (order.isStub) {
        // Dev stub: skip payment UI, verify directly
        await api.verifyDonation(fundraiserId, {
          donationId: order.donationId,
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `stub_pay_${order.donationId}`,
          isStub: true,
        });
        setSuccess(true);
        setShowForm(false);
        await load();
        return;
      }

      // Load Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        if (window.Razorpay) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.body.appendChild(script);
      });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "MYMove Fund Raising",
        description: `Donation to: ${fundraiser.title}`,
        order_id: order.orderId,
        prefill: { name: form.donorName, email: form.donorEmail },
        theme: { color: "#E84621" },
        handler: async (response: any) => {
          try {
            await api.verifyDonation(fundraiserId, {
              donationId: order.donationId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isStub: false,
            });
            setSuccess(true);
            setShowForm(false);
            await load();
          } catch {
            setError("Payment verified failed. Please contact support.");
          }
        },
        modal: { ondismiss: () => setDonating(false) },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
      setDonating(false);
    } finally {
      setDonating(false);
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-[#6B6560]">Loading…</div>;
  if (!fundraiser) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="font-medium text-lg">Fundraiser not found.</p>
      <Link href={`/fundraising/${eventSlug}`} className="text-[#E84621] text-sm mt-2 inline-block hover:underline">← Back</Link>
    </div>
  );

  const pct = fundraiser.goalAmount > 0 ? Math.min(100, Math.round((fundraiser.totalRaised / fundraiser.goalAmount) * 100)) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/fundraising/${eventSlug}`} className="flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#E84621] mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to {fundraiser.campaign?.event?.title}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-5">
          {fundraiser.imageUrl && (
            <img src={fundraiser.imageUrl} alt={fundraiser.title} className="w-full h-48 object-cover rounded-xl" />
          )}

          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`text-xs border ${BADGE_COLORS[fundraiser.badge] ?? BADGE_COLORS["Starter"]}`}>{fundraiser.badge}</Badge>
              <Badge variant="outline" className="text-xs">For: {fundraiser.ngo?.name}</Badge>
            </div>
            <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold mb-2">{fundraiser.title}</h1>
            <div className="flex items-center gap-2 text-sm text-[#6B6560] mb-4">
              <div className="w-7 h-7 rounded-full bg-[#FEF0EC] flex items-center justify-center text-xs font-bold text-[#E84621]">
                {fundraiser.user?.name?.[0]}
              </div>
              {fundraiser.user?.name} · {fundraiser.user?.city}
            </div>
            <p className="text-sm text-[#3D3936] leading-relaxed whitespace-pre-line">{fundraiser.story}</p>
          </div>

          {fundraiser.ngo?.website && (
            <a href={fundraiser.ngo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#E84621] hover:underline">
              <ExternalLink className="w-3 h-3" /> Learn more about {fundraiser.ngo.name}
            </a>
          )}

          {/* Donations list */}
          {fundraiser.donations?.length > 0 && (
            <div>
              <h2 className="font-[family-name:var(--font-sora)] font-semibold text-sm mb-3">Recent Donations ({fundraiser.donations.length})</h2>
              <div className="space-y-2">
                {fundraiser.donations.map((d: any) => (
                  <div key={d.id} className="flex items-start gap-3 p-3 bg-[#F9F7F4] rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-[#FEF0EC] flex items-center justify-center text-xs font-bold text-[#E84621] flex-shrink-0">
                      {d.donorName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">{d.donorName}</p>
                        <p className="text-sm font-bold text-[#E84621]">₹{d.amount.toLocaleString("en-IN")}</p>
                      </div>
                      {d.message && <p className="text-xs text-[#6B6560] mt-0.5 italic">"{d.message}"</p>}
                      <p className="text-xs text-[#9E9894] mt-0.5">{format(new Date(d.createdAt), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: progress + donate */}
        <div className="space-y-4">
          <Card className="p-4 border-[#E8E4DE] sticky top-20">
            <p className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621]">₹{fundraiser.totalRaised.toLocaleString("en-IN")}</p>
            <p className="text-xs text-[#6B6560] mb-3">raised of ₹{fundraiser.goalAmount.toLocaleString("en-IN")} goal</p>
            <div className="h-2 bg-[#F4F2EE] rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[#E84621] rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-[#6B6560] mb-4">{pct}% funded · {fundraiser.donations?.length ?? 0} donors</p>

            {success && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-3 text-center">
                🎉 Thank you for your donation!
              </div>
            )}

            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full bg-[#E84621] hover:bg-[#C03518] text-white gap-2">
                <Heart className="w-4 h-4" /> Donate Now
              </Button>
            ) : (
              <form onSubmit={handleDonate} className="space-y-3">
                <div>
                  <Label className="text-xs">Amount (₹) *</Label>
                  <Input type="number" min={100} placeholder="e.g. 500" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Your Name *</Label>
                  <Input placeholder="Full name" value={form.donorName} onChange={(e) => setForm((f) => ({ ...f, donorName: e.target.value }))} required className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" placeholder="you@email.com" value={form.donorEmail} onChange={(e) => setForm((f) => ({ ...f, donorEmail: e.target.value }))} required className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Message (optional)</Label>
                  <Textarea placeholder="A word of encouragement…" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={2} className="mt-1 text-xs" />
                </div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.isAnonymous} onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))} className="accent-[#E84621]" />
                  Donate anonymously
                </label>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" disabled={donating} className="w-full bg-[#E84621] hover:bg-[#C03518] text-white text-sm">
                  {donating ? "Processing…" : "Pay with Razorpay"}
                </Button>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }} className="w-full text-xs text-[#6B6560] hover:underline">Cancel</button>
              </form>
            )}
          </Card>

          {/* Quick donate amounts */}
          {!showForm && (
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000].map((amt) => (
                <button key={amt} onClick={() => { setForm((f) => ({ ...f, amount: String(amt) })); setShowForm(true); }} className="text-xs px-3 py-1.5 rounded-full border border-[#E84621] text-[#E84621] hover:bg-[#FEF0EC] transition-colors">
                  ₹{amt.toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
