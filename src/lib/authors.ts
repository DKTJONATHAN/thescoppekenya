export interface AuthorProfile {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  location: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    email?: string;
  };
}

// The keys must exactly match the author names used in your markdown files
export const AUTHOR_PROFILES: Record<string, AuthorProfile> = {
  "Jonathan Mwaniki": {
    name: "Jonathan Mwaniki",
    role: "Founder & Lead Developer",
    bio: "Jonathan Mwaniki is a journalist, content creator, and self-taught full-stack web developer. He bridges the gap between compelling digital media and modern technology, specializing in building automated content pipelines.",
    avatar: "/authors/jonathan.jpg", // Points to public/authors/jonathan.jpg
    location: "Maua, Meru County, Kenya",
    socials: {
      email: "info@jonathanmwaniki.co.ke",
      twitter: "https://x.com/yourhandle"
    }
  },
  "Dalton Ross": {
    name: "Dalton Ross",
    role: "Senior Entertainment Writer",
    bio: "Dalton is a respected writer and editor with extensive experience covering television, lifestyle, and the entertainment industry. Always first with the tea.",
    avatar: "/authors/dalton.jpg",
    location: "Nairobi, Kenya",
  },
  "System Admin": {
    name: "System Admin",
    role: "Automated News Bot",
    bio: "Bringing you lightning fast, automated news updates directly from the source.",
    avatar: "/authors/bot.jpg",
    location: "Za Ndani Servers",
  }
};

// Fallback profile for authors who exist in markdown but not in this database
export const DEFAULT_AUTHOR_PROFILE: AuthorProfile = {
  name: "Guest Contributor",
  role: "Contributing Writer",
  bio: "Contributing writer for Za Ndani bringing you the latest stories.",
  avatar: "/api/placeholder/150/150",
  location: "Kenya",
};