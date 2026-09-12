import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { searchPosts } from "@/lib/markdown";
import { proxyImg, timeAgo, PLACEHOLDER_IMG } from "@/lib/utils";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const results = useMemo(() => (q.length >= 2 ? searchPosts(q, 50) : []), [q]);

  return (
    <Layout>
      <Helmet>
        <title>{q ? `Search: ${q}` : "Search"} | Za Ndani</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="container max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-serif text-3xl font-black mb-6">Search</h1>

        <form
          role="search"
          className="flex gap-2 mb-8"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const next = String(fd.get("q") || "").trim();
            setParams(next ? { q: next } : {});
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search news, showbiz, sports…"
              className="w-full pl-10 pr-3 py-3 border border-divider bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-primary text-primary-foreground text-sm font-bold"
          >
            Search
          </button>
        </form>

        {q.length > 0 && q.length < 2 ? (
          <p className="text-muted-foreground text-sm">Type at least 2 characters.</p>
        ) : null}

        {q.length >= 2 ? (
          <p className="text-sm text-muted-foreground mb-4">
            {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
          </p>
        ) : null}

        <ul className="space-y-4">
          {results.map((post) => (
            <li key={post.slug}>
              <Link
                to={`/article/${post.slug}`}
                className="flex gap-4 border border-divider p-3 hover:border-primary/50 transition-colors"
              >
                <img
                  src={proxyImg(post.image, 200)}
                  alt=""
                  width={112}
                  height={80}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                  }}
                  className="w-28 h-20 object-cover shrink-0 bg-muted"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    {post.category}
                  </span>
                  <h2 className="font-serif font-bold text-base leading-snug line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.excerpt}</p>
                  <span className="text-[11px] text-muted-foreground mt-1 inline-block">
                    {timeAgo(post.date)} · {post.author}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {q.length >= 2 && results.length === 0 ? (
          <p className="text-muted-foreground py-8">No stories matched. Try fewer or different words.</p>
        ) : null}
      </div>
    </Layout>
  );
}
