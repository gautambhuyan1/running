"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Users, Calendar, IndianRupee, BarChart3, Check, X, Shield, Plus, Pencil, Trash2, Eye, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  live: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
};

const emptyEvent = {
  title: "",
  city: "",
  venue: "",
  eventDate: "",
  regDeadline: "",
  description: "",
  coverImageUrl: "",
  status: "live",
  categories: [{ name: "5K", price: 500, maxParticipants: 1000 }],
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Event form state
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState<any>({ ...emptyEvent });
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getAdminAnalytics().then(setAnalytics),
      api.getPendingEvents().then(setPendingEvents),
      api.getAdminEvents({ limit: "100" }).then((d) => setAllEvents(d.events)),
      api.getAdminUsers().then((d) => setUsers(d.users)),
    ]).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== "admin") { router.push("/"); return; }
    loadData();
  }, [user, router]);

  const handleApprove = async (id: string, action: "approve" | "reject") => {
    try {
      await api.approveEvent(id, action);
      setPendingEvents(pendingEvents.filter((e) => e.id !== id));
      setAllEvents(allEvents.map((e) => e.id === id ? { ...e, status: action === "approve" ? "live" : "draft" } : e));
      toast.success(`Event ${action}d`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleVerifyUser = async (id: string) => {
    try {
      await api.verifyUser(id);
      setUsers(users.map((u) => u.id === id ? { ...u, isVerified: true } : u));
      toast.success("User verified");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    setEventForm({ ...emptyEvent });
    setShowEventDialog(true);
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      city: event.city,
      venue: event.venue || "",
      eventDate: event.eventDate ? format(new Date(event.eventDate), "yyyy-MM-dd") : "",
      regDeadline: event.regDeadline ? format(new Date(event.regDeadline), "yyyy-MM-dd") : "",
      description: event.description || "",
      coverImageUrl: event.coverImageUrl || "",
      status: event.status,
      categories: event.categories?.length > 0
        ? event.categories.map((c: any) => ({ name: c.name, price: c.price, maxParticipants: c.maxParticipants || 1000 }))
        : [{ name: "5K", price: 500, maxParticipants: 1000 }],
    });
    setShowEventDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.city || !eventForm.eventDate || !eventForm.description) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      if (editingEvent) {
        // Update existing event
        await api.adminUpdateEvent(editingEvent.id, {
          title: eventForm.title,
          city: eventForm.city,
          venue: eventForm.venue,
          eventDate: eventForm.eventDate,
          regDeadline: eventForm.regDeadline,
          description: eventForm.description,
          coverImageUrl: eventForm.coverImageUrl || null,
          status: eventForm.status,
        });
        toast.success("Event updated");
      } else {
        // Create new event via organiser API (admin has organiser permissions)
        await api.createEvent({
          title: eventForm.title,
          city: eventForm.city,
          venue: eventForm.venue,
          eventDate: eventForm.eventDate,
          regDeadline: eventForm.regDeadline,
          description: eventForm.description,
          coverImageUrl: eventForm.coverImageUrl || undefined,
          categories: eventForm.categories,
        });
        toast.success("Event created (pending approval — approve it from the Pending tab)");
      }
      setShowEventDialog(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will remove all registrations, results, and reviews.`)) return;
    try {
      await api.adminDeleteEvent(id);
      setAllEvents(allEvents.filter((e) => e.id !== id));
      setPendingEvents(pendingEvents.filter((e) => e.id !== id));
      toast.success("Event deleted");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const updateCategory = (index: number, field: string, value: any) => {
    const cats = [...eventForm.categories];
    cats[index] = { ...cats[index], [field]: value };
    setEventForm({ ...eventForm, categories: cats });
  };

  const addCategory = () => {
    setEventForm({ ...eventForm, categories: [...eventForm.categories, { name: "10K", price: 800, maxParticipants: 1000 }] });
  };

  const removeCategory = (index: number) => {
    if (eventForm.categories.length <= 1) return;
    setEventForm({ ...eventForm, categories: eventForm.categories.filter((_: any, i: number) => i !== index) });
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-10"><Card className="h-96 animate-pulse bg-gray-100" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#E84621]" />
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-bold">Admin Panel</h1>
        </div>
        <Button className="bg-[#E84621] hover:bg-[#C03518] text-white gap-2" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" /> Create Event
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: analytics?.totalUsers || 0, icon: <Users className="w-5 h-5" /> },
          { label: "Total Events", value: analytics?.totalEvents || 0, icon: <Calendar className="w-5 h-5" /> },
          { label: "Registrations", value: analytics?.totalRegistrations || 0, icon: <BarChart3 className="w-5 h-5" /> },
          { label: "Revenue", value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: <IndianRupee className="w-5 h-5" /> },
        ].map((stat, i) => (
          <Card key={i} className="p-4 border-[#E8E4DE]">
            <div className="text-[#6B6560] mb-2">{stat.icon}</div>
            <div className="font-[family-name:var(--font-sora)] text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[#6B6560]">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="events">
        <TabsList className="mb-4">
          <TabsTrigger value="events">
            All Events
            <Badge className="ml-1 text-xs" variant="secondary">{allEvents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingEvents.length > 0 && (
              <Badge className="ml-1 bg-[#E84621] text-white text-xs">{pendingEvents.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* All Events Tab */}
        <TabsContent value="events">
          {allEvents.length === 0 ? (
            <div className="text-center py-10 text-[#6B6560]">
              <p className="mb-3">No events yet.</p>
              <Button onClick={openCreateDialog} className="bg-[#E84621] text-white gap-2">
                <Plus className="w-4 h-4" /> Create First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {allEvents.map((event) => (
                <Card key={event.id} className="p-4 border-[#E8E4DE]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm">{event.title}</span>
                        <Badge className={`text-xs ${statusColors[event.status] || ""}`}>{event.status}</Badge>
                        {event.isFeatured && <Badge className="text-xs bg-orange-100 text-orange-700">Featured</Badge>}
                      </div>
                      <div className="text-xs text-[#6B6560] flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.city}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(event.eventDate), "dd MMM yyyy")}</span>
                        <span>By {event.organiser?.name}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {event.categories?.map((c: any) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">{c.name} — ₹{c.price}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/events/${event.slug}`}>
                        <Button size="sm" variant="outline" title="View">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" title="Edit" onClick={() => openEditDialog(event)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" title="Delete" onClick={() => handleDeleteEvent(event.id, event.title)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Events Tab */}
        <TabsContent value="pending">
          {pendingEvents.length === 0 ? (
            <div className="text-center py-10 text-[#6B6560]">No pending events for approval</div>
          ) : (
            <div className="space-y-3">
              {pendingEvents.map((event) => (
                <Card key={event.id} className="p-4 border-[#E8E4DE]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-xs text-[#6B6560] mt-1">
                        By {event.organiser?.name} ({event.organiser?.email})
                      </div>
                      <div className="flex gap-2 mt-2">
                        {event.categories?.map((c: any) => (
                          <Badge key={c.id} variant="secondary" className="text-xs">{c.name} — ₹{c.price}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => handleApprove(event.id, "approve")}>
                        <Check className="w-3 h-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 gap-1" onClick={() => handleApprove(event.id, "reject")}>
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="space-y-2">
            {users.map((u) => (
              <Card key={u.id} className="p-3 border-[#E8E4DE] flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{u.name}</span>
                  <span className="text-xs text-[#6B6560] ml-2">{u.email}</span>
                  <Badge className="ml-2 text-xs" variant="secondary">{u.role}</Badge>
                  {u.isVerified && <Badge className="ml-1 text-xs bg-green-100 text-green-700">Verified</Badge>}
                </div>
                {!u.isVerified && u.role === "organiser" && (
                  <Button size="sm" variant="outline" onClick={() => handleVerifyUser(u.id)}>Verify</Button>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border-[#E8E4DE]">
              <h3 className="font-semibold text-sm mb-3">Users by Role</h3>
              {Object.entries(analytics?.usersByRole || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between text-sm py-1">
                  <span className="capitalize">{role}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </Card>
            <Card className="p-4 border-[#E8E4DE]">
              <h3 className="font-semibold text-sm mb-3">Events by Status</h3>
              {Object.entries(analytics?.eventsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm py-1">
                  <span className="capitalize">{status}</span>
                  <span className="font-medium">{count as number}</span>
                </div>
              ))}
            </Card>
            <Card className="p-4 border-[#E8E4DE] md:col-span-2">
              <h3 className="font-semibold text-sm mb-3">Top Cities</h3>
              <div className="flex flex-wrap gap-2">
                {analytics?.topCities?.map((c: any) => (
                  <Badge key={c.city} variant="outline" className="text-sm">{c.city} ({c.count})</Badge>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-sora)]">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Title *</Label>
                <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Mumbai Marathon 2026" />
              </div>
              <div>
                <Label className="text-sm">City *</Label>
                <Input value={eventForm.city} onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })} placeholder="Mumbai" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Venue</Label>
              <Input value={eventForm.venue} onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="Chhatrapati Shivaji Terminus" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Event Date *</Label>
                <Input type="date" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm">Registration Deadline</Label>
                <Input type="date" value={eventForm.regDeadline} onChange={(e) => setEventForm({ ...eventForm, regDeadline: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-sm">Description *</Label>
              <Textarea rows={3} value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Event description..." />
            </div>
            <div>
              <Label className="text-sm">Cover Image URL</Label>
              <Input value={eventForm.coverImageUrl} onChange={(e) => setEventForm({ ...eventForm, coverImageUrl: e.target.value })} placeholder="https://..." />
            </div>

            {editingEvent && (
              <div>
                <Label className="text-sm">Status</Label>
                <select
                  className="w-full border border-[#E8E4DE] rounded-md px-3 py-2 text-sm bg-white"
                  value={eventForm.status}
                  onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            {/* Categories (only for create) */}
            {!editingEvent && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Distance Categories *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addCategory} className="gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {eventForm.categories.map((cat: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-[#F4F2EE] rounded-lg">
                      <select
                        className="border border-[#E8E4DE] rounded px-2 py-1 text-sm bg-white"
                        value={cat.name}
                        onChange={(e) => updateCategory(i, "name", e.target.value)}
                      >
                        {["3K", "5K", "10K", "HM", "FM", "50K", "Ultra"].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        className="w-24 text-sm"
                        placeholder="Price"
                        value={cat.price}
                        onChange={(e) => updateCategory(i, "price", Number(e.target.value))}
                      />
                      <Input
                        type="number"
                        className="w-24 text-sm"
                        placeholder="Max"
                        value={cat.maxParticipants}
                        onChange={(e) => updateCategory(i, "maxParticipants", Number(e.target.value))}
                      />
                      {eventForm.categories.length > 1 && (
                        <Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={() => removeCategory(i)}>
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>Cancel</Button>
              <Button className="bg-[#E84621] hover:bg-[#C03518] text-white" onClick={handleSaveEvent} disabled={submitting}>
                {submitting ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
