import { useParams, Link } from "react-router-dom";
import { getPostBySlug } from "@/lib/posts";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ArticlePage = () => {
  const { slug } = useParams();
  const post = getPostBySlug(slug || "");

  if (!post) return <div className="p-20 text-center font-black">STORY NOT FOUND</div>;

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | Za Ndani</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:image" content={post.image} />
        <link rel="preload" as="image" href={post.image} fetchpriority="high" />
      </Helmet>

      <article className="bg-white">
        {/* HERO HEADER */}
        <div className="container max-w-4xl mx-auto px-4 pt-8 pb-12">
          <Link to="/" className="flex items-center text-zinc-400 font-bold text-sm mb-6 hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4" /> BACK TO SCOOPS
          </Link>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {post.category}
               </span>
               <div className="flex gap-4 text-zinc-400 text-[11px] font-bold uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} MIN READ</span>
               </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-black leading-[1.05] tracking-tighter text-zinc-950">
              {post.title}
            </h1>
          </div>

          <div className="mt-10 aspect-[16/10] md:aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl bg-zinc-100">
            <img 
              src={post.image} 
              alt={post.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="container max-w-2xl mx-auto px-4 pb-32">
          <div 
            className="prose prose-zinc prose-lg md:prose-xl max-w-none 
              prose-headings:font-serif prose-headings:font-black prose-headings:tracking-tighter
              prose-p:text-zinc-800 prose-p:leading-relaxed
              prose-strong:text-zinc-950 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-3xl prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.htmlContent }} 
          />
          
          <div className="mt-20 pt-10 border-t border-zinc-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white font-black text-xs">ZN</div>
                <div>
                  <p className="text-xs font-black uppercase">Published by</p>
                  <p className="text-sm font-bold text-zinc-500">Za Ndani Editorial</p>
                </div>
             </div>
             <Button variant="outline" className="rounded-full gap-2 font-bold">
               <Share2 className="w-4 h-4" /> SHARE
             </Button>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default ArticlePage;