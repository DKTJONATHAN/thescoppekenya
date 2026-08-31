export type KenyaWireOutlet = {
  name: string;
  handle: string;
  site: string;
  note: string;
  accent: string;
};

export const KENYA_WIRE_OUTLETS: KenyaWireOutlet[] = [
  { name: "Citizen TV", handle: "citizentvkenya", site: "https://www.citizen.digital", note: "Breaking TV news", accent: "bg-red-600" },
  { name: "NTV Kenya", handle: "ntvkenya", site: "https://ntvkenya.co.ke", note: "Live TV + politics", accent: "bg-blue-600" },
  { name: "Nation Africa", handle: "NationAfrica", site: "https://nation.africa", note: "National daily", accent: "bg-rose-700" },
  { name: "The Standard", handle: "StandardKenya", site: "https://www.standardmedia.co.ke", note: "Since 1902", accent: "bg-zinc-800" },
  { name: "K24", handle: "K24Tv", site: "https://www.k24tv.co.ke", note: "TV news", accent: "bg-orange-600" },
  { name: "KBC", handle: "KBCChannel1", site: "https://www.kbc.co.ke", note: "National broadcaster", accent: "bg-emerald-700" },
  { name: "Kenyans.co.ke", handle: "Kenyans", site: "https://www.kenyans.co.ke", note: "Digital news", accent: "bg-sky-700" },
  { name: "Capital FM", handle: "CapitalFMKenya", site: "https://www.capitalfm.co.ke", note: "Radio + news", accent: "bg-violet-700" },
  { name: "The Star", handle: "TheStarKenya", site: "https://www.the-star.co.ke", note: "Politics + counties", accent: "bg-amber-600" },
  { name: "Business Daily", handle: "BusinessDailyA", site: "https://www.businessdailyafrica.com", note: "Markets + economy", accent: "bg-teal-700" },
];
