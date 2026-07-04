export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "runner" | "organiser" | "admin";
  city?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt?: string;
}

export interface EventCategory {
  id: string;
  eventId?: string;
  name: string;
  price: number;
  maxParticipants?: number;
  slotsRemaining: number;
}

export interface EventFaq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  rating: number;
  body: string;
  isVerified: boolean;
  createdAt: string;
  user: Pick<User, "id" | "name" | "avatarUrl" | "city">;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  city: string;
  venue: string;
  eventDate: string;
  regDeadline: string;
  status: "draft" | "pending" | "live" | "completed";
  coverImageUrl?: string;
  description: string;
  routeMapUrl?: string;
  isFeatured: boolean;
  categories: EventCategory[];
  organiser?: Pick<User, "id" | "name" | "bio" | "avatarUrl">;
  reviews?: Review[];
  faqs?: EventFaq[];
  avgRating: number;
  reviewCount: number;
  minPrice: number;
  photoCount?: number;
}

export interface Registration {
  id: string;
  userId: string;
  categoryId: string;
  bibNumber?: string;
  status: "pending" | "confirmed" | "cancelled";
  amountPaid: number;
  paymentRef?: string;
  registeredAt: string;
  category: EventCategory & { event: Pick<Event, "id" | "title" | "slug" | "city" | "eventDate" | "coverImageUrl" | "status"> };
  result?: Result;
}

export interface Result {
  id?: string;
  finishTime: string;
  gunTime?: string;
  overallRank: number;
  categoryRank: number;
  bibNumber?: string;
  runnerName?: string;
  runnerCity?: string;
  category?: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Ngo {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  website?: string;
}

export interface FundraisingCampaign {
  id: string;
  eventId: string;
  goalAmount: number;
  totalRaised: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  event: Pick<Event, "id" | "title" | "slug" | "city" | "eventDate" | "coverImageUrl" | "status">;
  _count: { fundraisers: number };
}

export type FundraiserBadge = "Champion" | "Trailblazer" | "Change Maker" | "Rising Star" | "Starter";

export interface Fundraiser {
  id: string;
  userId: string;
  campaignId: string;
  ngoId: string;
  title: string;
  story: string;
  goalAmount: number;
  totalRaised: number;
  imageUrl?: string;
  badge: FundraiserBadge;
  isPublished: boolean;
  createdAt: string;
  user: Pick<User, "id" | "name" | "avatarUrl" | "city">;
  ngo: Ngo;
  campaign?: FundraisingCampaign;
  donations?: Donation[];
  _count?: { donations: number };
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  events: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
