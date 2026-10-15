import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const now = new Date();
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

function istDate(daysOffset: number, hours: number, minutes: number = 0): Date {
  const base = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  base.setUTCHours(hours, minutes, 0, 0);
  return new Date(base.getTime() - IST_OFFSET);
}

/** Unsplash CDN photo, cropped to the event card's 16:9 ratio. */
const unsplash = (photoId: string) =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&h=450&q=80`;

/** Wikimedia Commons photo (freely licensed), served at a card-friendly width. */
const commons = (file: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}?width=1280`;

const events = [
  {
    title: 'Sunday Unplugged Music Night',
    category: 'Music',
    city: 'Coimbatore',
    startsAt: istDate(3, 18, 30),
    price: 499,
    description: 'An intimate acoustic evening with local indie artists performing original songs and covers. Bring your friends for a relaxed night of great music.',
    imageUrl: unsplash('1590425032427-78a5e0e6e7d5'),
    isActive: true,
  },
  {
    title: 'Indie Night Live',
    category: 'Music',
    city: 'Coimbatore',
    startsAt: istDate(9, 19, 0),
    price: 750,
    description: 'Featuring three up-and-coming indie bands from across South India. High energy, fresh sounds, and a night to remember.',
    imageUrl: unsplash('1755719888682-86b38b56de27'),
    isActive: true,
  },
  {
    title: 'Carnatic Fusion Evening',
    category: 'Music',
    city: 'Chennai',
    startsAt: istDate(6, 18, 0),
    price: 1500,
    description: 'A unique blend of traditional Carnatic music with contemporary jazz and electronic elements. Featuring renowned vocalist and instrumentalists.',
    imageUrl: unsplash('1767216498325-4ed83f6edcd8'),
    isActive: true,
  },
  {
    title: 'Pottery for Beginners',
    category: 'Workshop',
    city: 'Coimbatore',
    startsAt: istDate(5, 10, 0),
    price: 1200,
    description: 'Learn the basics of hand-building and wheel throwing. Create your own ceramic pieces to take home. All materials provided.',
    imageUrl: unsplash('1767476106330-4e5a0b4dcf94'),
    isActive: true,
  },
  {
    title: 'Photography Masterclass Retreat',
    category: 'Workshop',
    city: 'Bengaluru',
    startsAt: istDate(12, 9, 0),
    price: 150000,
    description: 'Intensive 3-day masterclass with award-winning photographers. Covers composition, lighting, post-processing, and portfolio review. Includes accommodation and meals.',
    imageUrl: unsplash('1497217305029-066f2870276b'),
    isActive: true,
  },
  {
    title: 'Street Food Fair',
    category: 'Food',
    city: 'Coimbatore',
    startsAt: istDate(8, 17, 0),
    price: 0,
    description: 'A celebration of Coimbatore street food! 20+ stalls featuring local favourites: kothu parotta, jigarthanda, sundal, and more. Free entry, pay for food.',
    imageUrl: commons('DZ6 2872 Night market cooks prepare stir-fried dishes and fresh eggs at a bustling street food stall in Klet Kaeo Sattahip.jpg'),
    isActive: true,
  },
  {
    title: 'Biryani Festival',
    category: 'Food',
    city: 'Hyderabad',
    startsAt: istDate(14, 12, 0),
    price: 299,
    description: 'Taste 10+ varieties of authentic Hyderabadi biryani from the city\'s best restaurants. Includes vegetarian options. Live cooking demos.',
    imageUrl: commons('Chicken Hyderabadi Biryani.JPG'),
    isActive: true,
  },
  {
    title: 'Sunrise 5K Run',
    category: 'Sports',
    city: 'Coimbatore',
    startsAt: istDate(7, 6, 0),
    price: 350,
    description: 'Community 5K run at sunrise through the scenic VOC Park route. Open to all fitness levels. T-shirt and refreshments included.',
    imageUrl: unsplash('1550252137-661499e28f4a'),
    isActive: true,
  },
  {
    title: 'Kids Storytelling Hour',
    category: 'Kids',
    city: 'Bengaluru',
    startsAt: istDate(2, 16, 0),
    price: 0,
    description: 'Interactive storytelling session for ages 4-10. Professional storytellers bring folktales and modern stories to life with puppets and music.',
    imageUrl: commons('An old man (grandfather) narrating a story to a group of kids (grandchildren) - a common scene in traditional Meitei society since ancient times till modern era.jpg'),
    isActive: true,
  },
  {
    title: 'Old Town Jazz Night',
    category: 'Music',
    city: 'Kochi',
    startsAt: istDate(-10, 19, 0),
    price: 800,
    description: 'Jazz standards in the historic Fort Kochi setting. International and local jazz musicians. Intimate venue, limited seating.',
    imageUrl: unsplash('1553203659-551ca1d4d7c3'),
    isActive: true,
  },
  {
    title: 'Diwali Rangoli Workshop',
    category: 'Workshop',
    city: 'Chennai',
    startsAt: istDate(-5, 10, 0),
    price: 400,
    description: 'Learn traditional and contemporary rangoli designs for Diwali. Materials provided. Suitable for all ages and skill levels.',
    imageUrl: commons('Diwali Diyas.jpg'),
    isActive: true,
  },
  {
    title: 'Kids Painting Day',
    category: 'Kids',
    city: 'Coimbatore',
    startsAt: istDate(-3, 11, 0),
    price: 250,
    description: 'Guided painting session for children ages 5-12. Theme: "My Favourite Festival". All art supplies included. Take home your masterpiece.',
    imageUrl: commons('The Secretary, Ministry of Information and Broadcasting, Shri Bimal Julka presented the prizes to the children who participated in painting competition (1).jpg'),
    isActive: true,
  },
  {
    title: 'Open Mic Night',
    category: 'Music',
    city: 'Coimbatore',
    startsAt: istDate(6, 19, 0),
    price: 200,
    description: 'Open stage for singers, poets, comedians, and performers of all kinds. Sign up on arrival. Supportive audience, great vibes.',
    imageUrl: unsplash('1547812374-17741c8f6365'),
    isActive: false,
  },
  {
    title: 'Rooftop Food Pop-up',
    category: 'Food',
    city: 'Bengaluru',
    startsAt: istDate(10, 19, 0),
    price: 350,
    description: 'Exclusive rooftop dining with a rotating chef menu. Craft cocktails and city views. Limited to 50 guests per evening.',
    imageUrl: commons('DFC 5212 A cozy rooftop table lit by a warm lamp overlooking Pattayas night lights.jpg'),
    isActive: false,
  },
  {
    title: 'Weekend Cricket League',
    category: 'Sports',
    city: 'Kochi',
    startsAt: istDate(16, 9, 0),
    price: 2000,
    description: 'Amateur cricket tournament over 4 weekends. Teams of 11. Leather ball, proper pitch. Prizes for winners and runners-up.',
    imageUrl: commons('Cricket match at Wikimania 2014 - batsman running 01.jpg'),
    isActive: false,
  },
];

