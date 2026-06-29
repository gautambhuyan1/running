"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.getNotifications().then((d) => setUnreadCount(d.unreadCount)).catch(() => {});
    }
  }, [user]);

  const navLinks = [
    { href: "/events", label: "Events" },
    { href: "/calendar", label: "Calendar" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#E84621] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl text-white tracking-tight">
              MY<span className="text-[#FF8C42]">Move</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-white/10 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/notifications" className="relative text-white/80 hover:text-white p-2">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#FF8C42] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 text-white/90 hover:text-white outline-none">
                      <Avatar className="h-8 w-8 border-2 border-white/30">
                        <AvatarFallback className="bg-[#1A2B4A] text-white text-xs">
                          {user.name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden lg:block">{user.name}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem render={<Link href="/profile" />} className="flex items-center gap-2">
                      <User className="w-4 h-4" /> My Profile
                    </DropdownMenuItem>
                    {user.role === "organiser" && (
                      <DropdownMenuItem render={<Link href="/organiser" />} className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Organiser Dashboard
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem render={<Link href="/admin" />} className="flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-[#FF8C42] hover:bg-[#e67a35] text-white font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-white/80 hover:text-white text-sm font-medium px-3 py-2 rounded-md hover:bg-white/10"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" className="block text-white/80 hover:text-white text-sm font-medium px-3 py-2" onClick={() => setMobileOpen(false)}>
                  My Profile
                </Link>
                {user.role === "organiser" && (
                  <Link href="/organiser" className="block text-white/80 hover:text-white text-sm font-medium px-3 py-2" onClick={() => setMobileOpen(false)}>
                    Organiser Dashboard
                  </Link>
                )}
                <button onClick={logout} className="block text-white/80 hover:text-white text-sm font-medium px-3 py-2 w-full text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 pt-2">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm" className="border-white/30 text-white">Sign In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" className="bg-[#FF8C42] text-white">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
