"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { MapPin, Calendar, Clock, Users, Star, Share2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      api.getEvent(slug)
        .then(setEvent)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-bold mb-2">Event Not Found</h1>
        <Link href="/events"><Button variant="outline">Browse Events</Button></Link>
      </div>
    );
  }

  const isDeadlinePassed = new Date() > new Date(event.regDeadline);
  const isLive = event.status === "live";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Cover Image */}
      <div
        className="h-64 md:h-80 rounded-xl bg-gradient-to-br from-[#E84621] to-[#1A2B4A] relative overflow-hidden mb-6"
        style={event.coverImageUrl ? { backgroundImage: `url(${event.coverImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-4 left-4 flex gap-2">
          {event.categories?.map((cat: any) => (
            <Badge key={cat.id} className="bg-white/90 text-[#E84621] font-semibold">{cat.name}</Badge>
          ))}
        </div>
        {event.isFeatured && (
          <Badge className="absolute top-4 right-4 bg-[#FF8C42] text-white">Featured</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="font-[family-name:var(--font-sora)] text-2xl md:text-3xl font-bold mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-[#6B6560]">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.venue}, {event.city}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(event.eventDate), "EEEE, dd MMM yyyy")}</span>
              {event.avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {event.avgRating} ({event.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="font-[family-name:var(--font-sora)] font-semibold text-lg mb-3">About This Event</h2>
            <p className="text-[#6B6560] leading-relaxed">{event.description}</p>
          </div>

          {/* Route Map */}
          {event.routeMapUrl && (
            <div>
              <h2 className="font-[family-name:var(--font-sora)] font-semibold text-lg mb-3">Route Map</h2>
              <a href={event.routeMapUrl} target="_blank" rel="noopener noreferrer" className="text-[#E84621] text-sm flex items-center gap-1 hover:underline">
                View Route Map <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* FAQs */}
          {event.faqs?.length > 0 && (
            <div>
              <h2 className="font-[family-name:var(--font-sora)] font-semibold text-lg mb-3">FAQs</h2>
              <Accordion className="space-y-2">
                {event.faqs.map((faq: any) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border border-[#E8E4DE] rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-[#6B6560]">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Reviews */}
          {event.reviews?.length > 0 && (
            <div>
              <h2 className="font-[family-name:var(--font-sora)] font-semibold text-lg mb-3">
                Reviews ({event.reviewCount})
              </h2>
              <div className="space-y-4">
                {event.reviews.map((review: any) => (
                  <Card key={review.id} className="p-4 border-[#E8E4DE]">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-[#FEF0EC] text-[#E84621] text-xs">
                          {review.user.name?.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{review.user.name}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          {review.isVerified && <Badge variant="secondary" className="text-[10px]">Verified</Badge>}
                        </div>
                        <p className="text-sm text-[#6B6560]">{review.body}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Pricing & Registration */}
        <div className="space-y-4">
          {/* Registration Card */}
          <Card className="p-5 border-[#E8E4DE] sticky top-20">
            <h3 className="font-[family-name:var(--font-sora)] font-semibold text-base mb-1">Registration</h3>
            {!isDeadlinePassed && isLive ? (
              <p className="text-xs text-[#6B6560] mb-4">
                <Clock className="w-3 h-3 inline mr-1" />
                Deadline: {format(new Date(event.regDeadline), "dd MMM yyyy, hh:mm a")}
              </p>
            ) : (
              <Badge variant="secondary" className="mb-4 text-xs">
                {event.status === "completed" ? "Event Completed" : "Registration Closed"}
              </Badge>
            )}

            <div className="space-y-3 mb-4">
              {event.categories?.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-[#F4F2EE] rounded-lg">
                  <div>
                    <div className="font-semibold text-sm">{cat.name}</div>
                    <div className="text-xs text-[#6B6560]">
                      <Users className="w-3 h-3 inline mr-1" />
                      {cat.slotsRemaining} slots left
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#E84621]">₹{cat.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {isLive && !isDeadlinePassed ? (
              <Link href={`/events/${event.slug}/register`}>
                <Button className="w-full bg-[#E84621] hover:bg-[#C03518] text-white font-semibold">
                  Register Now
                </Button>
              </Link>
            ) : (
              <Button disabled className="w-full">Registration Closed</Button>
            )}

            {event.status === "completed" && (
              <Link href={`/events/${event.slug}/results`} className="block mt-2">
                <Button variant="outline" className="w-full">View Results</Button>
              </Link>
            )}
          </Card>

          {/* Organiser Info */}
          {event.organiser && (
            <Card className="p-4 border-[#E8E4DE]">
              <h4 className="text-xs font-semibold text-[#6B6560] uppercase tracking-wider mb-3">Organised By</h4>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-[#1A2B4A] text-white text-sm">
                    {event.organiser.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{event.organiser.name}</div>
                  {event.organiser.bio && (
                    <p className="text-xs text-[#6B6560] line-clamp-2">{event.organiser.bio}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Share */}
          <Button variant="outline" className="w-full gap-2" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            <Share2 className="w-4 h-4" /> Share Event
          </Button>
        </div>
      </div>
    </div>
  );
}
