import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Blackout system uses one orange. Rainbow category chips are retired. */
export function catColor(_cat?: string): string {
  return "bg-primary text-primary-foreground";
}

export function catAccent(_cat?: string): string {
  return "border-primary";
}

export function authorColor(_name?: string): string {
  return "bg-primary text-primary-foreground";
}

export function proxyImg(url: string, w = 800): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=80&we`;
}

export function timeAgo(dateStr: string): string {
  const dateObj = new Date(dateStr);
  if (Number.isNaN(dateObj.getTime())) return "Recently";
  const diff = Date.now() - dateObj.getTime();
  const mins = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (mins < 5) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return dateObj.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}
