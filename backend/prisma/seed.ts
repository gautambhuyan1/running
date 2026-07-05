import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.donation.deleteMany();
  await prisma.fundraiser.deleteMany();
  await prisma.fundraisingCampaign.deleteMany();
  await prisma.ngo.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.result.deleteMany();
  await prisma.review.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.eventFaq.deleteMany();
  await prisma.eventCategory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // --- Users ---
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@mymoveclub.com",
      password: passwordHash,
      role: "admin",
      city: "Bangalore",
      isVerified: true,
    },
  });

  const organiser1 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@mymoveclub.com",
      password: passwordHash,
      phone: "+919876543210",
      role: "organiser",
      city: "Mumbai",
      bio: "Professional event organiser with 10+ years of experience in running events across India.",
      isVerified: true,
    },
  });

  const organiser2 = await prisma.user.create({
    data: {
      name: "Rajesh Kumar",
      email: "rajesh@mymoveclub.com",
      password: passwordHash,
      phone: "+919876543211",
      role: "organiser",
      city: "Delhi",
      bio: "Founder of Delhi Runners Club, organising community runs since 2018.",
      isVerified: true,
    },
  });

  const runner1 = await prisma.user.create({
    data: {
      name: "Ananya Patel",
      email: "ananya@gmail.com",
      password: passwordHash,
      phone: "+919876543212",
      role: "runner",
      city: "Mumbai",
      bio: "Marathon enthusiast. PB: 3:45 FM. Running since 2020.",
      isVerified: true,
    },
  });

  const runner2 = await prisma.user.create({
    data: {
      name: "Vikram Singh",
      email: "vikram@gmail.com",
      password: passwordHash,
      phone: "+919876543213",
      role: "runner",
      city: "Delhi",
      bio: "Trail runner and ultra enthusiast. Love exploring new routes.",
      isVerified: true,
    },
  });

  const runner3 = await prisma.user.create({
    data: {
      name: "Meera Joshi",
      email: "meera@gmail.com",
      password: passwordHash,
      phone: "+919876543214",
      role: "runner",
      city: "Pune",
      bio: "Beginner runner training for my first half marathon!",
      isVerified: true,
    },
  });

  const runner4 = await prisma.user.create({
    data: {
      name: "Arjun Nair",
      email: "arjun@gmail.com",
      password: passwordHash,
      phone: "+919876543215",
      role: "runner",
      city: "Bangalore",
      isVerified: true,
    },
  });

  // --- Events ---
  const event1 = await prisma.event.create({
    data: {
      organiserId: organiser1.id,
      title: "Mumbai Marathon 2026",
      slug: "mumbai-marathon-2026",
      city: "Mumbai",
      venue: "Chhatrapati Shivaji Terminus, Mumbai",
      eventDate: new Date("2026-06-15"),
      regDeadline: new Date("2026-06-10"),
      status: "live",
      coverImageUrl: "https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800",
      description:
        "Join thousands of runners at the iconic Mumbai Marathon! Experience the energy of running through the heart of Mumbai, from CST to the Sea Link and back. This flagship event features world-class timing, hydration stations every 3km, and a vibrant post-race carnival.",
      routeMapUrl: "https://maps.google.com",
      isFeatured: true,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      organiserId: organiser2.id,
      title: "Delhi Half Marathon",
      slug: "delhi-half-marathon-2026",
      city: "Delhi",
      venue: "Jawaharlal Nehru Stadium, New Delhi",
      eventDate: new Date("2026-07-20"),
      regDeadline: new Date("2026-07-15"),
      status: "live",
      coverImageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
      description:
        "Run through the historic streets of Delhi! The Delhi Half Marathon takes you past India Gate, Rajpath, and the beautiful Lodhi Gardens. Perfect for first-timers and seasoned runners alike.",
      isFeatured: true,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      organiserId: organiser1.id,
      title: "Pune Night Run",
      slug: "pune-night-run-2026",
      city: "Pune",
      venue: "Shivaji Nagar, Pune",
      eventDate: new Date("2026-05-10"),
      regDeadline: new Date("2026-05-05"),
      status: "live",
      coverImageUrl: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800",
      description:
        "Experience running under the stars at Pune's premier night run! Starting at 8 PM, this unique event features glow-in-the-dark route markers, live DJ stations, and a spectacular finish line celebration.",
      isFeatured: true,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      organiserId: organiser2.id,
      title: "Bangalore 10K Challenge",
      slug: "bangalore-10k-challenge-2026",
      city: "Bangalore",
      venue: "Cubbon Park, Bangalore",
      eventDate: new Date("2026-08-05"),
      regDeadline: new Date("2026-08-01"),
      status: "live",
      coverImageUrl: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800",
      description:
        "Bangalore's fastest 10K course through the green lungs of the city! Run through Cubbon Park and MG Road with perfect weather. Chip timing, live tracking, and finisher medals for all.",
    },
  });

  const event5 = await prisma.event.create({
    data: {
      organiserId: organiser1.id,
      title: "Goa Beach Marathon",
      slug: "goa-beach-marathon-2026",
      city: "Goa",
      venue: "Miramar Beach, Panaji",
      eventDate: new Date("2026-09-12"),
      regDeadline: new Date("2026-09-07"),
      status: "live",
      coverImageUrl: "https://images.unsplash.com/photo-1544899489-a083461b088c?w=800",
      description:
        "Run along the stunning Goa coastline! This beach marathon combines fitness with the beauty of Goa's pristine beaches. Post-race beach party included!",
      isFeatured: true,
    },
  });

  const event6 = await prisma.event.create({
    data: {
      organiserId: organiser2.id,
      title: "Hyderabad Heritage Run",
      slug: "hyderabad-heritage-run-2026",
      city: "Hyderabad",
      venue: "Charminar, Hyderabad",
      eventDate: new Date("2026-04-20"),
      regDeadline: new Date("2026-04-15"),
      status: "completed",
      coverImageUrl: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800",
      description:
        "Run through the historic old city of Hyderabad! Pass by Charminar, Mecca Masjid, and Golconda Fort on this heritage-themed run celebrating the city's rich history.",
    },
  });

  // --- Event Categories ---
  const cat1_5k = await prisma.eventCategory.create({
    data: { eventId: event1.id, name: "5K", price: 750, maxParticipants: 2000, slotsRemaining: 1850 },
  });
  const cat1_10k = await prisma.eventCategory.create({
    data: { eventId: event1.id, name: "10K", price: 1200, maxParticipants: 3000, slotsRemaining: 2700 },
  });
  const cat1_hm = await prisma.eventCategory.create({
    data: { eventId: event1.id, name: "HM", price: 1800, maxParticipants: 2000, slotsRemaining: 1600 },
  });
  const cat1_fm = await prisma.eventCategory.create({
    data: { eventId: event1.id, name: "FM", price: 2500, maxParticipants: 1000, slotsRemaining: 800 },
  });

  const cat2_5k = await prisma.eventCategory.create({
    data: { eventId: event2.id, name: "5K", price: 600, maxParticipants: 1500, slotsRemaining: 1400 },
  });
  const cat2_10k = await prisma.eventCategory.create({
    data: { eventId: event2.id, name: "10K", price: 1000, maxParticipants: 2000, slotsRemaining: 1800 },
  });
  const cat2_hm = await prisma.eventCategory.create({
    data: { eventId: event2.id, name: "HM", price: 1500, maxParticipants: 1500, slotsRemaining: 1300 },
  });

  const cat3_5k = await prisma.eventCategory.create({
    data: { eventId: event3.id, name: "5K", price: 500, maxParticipants: 1000, slotsRemaining: 900 },
  });
  const cat3_10k = await prisma.eventCategory.create({
    data: { eventId: event3.id, name: "10K", price: 800, maxParticipants: 800, slotsRemaining: 650 },
  });

  const cat4_5k = await prisma.eventCategory.create({
    data: { eventId: event4.id, name: "5K", price: 500, maxParticipants: 1000, slotsRemaining: 950 },
  });
  const cat4_10k = await prisma.eventCategory.create({
    data: { eventId: event4.id, name: "10K", price: 900, maxParticipants: 1500, slotsRemaining: 1400 },
  });

  const cat5_5k = await prisma.eventCategory.create({
    data: { eventId: event5.id, name: "5K", price: 800, maxParticipants: 500, slotsRemaining: 450 },
  });
  const cat5_10k = await prisma.eventCategory.create({
    data: { eventId: event5.id, name: "10K", price: 1200, maxParticipants: 800, slotsRemaining: 700 },
  });
  const cat5_hm = await prisma.eventCategory.create({
    data: { eventId: event5.id, name: "HM", price: 1800, maxParticipants: 500, slotsRemaining: 420 },
  });
  const cat5_fm = await prisma.eventCategory.create({
    data: { eventId: event5.id, name: "FM", price: 2500, maxParticipants: 300, slotsRemaining: 250 },
  });

  const cat6_5k = await prisma.eventCategory.create({
    data: { eventId: event6.id, name: "5K", price: 500, maxParticipants: 1000, slotsRemaining: 0 },
  });
  const cat6_10k = await prisma.eventCategory.create({
    data: { eventId: event6.id, name: "10K", price: 800, maxParticipants: 800, slotsRemaining: 0 },
  });
  const cat6_hm = await prisma.eventCategory.create({
    data: { eventId: event6.id, name: "HM", price: 1400, maxParticipants: 600, slotsRemaining: 0 },
  });

  // --- Registrations ---
  const reg1 = await prisma.registration.create({
    data: {
      userId: runner1.id,
      categoryId: cat1_hm.id,
      bibNumber: "MUM-HM-0001",
      status: "confirmed",
      amountPaid: 1800,
      paymentRef: "pay_stub_001",
    },
  });

  const reg2 = await prisma.registration.create({
    data: {
      userId: runner2.id,
      categoryId: cat2_hm.id,
      bibNumber: "DEL-HM-0001",
      status: "confirmed",
      amountPaid: 1500,
      paymentRef: "pay_stub_002",
    },
  });

  const reg3 = await prisma.registration.create({
    data: {
      userId: runner3.id,
      categoryId: cat3_10k.id,
      bibNumber: "PUN-10K-0001",
      status: "confirmed",
      amountPaid: 800,
      paymentRef: "pay_stub_003",
    },
  });

  const reg4 = await prisma.registration.create({
    data: {
      userId: runner4.id,
      categoryId: cat4_10k.id,
      bibNumber: "BLR-10K-0001",
      status: "confirmed",
      amountPaid: 900,
      paymentRef: "pay_stub_004",
    },
  });

  const reg5 = await prisma.registration.create({
    data: {
      userId: runner1.id,
      categoryId: cat6_hm.id,
      bibNumber: "HYD-HM-0001",
      status: "confirmed",
      amountPaid: 1400,
      paymentRef: "pay_stub_005",
    },
  });

  const reg6 = await prisma.registration.create({
    data: {
      userId: runner2.id,
      categoryId: cat6_10k.id,
      bibNumber: "HYD-10K-0001",
      status: "confirmed",
      amountPaid: 800,
      paymentRef: "pay_stub_006",
    },
  });

  const reg7 = await prisma.registration.create({
    data: {
      userId: runner3.id,
      categoryId: cat6_5k.id,
      bibNumber: "HYD-5K-0001",
      status: "confirmed",
      amountPaid: 500,
      paymentRef: "pay_stub_007",
    },
  });

  const reg8 = await prisma.registration.create({
    data: {
      userId: runner4.id,
      categoryId: cat6_hm.id,
      bibNumber: "HYD-HM-0002",
      status: "confirmed",
      amountPaid: 1400,
      paymentRef: "pay_stub_008",
    },
  });

  // --- Results (for completed event6) ---
  await prisma.result.createMany({
    data: [
      { registrationId: reg5.id, finishTime: "01:48:32", overallRank: 1, categoryRank: 1 },
      { registrationId: reg8.id, finishTime: "01:55:10", overallRank: 2, categoryRank: 2 },
      { registrationId: reg6.id, finishTime: "00:52:15", overallRank: 3, categoryRank: 1 },
      { registrationId: reg7.id, finishTime: "00:28:45", overallRank: 4, categoryRank: 1 },
    ],
  });

  // --- Reviews (for completed event6) ---
  await prisma.review.createMany({
    data: [
      {
        eventId: event6.id,
        userId: runner1.id,
        rating: 5,
        body: "Absolutely stunning route through the old city! The heritage theme made every kilometer interesting. Great hydration support and enthusiastic volunteers.",
        isVerified: true,
      },
      {
        eventId: event6.id,
        userId: runner2.id,
        rating: 4,
        body: "Well organised event with great route markers. Only downside was parking was a bit chaotic. Otherwise, fantastic experience running past Charminar at dawn!",
        isVerified: true,
      },
      {
        eventId: event6.id,
        userId: runner3.id,
        rating: 5,
        body: "My first ever race and what an experience! The 5K route was perfect for beginners. Loved the finisher medal design with Charminar motif.",
        isVerified: true,
      },
      {
        eventId: event6.id,
        userId: runner4.id,
        rating: 4,
        body: "Great event! The early morning start was perfect for Hyderabad weather. Route was scenic and well-marked. Would definitely run again next year.",
        isVerified: true,
      },
    ],
  });

  // --- FAQs ---
  const faqData = [
    { eventId: event1.id, question: "What time does the marathon start?", answer: "The full marathon starts at 5:30 AM, half marathon at 6:00 AM, 10K at 7:00 AM, and 5K at 7:30 AM.", sortOrder: 1 },
    { eventId: event1.id, question: "Where do I collect my bib?", answer: "Bib collection is at the Expo held at NSCI Dome, Worli, 2 days before the event (June 13-14, 10 AM - 8 PM).", sortOrder: 2 },
    { eventId: event1.id, question: "Is there a time limit?", answer: "Full marathon: 6.5 hours, Half marathon: 4 hours, 10K: 2 hours, 5K: 1.5 hours.", sortOrder: 3 },
    { eventId: event1.id, question: "Are refunds available?", answer: "Refunds are available up to 30 days before the event with a 15% processing fee. No refunds within 30 days.", sortOrder: 4 },
    { eventId: event2.id, question: "Is the course flat?", answer: "Yes, the Delhi HM course is mostly flat with gentle inclines near India Gate. Perfect for PB attempts!", sortOrder: 1 },
    { eventId: event2.id, question: "Will there be pacers?", answer: "Yes! Official pacers available for 1:30, 1:45, 2:00, 2:15, and 2:30 finish times.", sortOrder: 2 },
    { eventId: event3.id, question: "Is it safe to run at night?", answer: "Absolutely! The entire route is well-lit, with police escorts, marshals every 200m, and ambulances on standby.", sortOrder: 1 },
  ];
  await prisma.eventFaq.createMany({ data: faqData });

  // --- Photos (for completed event) ---
  await prisma.photo.createMany({
    data: [
      { eventId: event6.id, url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400", bibTag: "HYD-HM-0001", caption: "Runners at the start line" },
      { eventId: event6.id, url: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=400", bibTag: "HYD-10K-0001", caption: "Passing by Charminar" },
      { eventId: event6.id, url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400", bibTag: "HYD-5K-0001", caption: "Finish line celebration" },
    ],
  });

  // --- Notifications ---
  await prisma.notification.createMany({
    data: [
      { userId: runner1.id, type: "registration_confirmation", title: "Registration Confirmed!", body: "You're registered for Mumbai Marathon 2026 - Half Marathon. Your bib: MUM-HM-0001", isRead: true },
      { userId: runner1.id, type: "results_published", title: "Results are live!", body: "Hyderabad Heritage Run results have been published. Check your timing!", isRead: false },
      { userId: runner2.id, type: "registration_confirmation", title: "Registration Confirmed!", body: "You're registered for Delhi Half Marathon - Half Marathon. Your bib: DEL-HM-0001", isRead: true },
      { userId: runner3.id, type: "event_reminder_7d", title: "7 days to go!", body: "Pune Night Run is just 7 days away. Start tapering!", isRead: false },
    ],
  });

  // --- NGOs ---
  const ngo1 = await prisma.ngo.create({ data: { name: "Teach For India", description: "Bridging the education gap for underprivileged children across India.", website: "https://teachforindia.org", logoUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100" } });
  const ngo2 = await prisma.ngo.create({ data: { name: "Goonj", description: "Channelling urban surplus to rural India — clothing, disaster relief, and development.", website: "https://goonj.org", logoUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=100" } });
  const ngo3 = await prisma.ngo.create({ data: { name: "CRY – Child Rights and You", description: "Working to ensure sustainable change for underprivileged children in India.", website: "https://cry.org", logoUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=100" } });
  const ngo4 = await prisma.ngo.create({ data: { name: "Akshaya Patra", description: "Mid-day meal programme reaching millions of school children daily.", website: "https://akshayapatra.org", logoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=100" } });
  const ngo5 = await prisma.ngo.create({ data: { name: "HelpAge India", description: "Championing the cause of disadvantaged elderly people in India.", website: "https://helpageindia.org", logoUrl: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?w=100" } });

  // --- Fundraising campaign for Mumbai Marathon ---
  const campaign1 = await prisma.fundraisingCampaign.create({
    data: {
      eventId: event1.id,
      goalAmount: 500000,
      isActive: true,
      description: "Run for a cause! Every kilometre you clock at Mumbai Marathon 2026 can change a life. Support our NGO partners working on education, nutrition, and elder care.",
    },
  });

  // --- Sample fundraiser by runner1 ---
  const fundraiser1 = await prisma.fundraiser.create({
    data: {
      userId: runner1.id,
      campaignId: campaign1.id,
      ngoId: ngo1.id,
      title: "Running 21km for Teach For India",
      story: "I'm running the Mumbai Half Marathon to raise funds for Teach For India — a movement that places talented graduates in under-resourced schools. Every rupee you donate will help train a teacher who will impact 35+ children every year. Join me on this journey!",
      goalAmount: 25000,
      isPublished: true,
    },
  });

  const fundraiser2 = await prisma.fundraiser.create({
    data: {
      userId: runner2.id,
      campaignId: campaign1.id,
      ngoId: ngo4.id,
      title: "Running for Mid-Day Meals – Akshaya Patra",
      story: "No child should go hungry. I'm running the Mumbai Marathon to support Akshaya Patra's mid-day meal programme. ₹1250 feeds one child for an entire year. Every donation counts!",
      goalAmount: 50000,
      isPublished: true,
    },
  });

  // --- Sample donations ---
  await prisma.donation.createMany({
    data: [
      { fundraiserId: fundraiser1.id, donorName: "Vikram Singh", donorEmail: "vikram@gmail.com", amount: 2000, message: "Go Ananya! Great cause!", status: "confirmed", paymentRef: "pay_fund_001" },
      { fundraiserId: fundraiser1.id, donorName: "Anonymous", donorEmail: "anon@gmail.com", amount: 1500, status: "confirmed", paymentRef: "pay_fund_002", isAnonymous: true },
      { fundraiserId: fundraiser1.id, donorName: "Meera Joshi", donorEmail: "meera@gmail.com", amount: 3000, message: "Proud of you!", status: "confirmed", paymentRef: "pay_fund_003" },
      { fundraiserId: fundraiser2.id, donorName: "Ananya Patel", donorEmail: "ananya@gmail.com", amount: 5000, message: "Such an important cause!", status: "confirmed", paymentRef: "pay_fund_004" },
      { fundraiserId: fundraiser2.id, donorName: "Arjun Nair", donorEmail: "arjun@gmail.com", amount: 2500, status: "confirmed", paymentRef: "pay_fund_005" },
    ],
  });

  console.log("Seed data created successfully!");
  console.log(`  Users: 7 (1 admin, 2 organisers, 4 runners)`);
  console.log(`  Events: 6 (5 live, 1 completed)`);
  console.log(`  Categories: 18`);
  console.log(`  Registrations: 8`);
  console.log(`  Results: 4`);
  console.log(`  Reviews: 4`);
  console.log(`  FAQs: 7`);
  console.log(`  Photos: 3`);
  console.log(`  Notifications: 4`);
  console.log(`  NGOs: 5`);
  console.log(`  Fundraising campaigns: 1`);
  console.log(`  Fundraisers: 2`);
  console.log(`  Donations: 5`);
  console.log(`\nDefault password for all users: password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
