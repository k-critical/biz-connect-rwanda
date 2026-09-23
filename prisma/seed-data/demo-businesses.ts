import type { CategorySlug } from "../../src/config/categories";

// Every business here is fictional and stored with is_demo = true, so `npm run db:wipe-demo`
// can remove them all before launch. Names always start with "Demo".

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** [opensAt, closesAt] in minutes after midnight; closesAt <= opensAt means it runs past midnight. */
export type Period = readonly [number, number];
export type WeeklyHours = Partial<Record<IsoWeekday, Period[]>>;

export type DemoBusiness = {
  slug: string;
  name: string;
  categories: readonly [CategorySlug, ...CategorySlug[]];
  district: string;
  sector: string;
  tagline: string;
  description: string;
  priceLevel?: 1 | 2 | 3;
  status: "APPROVED" | "PENDING" | "DRAFT";
  featured?: boolean;
  hours: WeeklyHours;
  showcase?: {
    title: string;
    items: { name: string; description?: string; priceRwf?: number }[];
  }[];
};

const at = (hours: number, minutes = 0) => hours * 60 + minutes;
const ALL_WEEK: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

function weekly(days: IsoWeekday[], open: number, close: number): WeeklyHours {
  return Object.fromEntries(days.map((day) => [day, [[open, close] as const]]));
}

const shopHours = weekly([1, 2, 3, 4, 5, 6], at(8), at(19));
const officeHours = { ...weekly([1, 2, 3, 4, 5], at(8), at(17)), ...weekly([6], at(9), at(13)) };
const salonHours = { ...weekly([1, 2, 3, 4, 5, 6], at(9), at(20)), ...weekly([7], at(13), at(18)) };
const restaurantHours = {
  ...weekly([1, 2, 3, 4, 7], at(11), at(22)),
  ...weekly([5, 6], at(11), at(23)),
};
const cafeHours = weekly(ALL_WEEK, at(7), at(21));
const openAllDay = weekly(ALL_WEEK, 0, at(24));
const lateNightHours = weekly([2, 3, 4, 5, 6, 7], at(17), at(2));
const cinemaHours = {
  ...weekly([1, 2, 3, 4, 5], at(14), at(23)),
  ...weekly([6, 7], at(10), at(23)),
};

