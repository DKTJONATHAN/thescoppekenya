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

export type AdminTab = "create" | "manage" | "authors";
