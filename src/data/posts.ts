export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorImage?: string;
  date: string;
  category: string;
  tags: string[];
  image: string;
  imageAlt: string;
  readTime: number;
  featured?: boolean;
  trending?: boolean;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  color?: string;
}

export const categories: Category[] = [
  { name: "Entertainment", slug: "entertainment", description: "Celebrity news, music, movies & TV", color: "bg-primary" },
  { name: "Gossip", slug: "gossip", description: "Hot takes and trending tea", color: "bg-accent" },
  { name: "Politics", slug: "politics", description: "Political news and analysis", color: "bg-secondary" },
  { name: "Lifestyle", slug: "lifestyle", description: "Fashion, beauty & wellness", color: "bg-muted" },
  { name: "Sports", slug: "sports", description: "Sports news and updates", color: "bg-primary" },
  { name: "Business", slug: "business", description: "Business and finance news", color: "bg-accent" },
];

// Sample posts data - in production, these would come from markdown files
export const samplePosts: Post[] = [
  {
    slug: "diamond-platnumz-announces-nairobi-concert",
    title: "Diamond Platnumz Announces Massive Nairobi Concert for December",
    excerpt: "The Bongo Flava superstar is set to take over Nairobi with what promises to be the biggest concert of the year.",
    content: `Diamond Platnumz, the undisputed king of Bongo Flava, has officially announced his highly anticipated return to Nairobi for a massive concert scheduled for December 2024.

The announcement, made via his official social media channels, sent fans into a frenzy as tickets are expected to sell out within hours of release.

## What to Expect

The concert will feature special appearances from top Kenyan artists including Sauti Sol, Nyashinski, and Otile Brown. Sources close to the event organizers confirm that this will be Diamond's biggest production yet in East Africa.

## Ticket Information

Tickets will be available in three categories:
- Regular: Ksh 2,000
- VIP: Ksh 5,000
- VVIP: Ksh 15,000

Pre-sale begins next week exclusively through authorized dealers.`,
    author: "Sarah Kimani",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    date: "2024-01-15",
    category: "Entertainment",
    tags: ["Diamond Platnumz", "Concert", "Nairobi", "Music"],
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop",
    imageAlt: "Diamond Platnumz concert announcement promotional image",
    readTime: 4,
    featured: true,
    trending: true,
  },
  {
    slug: "kenyan-celebrity-couple-splits",
    title: "Shock as Popular Kenyan Celebrity Couple Announces Divorce",
    excerpt: "Fans are left heartbroken as one of Kenya's most beloved couples calls it quits after 8 years of marriage.",
    content: `In news that has sent shockwaves across Kenya's entertainment industry, one of the country's most celebrated couples has announced their separation.

The couple, who have been relationship goals for many Kenyans, confirmed the split through a joint statement released this morning.

## The Statement

"After much reflection and prayer, we have made the difficult decision to go our separate ways. We ask for privacy during this challenging time for our family."

## Public Reaction

Social media has been flooded with messages of support and shock from fans who looked up to the couple as examples of successful relationships in the spotlight.`,
    author: "Brian Ochieng",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    date: "2024-01-14",
    category: "Gossip",
    tags: ["Celebrity", "Divorce", "Relationships", "Kenya"],
    image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=500&fit=crop",
    imageAlt: "Symbolic image representing relationship changes",
    readTime: 3,
    featured: true,
  },
  {
    slug: "new-political-alliance-forms",
    title: "Major Political Realignment: New Alliance Shakes Up Kenyan Politics",
    excerpt: "Former rivals come together to form what could be the most powerful political coalition in recent history.",
    content: `Kenya's political landscape is experiencing a seismic shift as former rivals announce the formation of a new political alliance that could reshape the country's future.

The coalition brings together leaders from different political backgrounds, signaling a new era of cooperation or strategic positioning ahead of future elections.`,
    author: "James Mwangi",
    authorImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    date: "2024-01-13",
    category: "Politics",
    tags: ["Politics", "Alliance", "Kenya", "Elections"],
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
    imageAlt: "Kenya Parliament building representing political news",
    readTime: 5,
    trending: true,
  },
  {
    slug: "kenyan-athlete-breaks-world-record",
    title: "Kenyan Athlete Shatters World Record in Stunning Performance",
    excerpt: "Another day, another world record for Kenya as our athletes continue to dominate on the global stage.",
    content: `Kenya's dominance in long-distance running continues as yet another athlete has etched their name into the history books with a stunning world record performance.

The record was broken at a prestigious international meet, with the Kenyan athlete crossing the finish line to thunderous applause from spectators worldwide.`,
    author: "Grace Wanjiru",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    date: "2024-01-12",
    category: "Sports",
    tags: ["Athletics", "World Record", "Kenya", "Running"],
    image: "https://images.unsplash.com/photo-1461896836934- voices?w=800&h=500&fit=crop",
    imageAlt: "Kenyan athlete crossing finish line in victory",
    readTime: 3,
    trending: true,
  },
  {
    slug: "nairobi-fashion-week-highlights",
    title: "Nairobi Fashion Week 2024: The Best Looks from the Runway",
    excerpt: "From bold African prints to avant-garde designs, here are the standout moments from this year's biggest fashion event.",
    content: `Nairobi Fashion Week 2024 has wrapped up, leaving us with unforgettable moments and trends that will define Kenyan fashion for the year ahead.

Designers from across Africa showcased their best work, proving once again that the continent is a force to be reckoned with in the global fashion industry.`,
    author: "Amina Hassan",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    date: "2024-01-11",
    category: "Lifestyle",
    tags: ["Fashion", "Nairobi", "Style", "Design"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop",
    imageAlt: "Models on runway at Nairobi Fashion Week",
    readTime: 6,
  },
  {
    slug: "tech-startup-raises-millions",
    title: "Kenyan Tech Startup Raises $50 Million in Record Funding Round",
    excerpt: "The fintech startup has become one of Africa's most valuable companies after securing massive investment.",
    content: `A Nairobi-based fintech startup has made history by raising $50 million in its latest funding round, making it one of the most valuable tech companies on the African continent.

The investment comes from a consortium of international investors who see massive potential in Kenya's growing digital economy.`,
    author: "Peter Kamau",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    date: "2024-01-10",
    category: "Business",
    tags: ["Tech", "Startup", "Investment", "Fintech"],
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop",
    imageAlt: "Modern tech office representing startup success",
    readTime: 4,
  },
];

export function getPostBySlug(slug: string): Post | undefined {
  return samplePosts.find(post => post.slug === slug);
}

export function getPostsByCategory(category: string): Post[] {
  return samplePosts.filter(post => post.category.toLowerCase() === category.toLowerCase());
}

export function getFeaturedPosts(): Post[] {
  return samplePosts.filter(post => post.featured);
}

export function getTrendingPosts(): Post[] {
  return samplePosts.filter(post => post.trending);
}

export function getLatestPosts(limit?: number): Post[] {
  const sorted = [...samplePosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return limit ? sorted.slice(0, limit) : sorted;
}
