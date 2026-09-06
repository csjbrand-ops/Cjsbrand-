// seed-data.js
// The 9 launch products, exactly as specified, plus the default site
// settings document. Both index.html (read-only fallback context) and
// admin.js (one-time import) read from this single source so the product
// data never has to be typed out twice.

export const SEED_PRODUCTS = [
  {
    id: "1",
    name: "Wine & Sky Duo",
    category: "Premium",
    tag: "New",
    price: 1650,
    oldPrice: null,
    image: "images/csj-1.jpg",
    colors: [
      { name: "Wine Maroon", hex: "#5c2027" },
      { name: "Sky Lavender", hex: "#b9c3e8" },
      { name: "Espresso Brown", hex: "#5a3a26" }
    ],
    description:
      "Soft-touch wash & wear suiting box — wine maroon, sky lavender and espresso brown in one set. Full unstitched length, ready for your tailor.",
    displayOrder: 1,
    active: true
  },
  {
    id: "2",
    name: "Olive & Cream Set",
    category: "Signature",
    tag: "Best Seller",
    price: 1850,
    oldPrice: null,
    image: "images/csj-2.jpg",
    colors: [
      { name: "Olive Green", hex: "#5a5a34" },
      { name: "Cream", hex: "#ecdcae" },
      { name: "Midnight Black", hex: "#17171a" },
      { name: "Sage Mint", hex: "#a9c2a0" }
    ],
    description:
      "Premium boxed set finished in tissue and satin band. Olive green with woven border, soft cream, jet black and fresh sage mint.",
    displayOrder: 2,
    active: true
  },
  {
    id: "3",
    name: "Charcoal & Camel Duo",
    category: "Premium",
    tag: "New",
    price: 1850,
    oldPrice: null,
    image: "images/csj-3.jpg",
    colors: [
      { name: "Charcoal Grey", hex: "#4a4d52" },
      { name: "Camel Tan", hex: "#a9855c" }
    ],
    description:
      "Grace suiting finish in cool charcoal grey and warm camel tan. Smooth hand-feel, holds its shape through a long day.",
    displayOrder: 3,
    active: true
  },
  {
    id: "4",
    name: "Beige, Navy & Rust Trio",
    category: "Signature",
    tag: "New",
    price: 1650,
    oldPrice: null,
    image: "images/csj-4.jpg",
    colors: [
      { name: "Warm Beige", hex: "#d6c7a8" },
      { name: "Deep Navy", hex: "#1f2b4a" },
      { name: "Rust Brown", hex: "#a35a2e" }
    ],
    description:
      "Three of our most-ordered tones together — warm beige, deep navy and rust brown, all with the same soft, breathable finish.",
    displayOrder: 4,
    active: true
  },
  {
    id: "5",
    name: "Taupe & Sky Blue Duo",
    category: "Premium",
    tag: null,
    price: 1850,
    oldPrice: null,
    image: "images/csj-5.jpg",
    colors: [
      { name: "Warm Taupe", hex: "#b7a58c" },
      { name: "Sky Blue", hex: "#a9c4d6" }
    ],
    description:
      "Nerm-o-Nazuk exclusive fabric — soft warm taupe and cool sky blue, comfortable enough for all-day wear.",
    displayOrder: 5,
    active: true
  },
  {
    id: "6",
    name: "Wine & Sage Duo",
    category: "Signature",
    tag: "Best Seller",
    price: 1850,
    oldPrice: null,
    image: "images/csj-6.jpg",
    colors: [
      { name: "Deep Wine", hex: "#4a1f28" },
      { name: "Sage Grey", hex: "#a8ac9c" }
    ],
    description:
      "Deep wine and soft sage grey — a rich, versatile pairing that works for both everyday and formal wear.",
    displayOrder: 6,
    active: true
  },
  {
    id: "7",
    name: "Olive & Blush Duo",
    category: "Premium",
    tag: "New",
    price: 1850,
    oldPrice: null,
    image: "images/csj-7.jpg",
    colors: [
      { name: "Royal Olive", hex: "#4a4a2e" },
      { name: "Dusty Blush", hex: "#d6a8a0" }
    ],
    description:
      "Royal suiting finish in deep olive and dusty blush pink — a striking, modern colour pairing.",
    displayOrder: 7,
    active: true
  },
  {
    id: "8",
    name: "White, Navy & Taupe Trio",
    category: "Value",
    tag: null,
    price: 1650,
    oldPrice: null,
    image: "images/csj-8.jpg",
    colors: [
      { name: "Pure White", hex: "#f5f4ef" },
      { name: "Navy Charcoal", hex: "#3d3d47" },
      { name: "Warm Taupe", hex: "#a89a7e" }
    ],
    description:
      "Crisp white, deep navy-charcoal and warm taupe — everyday premium cloth with a proper finish, great value.",
    displayOrder: 8,
    active: true
  },
  {
    id: "9",
    name: "Mustard & Aubergine Duo",
    category: "Value",
    tag: "New",
    price: 1650,
    oldPrice: null,
    image: "images/csj-9.jpg",
    colors: [
      { name: "Mustard Gold", hex: "#c9821f" },
      { name: "Deep Aubergine", hex: "#3a1f2e" },
      { name: "Chocolate Brown", hex: "#4a2e1a" }
    ],
    description:
      "Bold mustard gold, deep aubergine and rich chocolate brown — a standout colourway for Jumma and festive wear.",
    displayOrder: 9,
    active: true
  }
];

export const DEFAULT_SITE_SETTINGS = {
  storeName: "CSJ — Chotty Shah Jee",
  whatsappNumber: "923227707172",
  heroTitle: "Unstitched suiting, cut for the tailor you already trust",
  heroSubtitle:
    "Nine boxed colour sets, one fixed length, ready to send straight to your darzi.",
  announcementText: "Free delivery across Pakistan on every order.",
  contactInfo: "WhatsApp orders: 0322-7707172",
  shippingInfo: "Dispatched within 2–3 working days, nationwide."
};
