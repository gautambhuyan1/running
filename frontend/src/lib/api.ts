const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("mymove_token");
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Don't set content-type for FormData
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ user: any; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; role?: string; city?: string; phone?: string }) {
    return this.request<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<any>("/auth/me");
  }

  // Events
  async getEvents(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/events${query}`);
  }

  async getFeaturedEvents() {
    return this.request<any[]>("/events/featured");
  }

  async getCities() {
    return this.request<string[]>("/events/cities");
  }

  async getEvent(slug: string) {
    return this.request<any>(`/events/${slug}`);
  }

  async createEvent(data: any) {
    return this.request<any>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: any) {
    return this.request<any>(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Registrations
  async registerForEvent(categoryId: string) {
    return this.request<any>("/registrations", {
      method: "POST",
      body: JSON.stringify({ categoryId }),
    });
  }

  async getMyRegistrations() {
    return this.request<any[]>("/registrations");
  }

  async getRegistration(id: string) {
    return this.request<any>(`/registrations/${id}`);
  }

  async cancelRegistration(id: string) {
    return this.request<any>(`/registrations/${id}/cancel`, { method: "POST" });
  }

  // Results
  async getEventResults(eventId: string, category?: string) {
    const query = category ? `?category=${category}` : "";
    return this.request<any>(`/events/${eventId}/results${query}`);
  }

  // Reviews
  async getEventReviews(eventId: string) {
    return this.request<any>(`/events/${eventId}/reviews`);
  }

  async createReview(eventId: string, data: { rating: number; body: string }) {
    return this.request<any>(`/events/${eventId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Photos
  async getEventPhotos(eventId: string, bib?: string) {
    const query = bib ? `?bib=${bib}` : "";
    return this.request<any[]>(`/events/${eventId}/photos${query}`);
  }

  // Certificates
  async getCertificate(registrationId: string) {
    return this.request<any>(`/certificates/${registrationId}`);
  }

  // Notifications
  async getNotifications() {
    return this.request<{ notifications: any[]; unreadCount: number }>("/notifications");
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: "PUT" });
  }

  async markAllNotificationsRead() {
    return this.request<any>("/notifications/read-all", { method: "PUT" });
  }

  // Profile
  async getProfile() {
    return this.request<any>("/users/me");
  }

  async updateProfile(data: any) {
    return this.request<any>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Organiser
  async getOrganiserDashboard() {
    return this.request<any>("/organiser/dashboard");
  }

  async getOrganiserEvents() {
    return this.request<any[]>("/organiser/events");
  }

  async getOrganiserEventStats(eventId: string) {
    return this.request<any>(`/organiser/events/${eventId}/stats`);
  }

  // Admin
  async getAdminAnalytics() {
    return this.request<any>("/admin/analytics");
  }

  async getPendingEvents() {
    return this.request<any[]>("/admin/events/pending");
  }

  async approveEvent(id: string, action: "approve" | "reject") {
    return this.request<any>(`/admin/events/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    });
  }

  async getAdminUsers(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/admin/users${query}`);
  }

  async verifyUser(id: string) {
    return this.request<any>(`/admin/users/${id}/verify`, { method: "PUT" });
  }

  async getFlaggedReviews() {
    return this.request<any[]>("/admin/reviews/flagged");
  }

  async getAdminEvents(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/admin/events${query}`);
  }

  async adminUpdateEvent(id: string, data: any) {
    return this.request<any>(`/admin/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async adminDeleteEvent(id: string) {
    return this.request<any>(`/admin/events/${id}`, { method: "DELETE" });
  }

  // Fundraising
  async getNgos() {
    return this.request<any[]>("/ngos");
  }

  async getEventCampaign(eventId: string) {
    return this.request<any>(`/events/${eventId}/campaign`);
  }

  async createCampaign(eventId: string, data: { goalAmount: number; description?: string }) {
    return this.request<any>(`/events/${eventId}/campaign`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getEventFundraisers(eventId: string) {
    return this.request<any[]>(`/events/${eventId}/fundraisers`);
  }

  async getEventLeaderboard(eventId: string) {
    return this.request<any[]>(`/events/${eventId}/leaderboard`);
  }

  async createFundraiser(eventId: string, data: { ngoId: string; title: string; story: string; goalAmount: number; imageUrl?: string }) {
    return this.request<any>(`/events/${eventId}/fundraisers`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getFundraiser(id: string) {
    return this.request<any>(`/fundraisers/${id}`);
  }

  async createDonationOrder(fundraiserId: string, data: { amount: number; donorName: string; donorEmail: string; message?: string; isAnonymous?: boolean }) {
    return this.request<any>(`/fundraisers/${fundraiserId}/donate`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async verifyDonation(fundraiserId: string, data: any) {
    return this.request<any>(`/fundraisers/${fundraiserId}/donate/verify`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getFundraisingEvents() {
    return this.request<any[]>("/events?status=live&limit=50");
  }
}

export const api = new ApiClient();
