import { useEffect, useState, useMemo, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { CategoryBar } from "@/components/articles/CategoryBar";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { getAllPosts } from "@/lib/markdown";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Eye, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";

// ... (logic for fetchViews and useMemo remains the same) ...

const Index = () => {
  // ... (logic hooks from original code) ...

  return (
    <Layout>
      <Helmet>
        <title>Za Ndani - Kenya's Hottest Celebrity Gossip & Trending News</title>
      </Helmet>

      <CategoryBar />

      {/* REIMAGINED HERO: THE EDITORIAL SPOTLIGHT */}
      {topStory && (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-black">
          {/* Animated Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={topStory.image || topStory.coverImage || '/images/placeholder-hero.jpg'} 
              alt={topStory.title}
              className="w-full h-full object-cover scale-105 animate-subtle-zoom opacity-70"
            />
            {/* Multi-layered Gradients for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />
          </div>

          <div className="relative container max-w-7xl mx-auto px-4 z-20 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-xl border border-primary/30 px-4 py-2 rounded-full text-primary font-black text-xs tracking-[0.2em] animate-bounce-subtle">
                <Flame className="w-4 h-4 fill-current" />
                SENSATIONAL TODAY
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black leading-[0.9] text-white tracking-tighter drop-shadow-2xl">
                {topStory.title}
              </h1>

              <div className="flex items-center gap-6">
                <div className="h-20 w-1 bg-primary rounded-full" />
                <p className="max-w-md text-lg md:text-xl text-zinc-300 font-medium leading-relaxed italic">
                  "{topStory.excerpt}"
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-4">
                <Link to={`/article/${topStory.slug}`}>
                  <Button 
                    size="lg" 
                    className="bg-primary text-white hover:scale-105 transition-all duration-300 text-lg px-12 py-8 rounded-full font-black shadow-[0_0_30px_rgba(var(--primary),0.4)] group"
                  >
                    EXPLORE THE SCOOP
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition" />
                  </Button>
                </Link>
                
                <div className="flex -space-x-3 overflow-hidden">
                   {/* Decorative "People reading" avatars */}
                   {[1,2,3].map(i => (
                     <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-black bg-zinc-800" />
                   ))}
                   <div className="flex items-center justify-center h-10 px-4 rounded-full ring-2 ring-black bg-zinc-900 text-xs font-bold text-white">
                     +{topStory.views} viewing
                   </div>
                </div>
              </div>
            </div>

            {/* Floating "Next Big Story" Mini Card - Hidden on mobile */}
            <div className="hidden lg:block relative">
              <div className="absolute top-0 right-0 bg-white/5 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/10 w-72 rotate-3 hover:rotate-0 transition-all duration-500 shadow-2xl">
                <Sparkles className="text-yellow-400 mb-3" />
                <p className="text-white/50 text-xs font-bold uppercase mb-2">Up Next</p>
                <h3 className="text-white font-bold line-clamp-2">{recentPostsForBento[0]?.title}</h3>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BENTO GRID: RE-SPACED FOR IMPACT */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
               <h2 className="text-sm font-black text-primary uppercase tracking-[0.4em] mb-2">The Archive</h2>
               <p className="text-4xl md:text-5xl font-serif font-bold text-white italic">Fresh Off The Press</p>
            </div>
            <Link to="/news" className="text-zinc-500 hover:text-white transition font-bold flex items-center gap-2">
               View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Primary Bento Card */}
            <div className="md:col-span-8 md:row-span-2 rounded-[2.5rem] overflow-hidden group relative h-[500px]">
               <ArticleCard post={recentPostsForBento[0]} variant="featured" />
            </div>
            {/* Secondary Bento Items */}
            <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5">
               <ArticleCard post={recentPostsForBento[1]} variant="compact" />
            </div>
            <div className="md:col-span-4 rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/5">
               <ArticleCard post={recentPostsForBento[2]} variant="compact" />
            </div>
          </div>
        </div>
      </section>

      {/* SIDEBAR REFINEMENT: TRENDING HEATMAP */}
      <section className="py-12">
        <div className="container max-w-7xl mx-auto px-4">
           <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8">
                 {/* Main List... */}
              </div>
              
              <aside className="lg:col-span-4">
                <div className="sticky top-10 space-y-10">
                   <div className="p-8 rounded-[2rem] bg-gradient-to-br from-zinc-900 to-black border border-zinc-800">
                      <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                         <TrendingUp className="text-primary" /> Trending Now
                      </h3>
                      <div className="space-y-6">
                        {trendingPosts.map((post, i) => (
                           <Link key={post.slug} to={`/article/${post.slug}`} className="group flex gap-4 items-center">
                              <span className="text-4xl font-black text-zinc-800 group-hover:text-primary/40 transition-colors">0{i+1}</span>
                              <div>
                                 <h4 className="text-zinc-200 font-bold group-hover:text-white transition-colors line-clamp-2 leading-tight">
                                    {post.title}
                                 </h4>
                                 <div className="flex items-center gap-2 mt-1 text-[10px] uppercase font-black tracking-widest text-zinc-600">
                                    <Eye className="w-3 h-3" /> {post.views} Views
                                 </div>
                              </div>
                           </Link>
                        ))}
                      </div>
                   </div>
                </div>
              </aside>
           </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;