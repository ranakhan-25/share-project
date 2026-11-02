export type InvestorProject = {
  id: string;
  name: { bn: string; en: string };
  location: { bn: string; en: string };
  category: { bn: string; en: string };
  status: "open" | "funding" | "completed";
  image: string;
  pricePerShare: number;
  totalShares: number;
  soldShares: number;
  returnRate: number;
  duration: { bn: string; en: string };
  description: { bn: string; en: string };
  documents: string[];
};

export const investorProjects: InvestorProject[] = [
  {
    id: "sea-view-resort",
    name: { bn: "সি ভিউ হোটেল ও রিসোর্ট", en: "Sea View Hotel & Resort" },
    location: { bn: "কক্সবাজার, চট্টগ্রাম", en: "Cox's Bazar, Chattogram" },
    category: { bn: "হোটেল ও রিসোর্ট", en: "Hotel & Resort" },
    status: "open",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
    pricePerShare: 35000,
    totalShares: 1000,
    soldShares: 740,
    returnRate: 15,
    duration: { bn: "৩ বছর", en: "3 years" },
    description: { bn: "কক্সবাজারের একটি প্রিমিয়াম পর্যটন-নির্ভর রিসোর্ট প্রকল্পে আয়োজিত শেয়ার।", en: "A premium tourism-led resort project offering fractional ownership." },
    documents: ["Project prospectus", "Valuation report", "Legal agreement"],
  },
  {
    id: "premium-car-share",
    name: { bn: "প্রিমিয়াম কার শেয়ার", en: "Premium Car Share" },
    location: { bn: "বনানী, ঢাকা", en: "Banani, Dhaka" },
    category: { bn: "গাড়ি শেয়ারিং", en: "Car Sharing" },
    status: "funding",
    image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
    pricePerShare: 12000,
    totalShares: 600,
    soldShares: 348,
    returnRate: 11,
    duration: { bn: "২ বছর", en: "2 years" },
    description: { bn: "বাণিজ্যিক প্রিমিয়াম যানবাহন নেটওয়ার্কে বিনিয়োগের সুযোগ।", en: "An income-generating fleet investment for premium ride services." },
    documents: ["Investment memorandum", "Fleet valuation"],
  },
  {
    id: "solar-power-plant",
    name: { bn: "সোলার পাওয়ার প্লান্ট", en: "Solar Power Plant" },
    location: { bn: "সাভার, ঢাকা", en: "Savar, Dhaka" },
    category: { bn: "নবায়নযোগ্য জ্বালানি", en: "Renewable Energy" },
    status: "open",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=85",
    pricePerShare: 22000,
    totalShares: 800,
    soldShares: 552,
    returnRate: 18,
    duration: { bn: "৫ বছর", en: "5 years" },
    description: { bn: "বিশ্বস্ত গ্রিড-সংযুক্ত নবায়নযোগ্য বিদ্যুৎ উৎপাদন প্রকল্প।", en: "A grid-connected renewable energy project with long-term distribution income." },
    documents: ["Solar feasibility study", "Grid agreement", "Insurance policy"],
  },
  {
    id: "lake-view-plaza",
    name: { bn: "লেকভিউ প্লাজা", en: "Lakeview Plaza" },
    location: { bn: "উত্তরা, ঢাকা", en: "Uttara, Dhaka" },
    category: { bn: "কমার্শিয়াল রিয়েল এস্টেট", en: "Commercial Real Estate" },
    status: "funding",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    pricePerShare: 18000,
    totalShares: 1200,
    soldShares: 696,
    returnRate: 13,
    duration: { bn: "৪ বছর", en: "4 years" },
    description: { bn: "উত্তরার প্রধান যোগাযোগ এলাকায় মাল্টি-টেন্যান্ট বাণিজ্যিক প্রজেক্ট।", en: "A multi-tenant commercial property in a high-demand urban district." },
    documents: ["Property appraisal", "Lease overview"],
  },
];
