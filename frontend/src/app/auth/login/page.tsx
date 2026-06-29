"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push(redirect);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md p-6 border-[#E8E4DE]">
        <div className="text-center mb-6">
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-[#6B6560] mt-1">Sign in to your MYMove account</p>
        </div>

        {/* Google OAuth Button (stub) */}
        <Button variant="outline" className="w-full gap-2 mb-4" disabled>
          <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <Separator className="flex-1" />
          <span className="text-xs text-[#A09890]">or</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full bg-[#E84621] hover:bg-[#C03518] text-white" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-4 p-3 bg-[#F4F2EE] rounded-lg">
          <p className="text-xs font-semibold text-[#6B6560] mb-2">Demo Accounts (password: password123)</p>
          <div className="space-y-1 text-xs text-[#6B6560]">
            <button className="hover:text-[#E84621] block" onClick={() => { setEmail("ananya@gmail.com"); setPassword("password123"); }}>
              Runner: ananya@gmail.com
            </button>
            <button className="hover:text-[#E84621] block" onClick={() => { setEmail("priya@mymove.in"); setPassword("password123"); }}>
              Organiser: priya@mymove.in
            </button>
            <button className="hover:text-[#E84621] block" onClick={() => { setEmail("admin@mymove.in"); setPassword("password123"); }}>
              Admin: admin@mymove.in
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B6560] mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-[#E84621] font-medium hover:underline">Sign Up</Link>
        </p>
      </Card>
    </div>
  );
}
