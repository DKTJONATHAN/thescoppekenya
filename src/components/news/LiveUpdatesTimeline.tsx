import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Radio, Clock } from "lucide-react";
import { getAllPosts, getPostsByCategory } from "@/lib/markdown";

function proxyImg(url: string, w = 120): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=80&we`;
}

function isWithinHours(dateStr: string, hours: number): boolean {
  return (Date.now() - new Date(dateStr).getTime()) < hours * 3600000;
}

function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics") || c.includes("news")) return "bg-blue-700";
  if (c.includes("gossip")) return "bg-purple-600";
  if (c.includes("sports")) return "bg-green-700";
  if (c.includes("tech") || c.includes("business")) return "bg-cyan-700";
  return "bg-zinc-600";
}

interface LiveUpdatesTimelineProps {
  /** Filter to a specific category slug, or show all if omitted */
  category?: string;
  /** Max number of items to show */
  maxItems?: number;
  /** Variant: 'full' for standalone section, 'compact' for sidebar widget */
  variant?: "full" | "compact";
  /** Title override */
  title?: string;
}

export function LiveUpdatesTimeline({
  category,
  maxItems = 15,
  variant = "full",
  title = "Live Updates",
}: LiveUpdatesTimelineProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const liveUpdates = useMemo(() => {
    const posts = category ? getPostsByCategory(category) : getAllPosts();
    return posts.filter(p => isWithinHours(p.date, 24)).slice(0, maxItems);
  }, [category, maxItems, now]);

  if (liveUpdates.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="border border-divider">
        <div className="bg-primary h-1" />
        <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-widest">{title}</h3>
        </div>
        <div className="divide-y divide-divider max-h-[350px] overflow-y-auto scrollbar-thin">
          {liveUpdates.slice(0, 8).map(post => (
            <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-3 p-3 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <time dateTime={new Date(post.date).toISOString()} className="text-[10px] text-muted-foreground tabular-nums font-mono">
                    {new Date(post.date).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  {isWithinHours(post.date, 1) && (
                    <span className="text-[8px] font-black text-primary uppercase">New</span>
                  )}
                </div>
                <h4 className="text-xs font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h4>
              </div>
              <img src={proxyImg(post.image, 80)} alt="" loading="lazy"
                className="w-14 h-10 object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-zinc-950/50 border-b border-zinc-800 py-6">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary">
            <Radio className="w-4 h-4 animate-pulse" /> {title}
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-[10px] text-zinc-600 tabular-nums">
            {new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })} EAT
          </span>
        </div>

        <div className="relative pl-6 border-l-2 border-zinc-800 space-y-4 max-h-[400px] overflow-y-auto scrollbar-thin">
          {liveUpdates.map(post => (
            <Link key={post.slug} to={`/article/${post.slug}`} className="group block relative">
              <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-zinc-800 ${isWithinHours(post.date, 1) ? "bg-primary animate-pulse" : "bg-zinc-700"}`} />
              <div className="flex gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <time dateTime={new Date(post.date).toISOString()} className="text-[10px] text-zinc-500 tabular-nums font-mono">
                      {new Date(post.date).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                    <span className={`text-[8px] font-black uppercase tracking-widest text-white px-1 py-0.5 ${catColor(post.category)}`}>
                      {post.category}
                    </span>
                    {isWithinHours(post.date, 1) && (
                      <span className="text-[8px] font-black text-primary uppercase">New</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{post.excerpt}</p>
                </div>
                <img src={proxyImg(post.image, 120)} alt="" loading="lazy"
                  className="w-16 h-12 object-cover flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
