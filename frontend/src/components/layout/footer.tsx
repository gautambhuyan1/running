import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1A2B4A] text-white/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="font-bold text-xl text-white mb-3">
              MY<span className="text-[#FF8C42]">Move</span>
            </div>
            <p className="text-sm">
              India&apos;s running event discovery, registration &amp; ticketing platform.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Explore</h4>
            <div className="space-y-2 text-sm">
              <Link href="/events" className="block hover:text-white transition-colors">All Events</Link>
              <Link href="/calendar" className="block hover:text-white transition-colors">Race Calendar</Link>
              <Link href="/events?category=HM" className="block hover:text-white transition-colors">Half Marathons</Link>
              <Link href="/events?category=FM" className="block hover:text-white transition-colors">Full Marathons</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">For Organisers</h4>
            <div className="space-y-2 text-sm">
              <Link href="/auth/register?role=organiser" className="block hover:text-white transition-colors">List Your Event</Link>
              <Link href="/organiser" className="block hover:text-white transition-colors">Organiser Dashboard</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Support</h4>
            <div className="space-y-2 text-sm">
              <span className="block">contact@mymoveclub.com</span>
              <span className="block">+91 98765 43210</span>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm">
          <strong className="text-white">MYMove</strong> &copy; {new Date().getFullYear()}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
