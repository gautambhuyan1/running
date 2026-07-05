"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "runner",
    city: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        city: form.city || undefined,
      });
      toast.success("Account created successfully!");
      router.push(form.role === "organiser" ? "/organiser" : "/");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 border-[#E8E4DE]">
        <div className="text-center mb-6">
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold">Create Account</h1>
          <p className="text-sm text-[#6B6560] mt-1">Join India&apos;s running community</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "runner", label: "Runner", desc: "Find & register for events" },
            { value: "organiser", label: "Organiser", desc: "List & manage events" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setForm({ ...form, role: r.value })}
              className={`flex-1 p-3 rounded-lg border-2 text-left transition-all ${
                form.role === r.value ? "border-[#E84621] bg-[#FEF0EC]" : "border-[#E8E4DE]"
              }`}
            >
              <div className="font-semibold text-sm">{r.label}</div>
              <div className="text-xs text-[#6B6560]">{r.desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm">Full Name</Label>
            <Input id="name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm">Phone (optional)</Label>
            <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input id="city" placeholder="Mumbai, Delhi, Bangalore..." value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
          </div>

          {form.role === "organiser" && (
            <div className="p-3 bg-[#FEF3C7] rounded-lg text-sm text-[#92400E]">
              Organiser accounts require admin approval before you can list events.
            </div>
          )}

          <Button type="submit" className="w-full bg-[#E84621] hover:bg-[#C03518] text-white" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B6560] mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#E84621] font-medium hover:underline">Sign In</Link>
        </p>
      </Card>
    </div>
  );
}
