"use client";

import { AuthProvider } from "@/lib/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/sonner";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </AuthProvider>
  );
}
