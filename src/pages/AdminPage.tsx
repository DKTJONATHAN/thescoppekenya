import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { getAllPosts, Post, categories as defaultCategories } from "@/lib/markdown";
import { Lock, Plus, Eye, FileText, LogOut, Calendar, Tag, User, Image, AlignLeft, Loader2, Pencil, Trash2, X, Github, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const utf8ToBase64 = (str: string) => {
  return window.btoa(unescape(encodeURIComponent(str)));
};

const base64ToUtf8 = (base64: string): string => {
  return decodeURIComponent(escape(window.atob(base64)));
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [newPost, setNewPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: "News",
    content: "",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    author: "The Scoop KE",
    tags: ""
  });

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  async function loadData() {
    setPosts(getAllPosts());
    const categoriesJson = await getGithubFileContent('content/categories.json');
    if (categoriesJson) {
      try {
        setCategories(JSON.parse(categoriesJson));
      } catch (e) {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }
  }

  useEffect(() => {
    if (newPost.category && !categories.some(cat => cat.name === newPost.category)) {
      setIsCustomCategory(true);
    } else {
      setIsCustomCategory(false);
    }
  }, [newPost.category, categories]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const hashedInput = hashPin(pin);
    if (VALID_HASHES.includes(hashedInput)) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      loadData();
      setError("");
    } else {
      setError("Invalid PIN. Try again.");
      setPin("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
    setActiveTab("create");
    resetForm();
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const callGithubApi = async (payload: any) => {
    const res = await fetch('/api/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "GitHub Error");
    return data;
  };

  const getGithubFileSha = async (path: string) => {
    try {
      const data = await callGithubApi({ action: 'GET_SHA', path });
      return data.sha;
    } catch (error) {
      return null;
    }
  };

  const getGithubFileContent = async (path: string) => {
    try {
      const data = await callGithubApi({ action: 'GET_CONTENT', path });
      return base64ToUtf8(data.content);
    } catch (error) {
      return null;
    }
  };

  const pushToGithub = async (path: string, content: string, message: string, sha?: string) => {
    return await callGithubApi({
      action: 'PUSH',
      path,
      content: utf8ToBase64(content),
      message,
      sha
    });
  };

  const deleteFromGithub = async (path: string, message: string, sha: string) => {
    return await callGithubApi({ action: 'DELETE', path, message, sha });
  };

  const submitToIndexNow = async (slug: string) => {
    try {
      await supabase.functions.invoke('index-now', {
        body: { urls: [`/article/${slug}`] }
      });
    } catch (err) {
      console.error("IndexNow error", err);
    }
  };

  const handlePublish = async (isUpdate: boolean) => {
    if (!newPost.title || !newPost.content) {
      toast({ title: "Missing fields", description: "Title and content are required.", variant: "destructive" });
      return;
    }

    setIsPublishing(true);
    const postSlug = newPost.slug || generateSlug(newPost.title);
    const filePath = `content/posts/${postSlug}.md`;

    const tagsFormatted = (newPost.tags || "")
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .join(', ');

    const markdown = `---
title: "${newPost.title}"
slug: "${postSlug}"
excerpt: "${newPost.excerpt}"
author: "${newPost.author}"
image: "${newPost.image}"
category: "${newPost.category}"
date: "${editingPost?.date || new Date().toISOString().split('T')[0]}"
tags: [${tagsFormatted}]
---

${newPost.content}`;

    try {
      if (newPost.category && !categories.some(c => c.name === newPost.category)) {
        const newSlug = generateSlug(newPost.category);
        const newCategories = [...categories, { name: newPost.category, slug: newSlug }];
        const categoriesSha = await getGithubFileSha('content/categories.json');
        await pushToGithub('content/categories.json', JSON.stringify(newCategories, null, 2), `Add category: ${newPost.category}`, categoriesSha);
        setCategories(newCategories);
      }

      if (isUpdate && editingPost && editingPost.slug !== postSlug) {
        const oldSha = await getGithubFileSha(`content/posts/${editingPost.slug}.md`);
        if (oldSha) await deleteFromGithub(`content/posts/${editingPost.slug}.md`, `Delete old slug`, oldSha);
      }

      const sha = await getGithubFileSha(filePath);
      await pushToGithub(filePath, markdown, `${isUpdate ? 'Update' : 'Publish new'} story: ${newPost.title}`, sha);
      await submitToIndexNow(postSlug);

      toast({ title: "Published!", description: "Story is now live on Za Ndani." });
      resetForm();
      loadData();
    } catch (error: any) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (post: Post) => {
    setShowDeleteConfirm(post.slug);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    setIsDeleting(true);
    const post = posts.find(p => p.slug === showDeleteConfirm);
    if (!post) return;

    try {
      const sha = await getGithubFileSha(`content/posts/${post.slug}.md`);
      if (sha) {
        await deleteFromGithub(`content/posts/${post.slug}.md`, `Delete story: ${post.title}`, sha);
        toast({ title: "Deleted", description: "Story removed from GitHub." });
        loadData();
      }
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } finally {
      setShowDeleteConfirm(null);
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setNewPost({
      title: "", slug: "", excerpt: "", category: "News", content: "",
      image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
      author: "The Scoop KE", tags: ""
    });
    setEditingPost(null);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setNewPost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      content: post.content,
      image: post.image,
      author: post.author || "The Scoop KE",
      tags: post.tags ? post.tags.join(", ") : ""
    });
    setActiveTab("create");
  };

  const filteredPosts = posts
    .filter(post => 
      (post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       post.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === "All" || post.category === filterCategory)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-surface/50">
          <div className="bg-surface p-10 border border-divider rounded-3xl shadow-soft max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-serif font-bold text-center mb-2">Za Ndani Admin</h1>
            <p className="text-center text-muted-foreground mb-8">Enter your 4-digit PIN</p>
            
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-6 py-5 rounded-2xl border border-divider bg-background text-center text-4xl font-mono tracking-widest mb-4"
                maxLength={4}
                autoFocus
              />
              {error && <p className="text-red-500 text-center mb-6">{error}</p>}
              <Button type="submit" className="w-full py-6 text-lg gradient-primary">Unlock Dashboard</Button>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex min-h-screen bg-surface">
        {/* Sidebar */}
        <div className="w-72 border-r border-divider bg-surface p-6 hidden lg:flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-primary rounded-xl" />
            <div>
              <div className="font-serif font-bold text-xl">Za Ndani</div>
              <div className="text-xs text-muted-foreground -mt-1">ADMIN</div>
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            <button
              onClick={() => setActiveTab("create")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left ${activeTab === "create" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <Plus className="w-5 h-5" />
              Create New Story
            </button>
            <button
              onClick={() => setActiveTab("manage")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left ${activeTab === "manage" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <FileText className="w-5 h-5" />
              Manage Posts ({posts.length})
            </button>
          </nav>

          <Button variant="outline" onClick={handleLogout} className="mt-auto">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        <div className="flex-1">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h1 className="text-4xl font-serif font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Push stories live to Za Ndani in seconds</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="lg:hidden">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>

            {activeTab === "create" && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-surface border border-divider rounded-3xl p-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Story Title"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value, slug: generateSlug(e.target.value) })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background text-lg"
                      />
                      <input
                        type="text"
                        placeholder="Slug (auto-generated)"
                        value={newPost.slug}
                        onChange={(e) => setNewPost({ ...newPost, slug: e.target.value })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background font-mono"
                      />
                    </div>

                    <textarea
                      placeholder="Short excerpt that appears on homepage"
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      className="w-full p-4 rounded-2xl border border-divider bg-background"
                      rows={3}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select
                        value={isCustomCategory ? 'add-new' : newPost.category}
                        onChange={(e) => {
                          if (e.target.value === 'add-new') {
                            setIsCustomCategory(true);
                            setNewPost({ ...newPost, category: "" });
                          } else {
                            setIsCustomCategory(false);
                            setNewPost({ ...newPost, category: e.target.value });
                          }
                        }}
                        className="w-full p-4 rounded-2xl border border-divider bg-background"
                      >
                        {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                        <option value="add-new">+ New Category</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Author"
                        value={newPost.author}
                        onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background"
                      />
                      <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        value={newPost.tags}
                        onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                        className="w-full p-4 rounded-2xl border border-divider bg-background"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground block mb-2">Featured Image URL</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={newPost.image}
                          onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                          className="flex-1 p-4 rounded-2xl border border-divider bg-background font-mono"
                        />
                        {newPost.image && (
                          <img src={newPost.image} alt="preview" className="w-16 h-16 object-cover rounded-2xl border border-divider" />
                        )}
                      </div>
                    </div>

                    <textarea
                      placeholder="Full story content (Markdown supported)"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full p-4 rounded-3xl border border-divider bg-background font-mono text-sm leading-relaxed"
                      rows={14}
                    />

                    <div className="flex gap-3 pt-4 border-t border-divider">
                      <Button variant="outline" onClick={resetForm} className="flex-1">Clear Form</Button>
                      <Button onClick={() => handlePublish(!!editingPost)} disabled={isPublishing} className="flex-1 gradient-primary">
                        {isPublishing ? <Loader2 className="animate-spin mr-2" /> : <Github className="mr-2" />}
                        {editingPost ? 'Update Story' : 'Publish to GitHub'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="bg-surface border border-divider rounded-3xl p-8 hidden lg:block">
                  <div className="sticky top-8">
                    <div className="text-sm uppercase tracking-widest text-muted-foreground mb-4">LIVE PREVIEW</div>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-divider shadow-inner">
                      {newPost.image && (
                        <img src={newPost.image} alt="preview" className="w-full h-48 object-cover" />
                      )}
                      <div className="p-6">
                        <div className="font-serif text-2xl font-bold leading-tight mb-3">{newPost.title || "Your title will appear here"}</div>
                        <div className="text-sm text-muted-foreground mb-4">{newPost.excerpt || "Excerpt preview..."}</div>
                        <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: newPost.content.replace(/\n/g, '<br>') }} />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-6">Preview updates live as you type</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "manage" && (
              <div className="bg-surface border border-divider rounded-3xl p-8">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-divider bg-background"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-6 py-4 rounded-2xl border border-divider bg-background"
                  >
                    <option value="All">All Categories</option>
                    {categories.map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map(post => (
                    <div key={post.slug} className="bg-background border border-divider rounded-3xl overflow-hidden group">
                      {post.image && (
                        <div className="h-48 overflow-hidden">
                          <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="font-medium line-clamp-2 mb-2">{post.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                          <span>{post.category}</span>
                          <span>•</span>
                          <span>{post.date}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditPost(post)} className="flex-1">
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeletePost(post)} className="flex-1 text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/article/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPosts.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">No stories match your search</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2">Delete this story?</h3>
            <p className="text-muted-foreground mb-8">This action cannot be undone. The post will be permanently removed from GitHub.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} className="flex-1">Cancel</Button>
              <Button onClick={confirmDelete} disabled={isDeleting} variant="destructive" className="flex-1">
                {isDeleting ? <Loader2 className="animate-spin mr-2" /> : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}