export const demoBusinesses: DemoBusiness[] = [
  {
    slug: "demo-rooftop-cafe",
    name: "Demo Rooftop Café",
    categories: ["restaurants"],
    district: "Gasabo",
    sector: "Kimihurura",
    tagline: "Rwandan coffee and light meals with a view over the hills.",
    description:
      "A calm place to work or meet friends. Single-origin coffee from local cooperatives, fresh juices and simple plates all day.",
    priceLevel: 2,
    status: "APPROVED",
    featured: true,
    hours: cafeHours,
    showcase: [
      {
        title: "Coffee & drinks",
        items: [
          { name: "Rwandan pour-over", priceRwf: 2000 },
          { name: "African tea", description: "Spiced tea with milk", priceRwf: 1200 },
          { name: "Passion fruit juice", priceRwf: 2000 },
        ],
      },
      {
        title: "Food",
        items: [
          { name: "Chapati wrap", description: "Egg, avocado and vegetables", priceRwf: 3500 },
          { name: "Brochette plate", description: "With chips and salad", priceRwf: 5000 },
        ],
      },
    ],
  },
  {
    slug: "demo-grill-house",
    name: "Demo Grill House",
    categories: ["restaurants", "entertainment"],
    district: "Nyarugenge",
    sector: "Nyamirambo",
    tagline: "Brochettes, isombe and cold drinks until late.",
    description:
      "A lively neighbourhood grill. Goat and beef brochettes over charcoal, grilled tilapia on weekends, and football on the big screen.",
    priceLevel: 1,
    status: "APPROVED",
    featured: true,
    hours: restaurantHours,
    showcase: [
      {
        title: "From the grill",
        items: [
          { name: "Goat brochette", priceRwf: 1500 },
          { name: "Beef brochette", priceRwf: 1500 },
          { name: "Grilled tilapia", description: "Whole fish, weekends only", priceRwf: 8000 },
        ],
      },
      {
        title: "Sides",
        items: [
          { name: "Fried plantain", priceRwf: 1500 },
          { name: "Isombe", description: "Cassava leaves with peanut sauce", priceRwf: 2500 },
        ],
      },
    ],
  },
  {
    slug: "demo-lakeside-guesthouse",
    name: "Demo Lakeside Guesthouse",
    categories: ["hotels"],
    district: "Rubavu",
    sector: "Gisenyi",
    tagline: "Eight quiet rooms a short walk from the lake shore.",
    description:
      "Family-run guesthouse with a garden, breakfast included and bicycles to borrow for the lakeside road.",
    priceLevel: 2,
    status: "APPROVED",
    featured: true,
    hours: openAllDay,
    showcase: [
      {
        title: "Rooms",
        items: [
          { name: "Single room", description: "Breakfast included", priceRwf: 25000 },
          { name: "Double room", description: "Breakfast included", priceRwf: 35000 },
          { name: "Family room", description: "Sleeps four", priceRwf: 50000 },
        ],
      },
    ],
  },
  {
    slug: "demo-volcano-view-lodge",
    name: "Demo Volcano View Lodge",
    categories: ["hotels"],
    district: "Musanze",
    sector: "Kinigi",
    tagline: "Stone cottages with fireplaces and views of the volcanoes.",
    description:
      "Comfortable cottages for trekkers, with early breakfasts, packed lunches and help arranging transport to the park.",
    priceLevel: 3,
    status: "APPROVED",
    hours: openAllDay,
    showcase: [
      {
        title: "Cottages",
        items: [
          { name: "Standard cottage", description: "Half board", priceRwf: 90000 },
          { name: "Family cottage", description: "Two bedrooms, half board", priceRwf: 150000 },
        ],
      },
    ],
  },
  {
    slug: "demo-budget-motel",
    name: "Demo Budget Motel",
    categories: ["hotels"],
    district: "Huye",
    sector: "Ngoma",
    tagline: "Clean, simple rooms close to the town centre.",
    description:
      "Good value for students and travellers passing through, with hot showers, Wi-Fi and secure parking.",
    priceLevel: 1,
    status: "APPROVED",
    hours: openAllDay,
  },
  {
    slug: "demo-fashion-corner",
    name: "Demo Fashion Corner",
    categories: ["shops"],
    district: "Nyarugenge",
    sector: "Nyarugenge",
    tagline: "Everyday clothes, shoes and bags at fair prices.",
    description:
      "New stock every week, with made-in-Rwanda pieces alongside imported basics. Alterations while you wait.",
    priceLevel: 2,
    status: "APPROVED",
    hours: shopHours,
  },
  {
    slug: "demo-crafts-and-baskets",
    name: "Demo Crafts & Baskets",
    categories: ["shops"],
    district: "Gasabo",
    sector: "Kacyiru",
    tagline: "Handwoven baskets and Imigongo art from women's cooperatives.",
    description:
      "Every piece is made by hand and signed by the cooperative that made it. Gift wrapping available.",
    priceLevel: 2,
    status: "APPROVED",
    featured: true,
    hours: shopHours,
    showcase: [
      {
        title: "Products",
        items: [
          { name: "Agaseke basket", description: "Medium, lidded", priceRwf: 15000 },
          { name: "Imigongo panel", description: "Small, 30 × 30 cm", priceRwf: 25000 },
          { name: "Beaded bracelet", priceRwf: 3000 },
        ],
      },
    ],
  },
  {
    slug: "demo-phone-repair",
    name: "Demo Phone Repair",
    categories: ["services", "shops"],
    district: "Kicukiro",
    sector: "Kicukiro",
    tagline: "Screens, batteries and charging ports fixed the same day.",
    description:
      "Repairs for most phone brands, with a three-month warranty on parts. Accessories and chargers for sale.",
    priceLevel: 1,
    status: "APPROVED",
    hours: shopHours,
  },
  {
    slug: "demo-tailor-studio",
    name: "Demo Tailor Studio",
    categories: ["services"],
    district: "Huye",
    sector: "Tumba",
    tagline: "Made-to-measure outfits in kitenge and plain fabrics.",
    description:
      "Bring your own fabric or choose from ours. Graduation and wedding outfits, school uniforms and repairs.",
    priceLevel: 1,
    status: "APPROVED",
    hours: weekly([1, 2, 3, 4, 5, 6], at(8), at(18)),
  },
  {
    slug: "demo-accounting-services",
    name: "Demo Accounting Services",
    categories: ["services"],
    district: "Gasabo",
    sector: "Remera",
    tagline: "Bookkeeping and tax filing for small businesses.",
    description:
      "Monthly bookkeeping, payroll and help with tax declarations, explained in plain Kinyarwanda, English or French.",
    priceLevel: 2,
    status: "APPROVED",
    hours: officeHours,
  },
  {
    slug: "demo-beauty-salon",
    name: "Demo Beauty Salon",
    categories: ["beauty"],
    district: "Kicukiro",
    sector: "Gikondo",
    tagline: "Braids, nails and make-up, with or without an appointment.",
    description:
      "A friendly team of five stylists. Book ahead on WhatsApp for braids or wedding make-up.",
    priceLevel: 2,
    status: "APPROVED",
    featured: true,
    hours: salonHours,
    showcase: [
      {
        title: "Services",
        items: [
          { name: "Braids", description: "Price depends on length", priceRwf: 10000 },
          { name: "Manicure", priceRwf: 5000 },
          { name: "Wash and style", priceRwf: 4000 },
        ],
      },
    ],
  },
  {
    slug: "demo-barber-shop",
    name: "Demo Barber Shop",
    categories: ["beauty"],
    district: "Musanze",
    sector: "Muhoza",
    tagline: "Quick, clean haircuts and beard trims.",
    description: "Walk in any time. Hot towel shaves on request.",
    priceLevel: 1,
    status: "APPROVED",
    hours: salonHours,
  },
  {
    slug: "demo-music-lounge",
    name: "Demo Music Lounge",
    categories: ["entertainment"],
    district: "Gasabo",
    sector: "Kimironko",
    tagline: "Live bands on Fridays, DJs on Saturdays.",
    description:
      "Open late from Tuesday to Sunday. Private area available for birthdays and office parties.",
    priceLevel: 2,
    status: "APPROVED",
    hours: lateNightHours,
  },
  {
    slug: "demo-cinema-hall",
    name: "Demo Cinema Hall",
    categories: ["cinema", "entertainment"],
    district: "Gasabo",
    sector: "Remera",
    tagline: "New releases and African films on the big screen.",
    description:
      "Two screens with comfortable seats. Private screenings for schools and companies on request.",
    priceLevel: 2,
    status: "APPROVED",
    hours: cinemaHours,
    showcase: [
      {
        title: "Tickets",
        items: [
          { name: "Standard ticket", priceRwf: 3000 },
          { name: "Weekend matinée", priceRwf: 2500 },
        ],
      },
    ],
  },
  {
    slug: "demo-city-taxi",
    name: "Demo City Taxi",
    categories: ["transport"],
    district: "Nyarugenge",
    sector: "Muhima",
    tagline: "Airport runs and city rides, day and night.",
    description:
      "Reliable drivers who know the city. Book by WhatsApp and get a price before you ride.",
    priceLevel: 2,
    status: "APPROVED",
    hours: openAllDay,
  },
  {
    slug: "demo-moto-delivery",
    name: "Demo Moto Delivery",
    categories: ["transport", "services"],
    district: "Kicukiro",
    sector: "Niboye",
    tagline: "Parcels and documents delivered across Kigali within the hour.",
    description: "Send anything that fits on a motorbike. Proof of delivery by photo.",
    priceLevel: 1,
    status: "APPROVED",
    hours: weekly([1, 2, 3, 4, 5, 6], at(7), at(21)),
  },
  {
    slug: "demo-bus-booking",
    name: "Demo Bus Booking",
    categories: ["transport"],
    district: "Rusizi",
    sector: "Kamembe",
    tagline: "Tickets for intercity buses, booked in minutes.",
    description: "Compare departure times and book seats for the main routes out of Rusizi.",
    priceLevel: 1,
    status: "APPROVED",
    hours: weekly(ALL_WEEK, at(6), at(20)),
  },
  {
    slug: "demo-fresh-market-stall",
    name: "Demo Fresh Market Stall",
    categories: ["shops"],
    district: "Rwamagana",
    sector: "Kigabiro",
    tagline: "Seasonal fruit and vegetables straight from local farms.",
    description: "Avocados, bananas, passion fruit and greens, delivered to your door on weekends.",
    priceLevel: 1,
    status: "APPROVED",
    hours: weekly(ALL_WEEK, at(6), at(18)),
  },
  {
    slug: "demo-pharmacy",
    name: "Demo Pharmacy",
    categories: ["others"],
    district: "Bugesera",
    sector: "Nyamata",
    tagline: "Medicines, baby care and friendly advice.",
    description: "Waiting for review: a pending listing, for testing the admin queue.",
    priceLevel: 2,
    status: "PENDING",
    hours: weekly(ALL_WEEK, at(8), at(22)),
  },
  {
    slug: "demo-printing-studio",
    name: "Demo Printing Studio",
    categories: ["services"],
    district: "Muhanga",
    sector: "Nyamabuye",
    tagline: "Business cards, banners and T-shirt printing.",
    description: "Waiting for review: a pending listing, for testing the admin queue.",
    priceLevel: 2,
    status: "PENDING",
    hours: officeHours,
  },
  {
    slug: "demo-bakery",
    name: "Demo Bakery",
    categories: ["restaurants"],
    district: "Nyagatare",
    sector: "Nyagatare",
    tagline: "Fresh bread and mandazi every morning.",
    description: "An unfinished draft, for testing the owner dashboard.",
    priceLevel: 1,
    status: "DRAFT",
    hours: cafeHours,
  },
];
