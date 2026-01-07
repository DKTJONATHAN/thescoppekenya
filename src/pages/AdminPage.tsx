import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories } from "@/lib/markdown";
import { Lock, Plus, Eye, Save, FileText, LogOut, Calendar, Tag, User, Image, AlignLeft, Star } from "lucide-react";

// Simple hash function for PIN verification
const hashPin = (pin: string): string => {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const VALID_HASHES = [hashPin("1711"), hashPin("2000")];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "News",
    content: "",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    author: "The Scoop KE",
    tags: "",
    featured: false
  });

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      setPosts(getAllPosts());
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const hashedInput = hashPin(pin);
    if (VALID_HASHES.includes(hashedInput)) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      setPosts(getAllPosts());
      setError("");
    } else {
      setError("Invalid PIN. Please try again.");
    }
    setPin("");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) {
      alert("Please fill in the title and content.");
      return;
    }

    const markdown = `---
title: "${newPost.title}"
slug: "${newPost.slug || generateSlug(newPost.title)}"
excerpt: "${newPost.excerpt}"
image: "${newPost.image}"
category: "${newPost.category}"
author: "${newPost.author}"
date: "${new Date().toISOString().split('T')[0]}"
tags: [${newPost.tags.split(',').map(t => `"${t.trim()}"`).filter(t => t !== '""').join(', ')}]
featured: ${newPost.featured}
---

${newPost.content}`;

    // Create downloadable file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newPost.slug || generateSlug(newPost.title)}.md`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Post markdown file downloaded! Add it to content/posts/ folder and redeploy.');
    resetForm();
  };

  const resetForm = () => {
    setNewPost({
      title: "", slug: "", excerpt: "", category: "News", content: "",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      author: "The Scoop KE", tags: "", featured: false
    });
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container max-w-md mx-auto px-4 py-20">
          <div className="bg-surface rounded-2xl p-8 border border-divider text-center shadow-elevated">
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-headline mb-2">Admin Access</h1>
            <p className="text-muted-foreground mb-8">Enter your PIN to access the admin panel</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="• • • •"
                className="w-full px-6 py-4 rounded-xl border border-divider bg-background text-center text-3xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                maxLength={4}
                autoFocus
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full gradient-primary text-primary-foreground py-6 text-lg">
                <Lock className="w-5 h-5 mr-2" />
                Unlock Admin Panel
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-headline">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your blog posts</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-divider">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "create"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create Post
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "manage"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Manage Posts ({posts.length})
          </button>
        </div>

        {activeTab === "create" && (
          <div className="bg-surface rounded-2xl p-6 md:p-8 border border-divider shadow-soft">
            <h2 className="text-xl font-serif font-bold text-headline mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Create New Post
            </h2>

            <div className="space-y-6">
              {/* Title & Slug */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <AlignLeft className="w-4 h-4" /> Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Tag className="w-4 h-4" /> Slug (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="auto-generated-slug"
                    value={newPost.slug}
                    onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" /> Excerpt / Summary
                </label>
                <textarea
                  placeholder="A brief summary of the post..."
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Category, Author, Tags */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4" /> Category
                  </label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.slug} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4" /> Author
                  </label>
                  <input
                    type="text"
                    placeholder="Author name"
                    value={newPost.author}
                    onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Tag className="w-4 h-4" /> Tags
                  </label>
                  <input
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Image className="w-4 h-4" /> Featured Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={newPost.image}
                  onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                />
                {newPost.image && (
                  <div className="mt-3 aspect-video max-w-xs rounded-lg overflow-hidden bg-muted">
                    <img src={newPost.image} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <AlignLeft className="w-4 h-4" /> Content (Markdown)
                </label>
                <textarea
                  placeholder="Write your post content here... Markdown is supported."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                />
              </div>

              {/* Featured checkbox & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-divider">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPost.featured}
                    onChange={(e) => setNewPost({ ...newPost, featured: e.target.checked })}
                    className="w-5 h-5 rounded border-divider text-primary focus:ring-primary"
                  />
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Star className="w-4 h-4 text-primary" />
                    Featured Post
                  </span>
                </label>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Clear Form
                  </Button>
                  <Button onClick={handleCreatePost} className="gradient-primary text-primary-foreground">
                    <Save className="w-4 h-4 mr-2" />
                    Download Markdown
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-surface rounded-2xl p-6 md:p-8 border border-divider shadow-soft">
            <h2 className="text-xl font-serif font-bold text-headline mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Existing Posts
            </h2>
            
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No posts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post, index) => (
                  <div 
                    key={post.slug} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-background rounded-xl border border-divider hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-headline truncate">{post.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {post.category}
                          </span>
                          <span>•</span>
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                          {post.featured && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary">
                                <Star className="w-3 h-3" /> Featured
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                      <a href={`/article/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> To edit or delete posts, modify the markdown files in the <code className="bg-background px-1.5 py-0.5 rounded">content/posts/</code> folder and redeploy your site.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}