interface SeedVisitor {
  id: string;
  email: string;
  password: string;
  favourites: string[];
  /** Event titles — seeded events use their title as the id. */
  reminders: string[];
  cardDesign?: { eventTitle: string; theme: string; stickers: string[] };
}

/**
 * Demo visitors. Password is intentionally the same simple value for all of
 * them — this is a local demo database, never deploy it as-is.
 */
const visitors: SeedVisitor[] = [
  {
    id: 'seed-user-priya',
    email: 'priya@example.com',
    password: 'password123',
    favourites: ['Music', 'Workshop'],
    reminders: ['Sunday Unplugged Music Night', 'Indie Night Live', 'Pottery for Beginners'],
    cardDesign: {
      eventTitle: 'Sunday Unplugged Music Night',
      theme: 'midnight',
      stickers: ['music', 'star', 'heart'],
    },
  },
  {
    id: 'seed-user-arjun',
    email: 'arjun@example.com',
    password: 'password123',
    favourites: ['Food', 'Kids'],
    reminders: ['Street Food Fair', 'Kids Storytelling Hour'],
  },
  {
    id: 'seed-user-neha',
    email: 'neha@example.com',
    password: 'password123',
    favourites: ['Kids', 'Sports', 'Music'],
    reminders: ['Sunrise 5K Run', 'Carnatic Fusion Evening'],
  },
];

async function main() {
  console.log('Seeding database...');
  
  /** title -> actual db id (existing rows may have cuid ids from older seeds). */
  const eventIds = new Map<string, string>();

  for (const event of events) {
    // Match on title, not id: older seed runs inserted rows with random cuid
    // ids, so keying on `id: event.title` created duplicates every run.
    const existing = await prisma.event.findFirst({ where: { title: event.title } });
    // Refresh the image on rows created by older seed runs (which used
    // placeholder photos), but leave every other field — including the admin's
    // active/inactive toggle — untouched.
    const row = existing
      ? await prisma.event.update({ where: { id: existing.id }, data: { imageUrl: event.imageUrl } })
      : await prisma.event.create({ data: { id: event.title, ...event } });
    eventIds.set(event.title, row.id);
  }

  console.log(`Seeded ${events.length} events.`);

  for (const visitor of visitors) {
    const passwordHash = await hash(visitor.password, 10);
    const user = await prisma.user.upsert({
      where: { email: visitor.email },
      update: {},
      create: { id: visitor.id, email: visitor.email, passwordHash },
    });

    for (const category of visitor.favourites) {
      await prisma.favouriteCategory.upsert({
        where: { userId_category: { userId: user.id, category } },
        update: {},
        create: { userId: user.id, category },
      });
    }

    for (const eventTitle of visitor.reminders) {
      const eventId = eventIds.get(eventTitle);
      if (!eventId) continue;
      await prisma.reminder.upsert({
        where: { userId_eventId: { userId: user.id, eventId } },
        update: {},
        create: { userId: user.id, eventId },
      });
    }

    if (visitor.cardDesign) {
      const eventId = eventIds.get(visitor.cardDesign.eventTitle);
      if (eventId) {
        await prisma.cardDesign.upsert({
          where: { userId_eventId: { userId: user.id, eventId } },
          update: {},
          create: {
            userId: user.id,
            eventId,
            theme: visitor.cardDesign.theme,
            stickers: JSON.stringify(visitor.cardDesign.stickers),
          },
        });
      }
    }

    console.log(`Seeded visitor ${visitor.email} (${visitor.favourites.join(', ')})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });