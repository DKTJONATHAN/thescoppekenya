import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post } from "@/lib/markdown";
import { Lock, Plus, Edit, Trash2, Eye, Save } from "lucide-react";

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
  const [editingPost, setEditingPost] = useState<Post | null>(null);
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
    const markdown = `---
title: "${newPost.title}"
slug: "${newPost.slug || generateSlug(newPost.title)}"
excerpt: "${newPost.excerpt}"
image: "${newPost.image}"
category: "${newPost.category}"
author: "${newPost.author}"
date: "${new Date().toISOString().split('T')[0]}"
tags: [${newPost.tags.split(',').map(t => `"${t.trim()}"`).join(', ')}]
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

    alert('Post markdown file downloaded! Add it to content/posts/ folder.');
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
          <div className="bg-surface rounded-2xl p-8 border border-divider text-center">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-headline mb-2">Admin Access</h1>
            <p className="text-muted-foreground mb-6">Enter your PIN to continue</p>
            
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="w-full px-4 py-3 rounded-xl border border-divider bg-background text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                maxLength={4}
              />
              {error && <p className="text-destructive text-sm mb-4">{error}</p>}
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">
                Unlock
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold text-headline">Admin Panel</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>

        {/* Create New Post */}
        <div className="bg-surface rounded-2xl p-6 border border-divider mb-8">
          <h2 className="text-xl font-serif font-bold text-headline mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create New Post
          </h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
              className="px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Slug (auto-generated)"
              value={newPost.slug}
              onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
              className="px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <input
            type="text"
            placeholder="Excerpt / Summary"
            value={newPost.excerpt}
            onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          />
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <select
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
              className="px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="News">News</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Gossip">Gossip</option>
              <option value="Sports">Sports</option>
              <option value="Business">Business</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
            <input
              type="text"
              placeholder="Author"
              value={newPost.author}
              onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
              className="px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={newPost.tags}
              onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
              className="px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <input
            type="text"
            placeholder="Image URL"
            value={newPost.image}
            onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          />
          <textarea
            placeholder="Post content (Markdown supported)"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-divider bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4 resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={newPost.featured}
                onChange={(e) => setNewPost({ ...newPost, featured: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm">Featured Post</span>
            </label>
            <Button onClick={handleCreatePost} className="gradient-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Download Markdown
            </Button>
          </div>
        </div>

        {/* Existing Posts */}
        <div className="bg-surface rounded-2xl p-6 border border-divider">
          <h2 className="text-xl font-serif font-bold text-headline mb-6">Existing Posts ({posts.length})</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.slug} className="flex items-center justify-between p-4 bg-background rounded-xl border border-divider">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-headline truncate">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">{post.category} • {post.date}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`/article/${post.slug}`} target="_blank"><Eye className="w-4 h-4" /></a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}