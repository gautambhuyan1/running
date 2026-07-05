"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Check, ArrowLeft, ArrowRight, CreditCard, Users, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

const steps = ["Select Category", "Confirm Details", "Payment", "Confirmation"];

export default function RegisterPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/auth/login?redirect=/events/${slug}/register`);
      return;
    }
    if (slug) {
      api.getEvent(slug).then(setEvent).catch(() => {}).finally(() => setLoading(false));
    }
  }, [slug, user, authLoading, router]);

  const handleRegister = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      const reg = await api.registerForEvent(selectedCategory.id);
      setRegistration(reg);
      setStep(3);
      toast.success("Registration successful!");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-10"><Card className="h-96 animate-pulse bg-gray-100" /></div>;
  }

  if (!event) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center">Event not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Link href={`/events/${slug}`} className="text-sm text-[#6B6560] hover:text-[#E84621] flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to {event.title}
      </Link>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-[#E84621] text-white" : "bg-[#F4F2EE] text-[#6B6560]"
            }`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${i === step ? "text-[#E84621]" : "text-[#6B6560]"}`}>{s}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-[#E8E4DE]" />}
          </div>
        ))}
      </div>

      {/* Step 0: Select Category */}
      {step === 0 && (
        <Card className="p-6 border-[#E8E4DE]">
          <h2 className="font-[family-name:var(--font-sora)] font-bold text-lg mb-1">{event.title}</h2>
          <p className="text-sm text-[#6B6560] mb-4 flex items-center gap-3">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.city}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(event.eventDate), "dd MMM yyyy")}</span>
          </p>
          <Separator className="mb-4" />
          <h3 className="font-semibold text-sm mb-3">Select Your Category</h3>
          <div className="space-y-3">
            {event.categories?.map((cat: any) => (
              <div
                key={cat.id}
                onClick={() => cat.slotsRemaining > 0 && setSelectedCategory(cat)}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCategory?.id === cat.id
                    ? "border-[#E84621] bg-[#FEF0EC]"
                    : cat.slotsRemaining > 0
                    ? "border-[#E8E4DE] hover:border-[#E84621]/50"
                    : "border-[#E8E4DE] opacity-50 cursor-not-allowed"
                }`}
              >
                <div>
                  <div className="font-semibold">{cat.name}</div>
                  <div className="text-xs text-[#6B6560]">
                    <Users className="w-3 h-3 inline mr-1" />
                    {cat.slotsRemaining > 0 ? `${cat.slotsRemaining} slots remaining` : "Sold Out"}
                  </div>
                </div>
                <div className="font-bold text-lg text-[#E84621]">₹{cat.price.toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => setStep(1)}
              disabled={!selectedCategory}
              className="bg-[#E84621] hover:bg-[#C03518] text-white gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Confirm Details */}
      {step === 1 && (
        <Card className="p-6 border-[#E8E4DE]">
          <h3 className="font-[family-name:var(--font-sora)] font-bold text-lg mb-4">Confirm Your Details</h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between p-3 bg-[#F4F2EE] rounded-lg">
              <span className="text-sm text-[#6B6560]">Name</span>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between p-3 bg-[#F4F2EE] rounded-lg">
              <span className="text-sm text-[#6B6560]">Email</span>
              <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between p-3 bg-[#F4F2EE] rounded-lg">
              <span className="text-sm text-[#6B6560]">Event</span>
              <span className="text-sm font-medium">{event.title}</span>
            </div>
            <div className="flex justify-between p-3 bg-[#F4F2EE] rounded-lg">
              <span className="text-sm text-[#6B6560]">Category</span>
              <span className="text-sm font-medium">{selectedCategory?.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between p-3">
              <span className="font-semibold">Total Amount</span>
              <span className="font-bold text-lg text-[#E84621]">₹{selectedCategory?.price.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)} className="bg-[#E84621] hover:bg-[#C03518] text-white gap-2">
              Proceed to Payment <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Payment (Stub) */}
      {step === 2 && (
        <Card className="p-6 border-[#E8E4DE]">
          <h3 className="font-[family-name:var(--font-sora)] font-bold text-lg mb-4">Payment</h3>
          <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-lg p-4 mb-6 text-sm text-[#92400E]">
            <strong>Demo Mode:</strong> Payment is simulated. In production, Razorpay checkout will open here.
          </div>
          <div className="p-4 bg-[#F4F2EE] rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-5 h-5 text-[#6B6560]" />
              <span className="font-medium">Payment Summary</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>{event.title} — {selectedCategory?.name}</span>
              <span>₹{selectedCategory?.price.toLocaleString()}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-[#E84621]">₹{selectedCategory?.price.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={handleRegister}
              disabled={submitting}
              className="bg-[#E84621] hover:bg-[#C03518] text-white gap-2"
            >
              {submitting ? "Processing..." : "Pay & Register"}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && registration && (
        <Card className="p-6 border-[#E8E4DE] text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="font-[family-name:var(--font-sora)] font-bold text-xl mb-2">Registration Confirmed!</h3>
          <p className="text-[#6B6560] text-sm mb-6">You are registered for {event.title}</p>

          <div className="bg-[#F4F2EE] rounded-lg p-4 mb-6 inline-block mx-auto">
            <div className="text-xs text-[#6B6560] mb-1">Your Bib Number</div>
            <div className="font-[family-name:var(--font-sora)] text-2xl font-bold text-[#E84621]">
              {registration.bibNumber}
            </div>
          </div>

          <div className="space-y-2 text-sm text-left max-w-sm mx-auto mb-6">
            <div className="flex justify-between">
              <span className="text-[#6B6560]">Category</span>
              <span className="font-medium">{registration.category?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6560]">Amount Paid</span>
              <span className="font-medium">₹{registration.amountPaid?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B6560]">Payment Ref</span>
              <span className="font-medium text-xs">{registration.paymentRef}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/profile">
              <Button variant="outline">View My Registrations</Button>
            </Link>
            <Link href="/events">
              <Button className="bg-[#E84621] hover:bg-[#C03518] text-white">Browse More Events</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
