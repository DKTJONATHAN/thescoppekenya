import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories as defaultCategories } from "@/lib/markdown";
import {
  Lock, Plus, Eye, FileText, LogOut, Loader2, Pencil, Trash2,
  Github, Search, Users, TrendingUp, BarChart2, Flame,
  ArrowUp, ArrowDown, Clock, Zap, BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthorsManager } from "@/admin/components/AuthorsManager";
import { AuthorProfile } from "@/admin/types";
import { validatePin, isAdminAuthenticated, setAdminAuthenticated } from "@/admin/utils/auth";
import {
  getGithubFileContent, getGithubFileSha,
  pushToGithub, deleteFromGithub,
} from "@/admin/utils/github";
import { generateSlug } from "@/admin/utils/helpers";
import { ConfirmDialog } from "@/admin/components/ConfirmDialog";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function catColor(cat: string): string {
  const c = cat?.toLowerCase() || "";
  if (c.includes("entertainment")) return "bg-rose-600";
  if (c.includes("politics"))      return "bg-blue-700";
  if (c.includes("news"))          return "bg-amber-600";
  if (c.includes("gossip"))        return "bg-purple-600";
  if (c.includes("sports"))        return "bg-green-700";
  if (c.includes("tech"))          return "bg-cyan-700";
  return "bg-zinc-600";
}

