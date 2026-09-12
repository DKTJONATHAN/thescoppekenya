import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Clock, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { searchPosts } from "@/lib/markdown";

function img(url: string, w = 400): string {
  if (!url) return "/images/placeholder.jpg";
  if (url.endsWith(".svg") || url.startsWith("/")) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}&w=${w}&output=webp&q=75&we`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const results = useMemo(() => (q.length >= 2 ? searchPosts(q, 50) : []), [q]);

  return (
    <Layout>
      <Helmet>
        <title>{q ? `Search: ${q}` : "Search"} · Za Ndani</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="container max-w-3xl py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-primary" />
          {q ? (
            <>
              Results for <span className="text-primary">“{q}”</span>
            </>
          ) : (
            "Search Za Ndani"
          )}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {q.length < 2
            ? "Type at least 2 characters in the search box above."
            : `${results.length} stor${results.length === 1 ? "y" : "ies"} found`}
        </p>

        {q.length >= 2 && results.length === 0 && (
          <div className="border border-divider rounded-xl p-8 text-center text-muted-foreground">
            No matches. Try a shorter keyword, a name, or a category (e.g. Ruto, Gor Mahia, Safaricom).
          </div>
        )}

        <ul className="space-y-0 divide-y divide-border">
          {results.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/article/${post.slug}`}
                className="group flex gap-4 py-4 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="w-24 sm:w-32 flex-shrink-0 aspect-[4/3] overflow-hidden bg-muted rounded-md">
                  <img
                    src={img(post.image, 320)}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                    {post.category}
                  </span>
                  <h2 className="font-serif font-bold text-foreground group-hover:text-primary line-clamp-2 text-sm sm:text-base leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 hidden sm:block">
                    {post.excerpt}
                  </p>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1.5">
                    <Clock className="w-3 h-3" />
                    {timeAgo(post.date)} · {post.author}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
