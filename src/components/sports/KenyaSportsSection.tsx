import React from "react";
import { getPostsByCategory } from "@/lib/markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Trophy, Users } from "lucide-react";
import { format } from "date-fns";

export function KenyaSportsSection() {
  // Get sports posts that are Kenya-related
  const sportsPosts = getPostsByCategory("sports");
  const kenyaPosts = sportsPosts.filter(
    (post) =>
      post.title.toLowerCase().includes("kenya") ||
      post.title.toLowerCase().includes("harambee") ||
      post.excerpt?.toLowerCase().includes("kenya") ||
      post.tags?.some((tag) =>
        ["kenya", "harambee stars", "kpl", "kenyan"].includes(tag.toLowerCase())
      )
  );

  // Use all sports posts if no Kenya-specific ones found
  const displayPosts = kenyaPosts.length > 0 ? kenyaPosts : sportsPosts;

  return (
    <div className="space-y-6">
      {/* Kenya Sports Header */}
      <div className="relative overflow-hidden bg-zinc-900 rounded-[2rem] p-8 border border-zinc-800 shadow-2xl group">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <MapPin className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-black text-white tracking-tight">The Local <span className="text-rose-600">Arena</span></h2>
              <p className="text-zinc-500 text-sm font-medium">Harambee Stars & KPL Coverage</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
              <Trophy className="w-5 h-5 mx-auto mb-2 text-rose-500" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-300">National</p>
              <p className="text-[10px] text-zinc-500 mt-1">Harambee Stars</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
              <Users className="w-5 h-5 mx-auto mb-2 text-rose-500" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Premier</p>
              <p className="text-[10px] text-zinc-500 mt-1">KPL News</p>
            </div>
            <div className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors hover:bg-white/10">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-rose-500" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Future</p>
              <p className="text-[10px] text-zinc-500 mt-1">AFCON 2025</p>
            </div>
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700" />
      </div>

      {/* News Articles */}
      {displayPosts.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-black text-2xl text-white flex items-center gap-3">
              Latest Sports Scoop
              <span className="text-rose-600">.</span>
            </h3>
            <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-zinc-800">
              {displayPosts.length} Reports
            </Badge>
          </div>
          <div className="grid gap-6">
            {displayPosts.slice(0, 8).map((post) => (
              <Link key={post.slug} to={`/article/${post.slug}`} className="group">
                <Card className="bg-zinc-900/50 border-zinc-800/50 hover:border-rose-500/50 transition-all duration-300 rounded-3xl overflow-hidden shadow-xl hover:shadow-rose-900/5">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row md:items-stretch h-full">
                      {post.image && (
                        <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden shrink-0">
                           <img
                            src={post.image}
                            alt={post.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col justify-center">
                        <h4 className="text-xl font-serif font-black text-white group-hover:text-rose-500 transition-colors line-clamp-2 mb-3 leading-tight">
                          {post.title}
                        </h4>
                        <p className="text-zinc-400 text-sm line-clamp-2 mb-4 leading-relaxed font-light">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          <span className="flex items-center gap-2 text-rose-500">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(post.date), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">No Kenya Sports News Yet</h3>
            <p className="text-muted-foreground">
              Check back soon for the latest on Harambee Stars and the Kenyan Premier League.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Access */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-6 group hover:border-rose-500/30 transition-colors">
          <Trophy className="w-8 h-8 mb-4 text-rose-600 group-hover:scale-110 transition-transform" />
          <p className="font-serif font-black text-white text-lg leading-tight mb-1">Harambee Stars</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">National Team Desk</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-[1.5rem] p-6 group hover:border-rose-500/30 transition-colors">
          <Users className="w-8 h-8 mb-4 text-rose-600 group-hover:scale-110 transition-transform" />
          <p className="font-serif font-black text-white text-lg leading-tight mb-1">KPL Round-up</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Premier League Pulse</p>
        </div>
      </div>
    </div>
  );
}
