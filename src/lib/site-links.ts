export type NavLink = {
  label: string;
  path: string;
  featured?: boolean;
};

export const primaryNavLinks: NavLink[] = [
  { label: "News", path: "/news", featured: true },
  { label: "Trending", path: "/trending" },
  { label: "Podcast", path: "/podcast" },
];

export const staticSitePages = [
  { path: "/", label: "Home" },
  { path: "/news", label: "News" },
  { path: "/entertainment", label: "Entertainment" },
  { path: "/sports", label: "Sports" },
  { path: "/business", label: "Business" },
  { path: "/lifestyle", label: "Lifestyle" },
  { path: "/trending", label: "Trending" },
  { path: "/sports/live", label: "Live Scores" },
  { path: "/authors", label: "Authors" },
  { path: "/podcast", label: "Podcast" },
  { path: "/about", label: "About" },
  { path: "/contact", label: "Contact" },
  { path: "/advertise", label: "Advertise" },
  { path: "/careers", label: "Careers" },
  { path: "/ethics", label: "Editorial Ethics" },
  { path: "/corrections", label: "Corrections Policy" },
  { path: "/fact-check", label: "Fact-Check" },
  { path: "/privacy", label: "Privacy Policy" },
  { path: "/terms", label: "Terms of Service" },
  { path: "/sitemap", label: "Sitemap" },
] as const;
