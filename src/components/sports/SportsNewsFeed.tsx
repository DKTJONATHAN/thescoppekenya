import { getPostsByCategory } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export function SportsNewsFeed() {
  const sportsPosts = getPostsByCategory('sports');

  if (sportsPosts.length === 0) {
    return (
      <div className="text-center py-16 bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50">
        <p className="text-zinc-500 italic font-light">No global sports reports found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {sportsPosts.slice(0, 10).map((post) => (
        <Link key={post.slug} to={`/article/${post.slug}`} className="group">
          <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col h-full rounded-[2rem] overflow-hidden hover:border-rose-500/50 transition-all duration-300 shadow-2xl hover:shadow-rose-900/10 h-full">
            <CardContent className="p-0 flex flex-col h-full">
              {post.image && (
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 bg-zinc-950/80 px-3 py-1 rounded-full backdrop-blur-md">
                      Report
                    </span>
                  </div>
                </div>
              )}
              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-2xl font-serif font-black text-white group-hover:text-rose-500 transition-colors mb-4 leading-tight line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-zinc-400 text-sm font-light mb-6 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-rose-500" />
                      {format(new Date(post.date), "MMM d")}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-rose-600 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