function proxyImg(url: string, w = 300): string {
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
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

type Tab = "dashboard" | "create" | "manage" | "authors";

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // GA4 views
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [viewsLoading, setViewsLoading] = useState(true);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Record<string, AuthorProfile>>({});
  const [isCustomAuthor, setIsCustomAuthor] = useState(false);

  const [newPost, setNewPost] = useState({
    title: "", slug: "", excerpt: "", category: "News", content: "",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    author: "Za Ndani", tags: ""
  });

  const [inlineAuthor, setInlineAuthor] = useState<AuthorProfile>({
    name: "", role: "Contributing Writer", bio: "", avatar: "",
    location: "Kenya", socials: { twitter: "", linkedin: "", email: "" }
  });

  useEffect(() => {
    if (isAdminAuthenticated()) { setIsAuthenticated(true); loadData(); }
  }, []);

  async function loadData() {
    setPosts(getAllPosts());
    setViewsLoading(true);
    try {
      const res = await fetch('/api/get-views');
      if (res.ok) setViewCounts(await res.json());
    } catch {}
    setViewsLoading(false);

    const catJson = await getGithubFileContent('content/categories.json');
    if (catJson) { try { setCategories(JSON.parse(catJson)); } catch { setCategories(defaultCategories); } }
    else setCategories(defaultCategories);

    const authJson = await getGithubFileContent('content/authors.json');
    if (authJson) { try { setAuthors(JSON.parse(authJson)); } catch { setAuthors({}); } }
  }

  // ── GA4 enriched posts ──
  const postsWithViews = useMemo(() =>
    posts.map(post => {
      const clean = post.slug.replace(/^\//, '').replace(/\.md$/, '');
      const v = viewCounts[`/article/${clean}`] || viewCounts[`/article/${clean}/`] || 0;
      return { ...post, views: v > 0 ? v : 0 };
    }),
    [posts, viewCounts]
  );

  // ── Dashboard analytics ──
  const analytics = useMemo(() => {
    const totalViews = postsWithViews.reduce((s, p) => s + p.views, 0);
    const topPosts = [...postsWithViews].sort((a, b) => b.views - a.views).slice(0, 5);
    const byCategory: Record<string, { count: number; views: number }> = {};
    postsWithViews.forEach(p => {
      const cat = p.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = { count: 0, views: 0 };
      byCategory[cat].count++;
      byCategory[cat].views += p.views;
    });
    const catStats = Object.entries(byCategory)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.views - a.views);

    const byAuthor: Record<string, { count: number; views: number }> = {};
    postsWithViews.forEach(p => {
      const a = p.author || "Unknown";
      if (!byAuthor[a]) byAuthor[a] = { count: 0, views: 0 };
      byAuthor[a].count++;
      byAuthor[a].views += p.views;
    });
    const authorStats = Object.entries(byAuthor)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.views - a.views);

    // Posts last 7 days
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const recentCount = posts.filter(p => new Date(p.date).getTime() > sevenDaysAgo).length;

    // Zero-view posts (published but no traction)
    const noTraction = postsWithViews.filter(p => p.views === 0).slice(0, 5);

    return { totalViews, topPosts, catStats, authorStats, recentCount, noTraction };
  }, [postsWithViews]);

  useEffect(() => {
    if (newPost.category && !categories.some(c => c.name === newPost.category)) setIsCustomCategory(true);
    else setIsCustomCategory(false);
  }, [newPost.category, categories]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePin(pin)) {
      setIsAuthenticated(true); setAdminAuthenticated(true); loadData(); setPinError("");
    } else { setPinError("Invalid PIN. Try again."); setPin(""); }
  };

  const handleLogout = () => {
    setIsAuthenticated(false); setAdminAuthenticated(false);
    setActiveTab("dashboard"); resetPostForm();
  };

  const submitToIndexNow = async (slug: string) => {
    try { await supabase.functions.invoke('index-now', { body: { urls: [`/article/${slug}`] } }); } catch {}
  };

  const handlePublish = async (isUpdate: boolean) => {
    if (!newPost.title || !newPost.content) {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }
    setIsPublishing(true);
    let finalAuthorName = newPost.author;
    try {
      if (isCustomAuthor && inlineAuthor.name) {
        finalAuthorName = inlineAuthor.name;
        const updatedAuthors = { ...authors, [inlineAuthor.name]: inlineAuthor };
        const sha = await getGithubFileSha('content/authors.json');
        await pushToGithub('content/authors.json', JSON.stringify(updatedAuthors, null, 2), `Add author: ${inlineAuthor.name}`, sha || undefined);
        setAuthors(updatedAuthors);
      }
      if (newPost.category && !categories.some(c => c.name === newPost.category)) {
        const newSlug = generateSlug(newPost.category);
        const newCats = [...categories, { name: newPost.category, slug: newSlug }];
        const sha = await getGithubFileSha('content/categories.json');
        await pushToGithub('content/categories.json', JSON.stringify(newCats, null, 2), `Add category: ${newPost.category}`, sha);
        setCategories(newCats);
      }
      const postSlug = newPost.slug || generateSlug(newPost.title);
      const filePath = `content/posts/${postSlug}.md`;
      const tagsFormatted = (newPost.tags || "").split(',').map(t => t.trim()).filter(Boolean).join(', ');
      const markdown = `---\ntitle: "${newPost.title}"\nslug: "${postSlug}"\nexcerpt: "${newPost.excerpt}"\nauthor: "${finalAuthorName}"\nimage: "${newPost.image}"\ncategory: "${newPost.category}"\ndate: "${editingPost?.date || new Date().toISOString().split('T')[0]}"\ntags: [${tagsFormatted}]\n---\n\n${newPost.content}`;

      if (isUpdate && editingPost && editingPost.slug !== postSlug) {
        const oldSha = await getGithubFileSha(`content/posts/${editingPost.slug}.md`);
        if (oldSha) await deleteFromGithub(`content/posts/${editingPost.slug}.md`, `Delete old slug`, oldSha);
      }
      const sha = await getGithubFileSha(filePath);
      await pushToGithub(filePath, markdown, `${isUpdate ? 'Update' : 'Publish'}: ${newPost.title}`, sha);
      await submitToIndexNow(postSlug);
      toast({ title: "Published!", description: "Story is live on Za Ndani." });
      resetPostForm(); loadData();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally { setIsPublishing(false); }
  };

  const confirmDeletePost = async () => {
    if (!showDeleteConfirm) return;
    setIsDeleting(true);
    const post = posts.find(p => p.slug === showDeleteConfirm);
    if (!post) return;
    try {
      const sha = await getGithubFileSha(`content/posts/${post.slug}.md`);
      if (sha) { await deleteFromGithub(`content/posts/${post.slug}.md`, `Delete: ${post.title}`, sha); toast({ title: "Deleted" }); loadData(); }
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally { setShowDeleteConfirm(null); setIsDeleting(false); }
  };

  const resetPostForm = () => {
    setNewPost({ title: "", slug: "", excerpt: "", category: "News", content: "",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800", author: "Za Ndani", tags: "" });
    setEditingPost(null); setIsCustomAuthor(false);
    setInlineAuthor({ name: "", role: "Contributing Writer", bio: "", avatar: "", location: "Kenya", socials: { twitter: "", linkedin: "", email: "" } });
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({ title: post.title||"", slug: post.slug||"", excerpt: post.excerpt||"", category: post.category||"News",
      content: post.content||"", image: post.image||"", author: post.author||"Za Ndani", tags: post.tags?.join(", ")||"" });
    setIsCustomAuthor(false); setActiveTab("create");
  };

  const filteredPosts = useMemo(() =>
    postsWithViews
      .filter(p => {
        const s = searchTerm.toLowerCase();
        return (p.title||"").toLowerCase().includes(s) || (p.category||"").toLowerCase().includes(s);
      })
      .filter(p => filterCategory === "All" || p.category === filterCategory)
      .sort((a, b) => new Date(b.date||0).getTime() - new Date(a.date||0).getTime()),
    [postsWithViews, searchTerm, filterCategory]
  );

  // ── LOCK SCREEN ──
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <div className="bg-zinc-900 border border-zinc-800 p-10 max-w-sm w-full mx-4">
            <div className="h-1 w-full bg-primary mb-8" />
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-primary flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-none">Za Ndani</p>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Admin Dashboard</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 block mb-2">Enter PIN</label>
                <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                  className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 text-white text-center text-3xl font-mono tracking-[0.5em] focus:border-primary outline-none transition-colors"
                  maxLength={4} autoFocus />
              </div>
              {pinError && <p className="text-red-400 text-xs text-center font-bold">{pinError}</p>}
              <button type="submit"
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-wider text-sm hover:opacity-90 transition-opacity">
                Unlock Dashboard
              </button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  // ── NAV ITEMS ──
  const navItems: { tab: Tab; icon: React.ReactNode; label: string; badge?: string }[] = [
    { tab: "dashboard", icon: <BarChart2 className="w-4 h-4" />, label: "Dashboard" },
    { tab: "create",    icon: <Plus className="w-4 h-4" />,      label: editingPost ? "Editing Post" : "New Story" },
    { tab: "manage",    icon: <FileText className="w-4 h-4" />,   label: "All Posts", badge: String(posts.length) },
    { tab: "authors",   icon: <Users className="w-4 h-4" />,      label: "Authors",   badge: String(Object.keys(authors).length) },
  ];

  return (
    <Layout>
      <div className="flex min-h-screen bg-zinc-950">

        {/* ── SIDEBAR ── */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 hidden lg:flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-black leading-none">Za Ndani</p>
                <p className="text-zinc-600 text-[10px] uppercase tracking-widest">CMS</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                  activeTab === item.tab
                    ? "bg-primary text-white font-black"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}>
                <span className="flex items-center gap-3">{item.icon}{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-black px-2 py-0.5 ${activeTab === item.tab ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-white font-black text-lg capitalize">
                {activeTab === "dashboard" ? "Analytics Dashboard" :
                 activeTab === "create" ? (editingPost ? `Editing: ${editingPost.title?.slice(0,30)}…` : "New Story") :
                 activeTab === "manage" ? "Manage Posts" : "Authors"}
              </h1>
              <p className="text-zinc-600 text-xs">
                {viewsLoading ? "Loading analytics..." : `${posts.length} posts · ${(analytics.totalViews / 1000).toFixed(1)}k total views`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile nav */}
              <div className="flex lg:hidden gap-1">
                {navItems.map(item => (
                  <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                    className={`p-2 transition-colors ${activeTab === item.tab ? "text-primary" : "text-zinc-500"}`}>
                    {item.icon}
                  </button>
                ))}
              </div>
              <button onClick={() => loadData()}
                className="hidden lg:flex items-center gap-2 px-3 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-black uppercase tracking-wider transition-colors">
                Refresh
              </button>
              <button onClick={handleLogout}
                className="lg:hidden p-2 text-zinc-500 hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 max-w-6xl mx-auto">

            {/* ════════════════════════════════════════════════════
                TAB: DASHBOARD
            ════════════════════════════════════════════════════ */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">

                {/* KPI row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Views", value: analytics.totalViews > 999 ? `${(analytics.totalViews/1000).toFixed(1)}k` : analytics.totalViews, icon: <Eye className="w-5 h-5" />, sub: "All time" },
                    { label: "Total Posts", value: posts.length, icon: <FileText className="w-5 h-5" />, sub: "Published" },
                    { label: "This Week", value: analytics.recentCount, icon: <Clock className="w-5 h-5" />, sub: "New stories" },
                    { label: "Top Story", value: analytics.topPosts[0]?.views > 999 ? `${(analytics.topPosts[0].views/1000).toFixed(1)}k` : analytics.topPosts[0]?.views || 0, icon: <Flame className="w-5 h-5" />, sub: "Most views" },
                  ].map(kpi => (
                    <div key={kpi.label} className="border border-zinc-800 bg-zinc-900 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-zinc-500 text-xs font-black uppercase tracking-wider">{kpi.label}</span>
                        <span className="text-zinc-600">{kpi.icon}</span>
                      </div>
                      <p className="text-3xl font-black text-white mb-1">
                        {viewsLoading ? <Loader2 className="w-6 h-6 animate-spin text-zinc-600" /> : kpi.value}
                      </p>
                      <p className="text-zinc-600 text-xs">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">

                  {/* Top 5 articles */}
                  <div className="border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Top Articles by Views</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {analytics.topPosts.map((post, i) => (
                        <div key={post.slug} className="flex items-center gap-4 p-4">
                          <span className="text-2xl font-serif font-black text-zinc-700 w-6 flex-shrink-0">{i+1}</span>
                          <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
                            <img src={proxyImg(post.image)} alt={post.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold line-clamp-1">{post.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] font-black uppercase text-white px-1.5 py-0.5 ${catColor(post.category)}`}>
                                {post.category}
                              </span>
                              <span className="text-zinc-600 text-[10px]">{post.author}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-primary font-black text-sm">
                              {post.views > 999 ? `${(post.views/1000).toFixed(1)}k` : post.views}
                            </p>
                            <p className="text-zinc-600 text-[10px]">views</p>
                          </div>
                          <button onClick={() => handleEditPost(post)}
                            className="p-1.5 text-zinc-600 hover:text-white transition-colors flex-shrink-0">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category performance */}
                  <div className="border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
                      <BarChart2 className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Category Performance</h2>
                    </div>
                    <div className="p-5 space-y-4">
                      {analytics.catStats.slice(0, 6).map(cat => {
                        const maxViews = analytics.catStats[0]?.views || 1;
                        const pct = Math.round((cat.views / maxViews) * 100);
                        return (
                          <div key={cat.name}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 flex-shrink-0 ${catColor(cat.name)}`} />
                                <span className="text-xs font-bold text-white">{cat.name}</span>
                                <span className="text-[10px] text-zinc-600">{cat.count} posts</span>
                              </div>
                              <span className="text-xs font-black text-primary">
                                {cat.views > 999 ? `${(cat.views/1000).toFixed(1)}k` : cat.views}
                              </span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 w-full">
                              <div className={`h-full ${catColor(cat.name)} transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Author leaderboard */}
                  <div className="border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
                      <Users className="w-4 h-4 text-primary" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Author Leaderboard</h2>
                    </div>
                    <div className="divide-y divide-zinc-800">
                      {analytics.authorStats.map((a, i) => (
                        <div key={a.name} className="flex items-center gap-4 px-5 py-3">
                          <span className="text-xl font-serif font-black text-zinc-700 w-5 flex-shrink-0">{i+1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-bold">{a.name}</p>
                            <p className="text-zinc-600 text-[10px]">{a.count} stories published</p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-black text-sm">
                              {a.views > 999 ? `${(a.views/1000).toFixed(1)}k` : a.views}
                            </p>
                            <p className="text-zinc-600 text-[10px]">views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dead posts — no traction */}
                  <div className="border border-zinc-800 bg-zinc-900">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
                      <ArrowDown className="w-4 h-4 text-rose-500" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-white">Zero Traction Posts</h2>
                      <span className="text-[10px] text-zinc-600 ml-auto">Consider updating or deleting</span>
                    </div>
                    {analytics.noTraction.length === 0 ? (
                      <div className="p-8 text-center">
                        <ArrowUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-zinc-400 text-sm">All posts have traffic 🎉</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800">
                        {analytics.noTraction.map(post => (
                          <div key={post.slug} className="flex items-center gap-4 p-4">
                            <div className="w-10 h-10 flex-shrink-0 overflow-hidden">
                              <img src={proxyImg(post.image)} alt={post.title} className="w-full h-full object-cover opacity-50" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-zinc-300 text-xs font-bold line-clamp-1">{post.title}</p>
                              <p className="text-zinc-600 text-[10px]">{timeAgo(post.date)} · {post.category}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button onClick={() => handleEditPost(post)}
                                className="p-1.5 text-zinc-600 hover:text-white transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setShowDeleteConfirm(post.slug)}
                                className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick publish CTA */}
                <div className="border border-zinc-800 bg-zinc-900 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-black text-lg">Ready to publish something new?</p>
                    <p className="text-zinc-500 text-sm">Keep your topical clusters fresh — Google rewards consistency.</p>
                  </div>
                  <button onClick={() => setActiveTab("create")}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black uppercase tracking-wider text-sm hover:opacity-90 transition-opacity flex-shrink-0">
                    <Plus className="w-4 h-4" /> New Story
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                TAB: CREATE / EDIT
            ════════════════════════════════════════════════════ */}
            {activeTab === "create" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="border border-zinc-800 bg-zinc-900 p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Story Title" value={newPost.title}
                      onChange={e => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
                      className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 focus:border-primary outline-none transition-colors text-sm"
                    />
                    <input type="text" placeholder="Slug" value={newPost.slug}
                      onChange={e => setNewPost({ ...newPost, slug: e.target.value })}
                      className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 font-mono text-xs focus:border-primary outline-none transition-colors"
                    />
                  </div>

                  <textarea placeholder="Excerpt (appears on homepage)" value={newPost.excerpt}
                    onChange={e => setNewPost({ ...newPost, excerpt: e.target.value })}
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 focus:border-primary outline-none transition-colors text-sm" rows={2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select value={isCustomCategory ? 'add-new' : newPost.category}
                      onChange={e => {
                        if (e.target.value === 'add-new') { setIsCustomCategory(true); setNewPost({ ...newPost, category: "" }); }
                        else { setIsCustomCategory(false); setNewPost({ ...newPost, category: e.target.value }); }
                      }}
                      className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white focus:border-primary outline-none text-sm">
                      {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                      <option value="add-new">+ New Category</option>
                    </select>

                    <select value={isCustomAuthor ? 'add-new' : newPost.author}
                      onChange={e => {
                        if (e.target.value === 'add-new') { setIsCustomAuthor(true); setNewPost({ ...newPost, author: "" }); }
                        else { setIsCustomAuthor(false); setNewPost({ ...newPost, author: e.target.value }); }
                      }}
                      className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white focus:border-primary outline-none text-sm">
                      <option value="Za Ndani">Za Ndani</option>
                      {Object.keys(authors).filter(n => n !== "Za Ndani").map(n => <option key={n} value={n}>{n}</option>)}
                      <option value="add-new">+ Add New Author</option>
                    </select>

                    <input type="text" placeholder="Tags (comma separated)" value={newPost.tags}
                      onChange={e => setNewPost({ ...newPost, tags: e.target.value })}
                      className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 text-sm focus:border-primary outline-none transition-colors"
                    />
                  </div>

                  {isCustomAuthor && (
                    <div className="p-4 border border-primary/30 bg-primary/5 space-y-3">
                      <p className="text-primary text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Quick Add Author
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Full Name *" value={inlineAuthor.name}
                          onChange={e => setInlineAuthor({ ...inlineAuthor, name: e.target.value })}
                          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 text-sm outline-none" />
                        <input type="text" placeholder="Role / Title" value={inlineAuthor.role}
                          onChange={e => setInlineAuthor({ ...inlineAuthor, role: e.target.value })}
                          className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 text-sm outline-none" />
                      </div>
                      <textarea placeholder="Short bio *" value={inlineAuthor.bio}
                        onChange={e => setInlineAuthor({ ...inlineAuthor, bio: e.target.value })}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 text-sm outline-none" rows={2} />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-500 block mb-2">Featured Image URL</label>
                    <div className="flex gap-3">
                      <input type="text" placeholder="https://..." value={newPost.image}
                        onChange={e => setNewPost({ ...newPost, image: e.target.value })}
                        className="flex-1 p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 font-mono text-xs focus:border-primary outline-none transition-colors" />
                      {newPost.image && (
                        <img src={newPost.image} alt="preview" className="w-14 h-14 object-cover border border-zinc-700 flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  <textarea placeholder="Full story content (Markdown supported)" value={newPost.content}
                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full p-4 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 font-mono text-xs leading-relaxed focus:border-primary outline-none transition-colors" rows={16}
                  />

                  <div className="flex gap-3 pt-2 border-t border-zinc-800">
                    <button onClick={resetPostForm}
                      className="flex-1 py-3 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-sm font-black uppercase tracking-wider transition-colors">
                      Clear
                    </button>
                    <button onClick={() => handlePublish(!!editingPost)} disabled={isPublishing}
                      className="flex-1 py-3 bg-primary text-white text-sm font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                      {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                      {editingPost ? "Update Story" : "Publish to GitHub"}
                    </button>
                  </div>
                </div>

                {/* Live preview */}
                <div className="border border-zinc-800 bg-zinc-900 hidden lg:block">
                  <div className="px-5 py-4 border-b border-zinc-800">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5" /> Live Preview
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="border border-zinc-800 overflow-hidden">
                      {newPost.image && (
                        <div className="relative h-44 overflow-hidden">
                          <img src={newPost.image} alt="preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          {newPost.category && (
                            <span className={`absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 ${catColor(newPost.category)}`}>
                              {newPost.category}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-5 bg-zinc-900">
                        <h3 className="text-white font-serif font-black text-lg leading-tight mb-2">
                          {newPost.title || "Your title will appear here…"}
                        </h3>
                        <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                          {newPost.excerpt || "Your excerpt will appear here…"}
                        </p>
                        <div className="flex items-center gap-3 text-zinc-600 text-xs border-t border-zinc-800 pt-3">
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{newPost.author || "Author"}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Just now</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-center text-zinc-700 mt-4">Updates live as you type</p>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                TAB: MANAGE POSTS
            ════════════════════════════════════════════════════ */}
            {activeTab === "manage" && (
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input type="text" placeholder="Search by title or category…" value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 text-sm focus:border-primary outline-none transition-colors" />
                  </div>
                  <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-primary">
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                  <p className="py-3 text-zinc-600 text-sm flex items-center gap-1 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" /> {filteredPosts.length} results
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPosts.map(post => (
                    <div key={post.slug} className="border border-zinc-800 bg-zinc-900 hover:border-zinc-600 transition-colors overflow-hidden group">
                      {post.image && (
                        <div className="relative h-36 overflow-hidden">
                          <img src={proxyImg(post.image, 400)} alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <span className={`absolute bottom-2 left-2 text-[9px] font-black uppercase tracking-wider text-white px-1.5 py-0.5 ${catColor(post.category)}`}>
                            {post.category}
                          </span>
                          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-white bg-black/60 px-1.5 py-0.5">
                            <Eye className="w-3 h-3" />
                            {post.views > 999 ? `${(post.views/1000).toFixed(1)}k` : post.views || "—"}
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <p className="text-white text-sm font-bold line-clamp-2 leading-snug mb-2">{post.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 mb-4">
                          <span>{post.author}</span>
                          <span>·</span>
                          <span>{timeAgo(post.date)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditPost(post)}
                            className="flex-1 py-2 border border-zinc-700 text-zinc-400 hover:text-white hover:border-primary text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => setShowDeleteConfirm(post.slug)}
                            className="flex-1 py-2 border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-800 text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-32">
                    <FileText className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                    <p className="text-zinc-600 text-sm">No posts match your search</p>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                TAB: AUTHORS
            ════════════════════════════════════════════════════ */}
            {activeTab === "authors" && (
              <AuthorsManager onAuthorsLoaded={setAuthors} />
            )}

          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="Delete this story?"
        description="This action cannot be undone. The post will be permanently removed from GitHub."
        isLoading={isDeleting}
        confirmLabel="Yes, Delete"
        onConfirm={confirmDeletePost}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </Layout>
  );
}